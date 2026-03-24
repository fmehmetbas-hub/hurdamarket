const Stripe = require('stripe');
const db     = require('../db');
const logger = require('./logger');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ── Müşteri yönetimi ─────────────────────────────
/**
 * Kullanıcı için Stripe müşterisi oluşturur veya varsa döner.
 */
const getOrCreateCustomer = async (user) => {
  if (user.stripe_customer_id) return user.stripe_customer_id;

  const customer = await stripe.customers.create({
    name:     user.name,
    phone:    user.phone,
    email:    user.email || undefined,
    metadata: { user_id: user.id, platform: 'hurdamarket' },
  });

  await db.query(
    'UPDATE users SET stripe_customer_id=$1 WHERE id=$2',
    [customer.id, user.id]
  );

  return customer.id;
};

// ── Komisyon hesaplayıcı ─────────────────────────
const calculateCommission = (dealAmount, rate = null) => {
  const r = rate ?? Number(process.env.COMMISSION_RATE ?? 4);
  const commission = Math.round(dealAmount * (r / 100) * 100) / 100;
  return { commission, rate: r, dealAmount };
};

// ── Tek seferlik ödeme (komisyon) ────────────────
/**
 * Teklif kabul edildiğinde alıcı için ödeme linki oluşturur.
 * Alıcı bu linke girerek komisyonu öder.
 */
const createCommissionCheckout = async ({ offer, buyer, listing }) => {
  const { commission, rate } = calculateCommission(Number(offer.price));
  const customerId = await getOrCreateCustomer(buyer);

  const session = await stripe.checkout.sessions.create({
    customer:    customerId,
    mode:        'payment',
    currency:    'try',
    line_items: [{
      price_data: {
        currency:     'try',
        unit_amount:  Math.round(commission * 100), // kuruş
        product_data: {
          name:        `HurdaMarket Komisyon — ${listing.title}`,
          description: `Anlaşma tutarı: ${Number(offer.price).toLocaleString('tr-TR')} ₺ · Komisyon oranı: %${rate}`,
          metadata:    { offer_id: offer.id, listing_id: listing.id },
        },
      },
      quantity: 1,
    }],
    success_url:  `${process.env.FRONTEND_URL}/odeme/basarili?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:   `${process.env.FRONTEND_URL}/odeme/iptal?offer_id=${offer.id}`,
    metadata: {
      offer_id:   offer.id,
      buyer_id:   buyer.id,
      listing_id: listing.id,
      type:       'commission',
    },
    invoice_creation: { enabled: true },
    locale: 'tr',
  });

  // Veritabanına kaydet
  await db.query(
    `INSERT INTO payments (offer_id, buyer_id, amount, deal_amount, commission_rate, stripe_checkout_session_id, status)
     VALUES ($1,$2,$3,$4,$5,$6,'awaiting_payment')`,
    [offer.id, buyer.id, commission, offer.price, rate, session.id]
  );

  return { url: session.url, sessionId: session.id, commission };
};

// ── Abonelik ─────────────────────────────────────
/**
 * Premium üyelik için Stripe checkout oturumu oluşturur.
 */
const createSubscriptionCheckout = async ({ user, planSlug, interval = 'month' }) => {
  const { rows } = await db.query(
    'SELECT * FROM subscription_plans WHERE slug=$1 AND is_active=true', [planSlug]
  );
  if (!rows.length) throw new Error('Plan bulunamadı.');

  const plan       = rows[0];
  const priceId    = interval === 'year' ? plan.stripe_price_yearly : plan.stripe_price_monthly;
  const customerId = await getOrCreateCustomer(user);

  // Stripe price ID yoksa dinamik oluştur
  let stripePriceId = priceId;
  if (!stripePriceId) {
    const price = await stripe.prices.create({
      currency:    'try',
      unit_amount: Math.round(
        (interval === 'year' ? plan.price_yearly : plan.price_monthly) * 100
      ),
      recurring: { interval },
      product_data: {
        name:     `HurdaMarket ${plan.name}`,
        metadata: { plan_slug: planSlug, platform: 'hurdamarket' },
      },
    });
    stripePriceId = price.id;

    // Plan tablosuna kaydet
    const col = interval === 'year' ? 'stripe_price_yearly' : 'stripe_price_monthly';
    await db.query(`UPDATE subscription_plans SET ${col}=$1 WHERE id=$2`, [stripePriceId, plan.id]);
  }

  const session = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       'subscription',
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/premium/basarili?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.FRONTEND_URL}/premium`,
    metadata: {
      user_id:  user.id,
      plan_slug: planSlug,
      interval,
      type:     'subscription',
    },
    subscription_data: {
      metadata: { user_id: user.id, plan_slug: planSlug },
    },
    locale: 'tr',
  });

  return { url: session.url, sessionId: session.id, plan };
};

// ── Webhook olaylarını işle ──────────────────────
const handleWebhook = async (rawBody, signature) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error(`Webhook imza hatası: ${err.message}`);
    throw new Error('Webhook imza geçersiz.');
  }

  logger.info(`Stripe webhook: ${event.type}`);

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;

      if (session.metadata?.type === 'commission') {
        await handleCommissionPaid(session);
      } else if (session.metadata?.type === 'subscription') {
        await handleSubscriptionCreated(session);
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await handleSubscriptionRenewed(invoice);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await handleSubscriptionFailed(invoice);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      await handleSubscriptionCancelled(event.data.object);
      break;
    }

    default:
      logger.debug(`İşlenmeyen webhook: ${event.type}`);
  }

  return { received: true };
};

// ── Webhook alt işleyiciler ───────────────────────
const handleCommissionPaid = async (session) => {
  const { offer_id, buyer_id } = session.metadata;

  // Ödeme kaydını güncelle
  await db.query(
    `UPDATE payments SET status='paid', paid_at=NOW(), updated_at=NOW(),
     stripe_payment_intent_id=$1
     WHERE stripe_checkout_session_id=$2`,
    [session.payment_intent, session.id]
  );

  // Teklif durumunu güncelle
  await db.query(
    "UPDATE offers SET status='completed' WHERE id=$1", [offer_id]
  );

  // İlanı satıldı olarak işaretle
  await db.query(
    `UPDATE listings SET status='sold' WHERE id=(
      SELECT listing_id FROM offers WHERE id=$1
    )`,
    [offer_id]
  );

  // Fatura kaydı
  if (session.invoice) {
    const inv = await stripe.invoices.retrieve(session.invoice);
    const { rows: pmtRows } = await db.query(
      'SELECT id FROM payments WHERE stripe_checkout_session_id=$1', [session.id]
    );
    if (pmtRows.length) {
      await db.query(
        `INSERT INTO invoices (user_id, payment_id, stripe_invoice_id, amount, status, pdf_url)
         VALUES ($1,$2,$3,$4,'paid',$5)`,
        [buyer_id, pmtRows[0].id, inv.id, inv.amount_paid / 100, inv.invoice_pdf]
      );
    }
  }

  logger.info(`Komisyon ödendi: teklif ${offer_id}`);
};

const handleSubscriptionCreated = async (session) => {
  const { user_id, plan_slug } = session.metadata;

  const { rows: planRows } = await db.query(
    'SELECT id FROM subscription_plans WHERE slug=$1', [plan_slug]
  );
  if (!planRows.length) return;

  const sub = await stripe.subscriptions.retrieve(session.subscription);

  await db.query(
    `INSERT INTO subscriptions
       (user_id, plan_id, stripe_subscription_id, stripe_customer_id, status,
        current_period_start, current_period_end)
     VALUES ($1,$2,$3,$4,$5, to_timestamp($6), to_timestamp($7))
     ON CONFLICT (stripe_subscription_id) DO UPDATE
     SET status=$5, current_period_start=to_timestamp($6), current_period_end=to_timestamp($7)`,
    [user_id, planRows[0].id, sub.id, sub.customer, sub.status,
     sub.current_period_start, sub.current_period_end]
  );

  await db.query(
    `UPDATE users SET is_premium=true, premium_until=to_timestamp($1) WHERE id=$2`,
    [sub.current_period_end, user_id]
  );

  logger.info(`Premium aktif: kullanıcı ${user_id}, plan ${plan_slug}`);
};

const handleSubscriptionRenewed = async (invoice) => {
  const sub = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId = sub.metadata?.user_id;
  if (!userId) return;

  await db.query(
    `UPDATE subscriptions SET
       status='active',
       current_period_start=to_timestamp($1),
       current_period_end=to_timestamp($2),
       updated_at=NOW()
     WHERE stripe_subscription_id=$3`,
    [sub.current_period_start, sub.current_period_end, sub.id]
  );

  await db.query(
    'UPDATE users SET premium_until=to_timestamp($1) WHERE id=$2',
    [sub.current_period_end, userId]
  );
};

const handleSubscriptionFailed = async (invoice) => {
  const sub = await stripe.subscriptions.retrieve(invoice.subscription);
  await db.query(
    "UPDATE subscriptions SET status='past_due' WHERE stripe_subscription_id=$1", [sub.id]
  );
};

const handleSubscriptionCancelled = async (sub) => {
  await db.query(
    "UPDATE subscriptions SET status='cancelled', updated_at=NOW() WHERE stripe_subscription_id=$1",
    [sub.id]
  );
  const userId = sub.metadata?.user_id;
  if (userId) {
    await db.query(
      'UPDATE users SET is_premium=false, premium_until=NULL WHERE id=$1', [userId]
    );
  }
};

module.exports = {
  stripe,
  calculateCommission,
  getOrCreateCustomer,
  createCommissionCheckout,
  createSubscriptionCheckout,
  handleWebhook,
};
