const db     = require('../db');
const { AppError, catchAsync } = require('../utils/errors');
const logger = require('../utils/logger');
const {
  createCommissionCheckout,
  createSubscriptionCheckout,
  calculateCommission,
  handleWebhook,
} = require('../utils/stripe');

// ── Komisyon ──────────────────────────────────────

// GET /api/payments/commission-info/:offerId
// Alıcıya ödeme yapmadan önce komisyon bilgisi göster
const getCommissionInfo = catchAsync(async (req, res) => {
  const { rows } = await db.query(
    `SELECT o.id, o.price, o.status,
            l.title AS listing_title, l.id AS listing_id,
            u.name AS seller_name
     FROM offers o
     JOIN listings l ON l.id = o.listing_id
     JOIN users   u ON u.id = l.user_id
     WHERE o.id=$1 AND o.buyer_id=$2`,
    [req.params.offerId, req.user.id]
  );
  if (!rows.length) throw new AppError('Teklif bulunamadı.', 404);

  const offer      = rows[0];
  const { commission, rate } = calculateCommission(Number(offer.price));

  res.json({
    offer_id:      offer.id,
    listing_title: offer.listing_title,
    seller_name:   offer.seller_name,
    deal_amount:   Number(offer.price),
    commission,
    commission_rate: rate,
    total_to_pay:  commission,
  });
});

// POST /api/payments/commission/:offerId
// Komisyon ödemesi başlat → Stripe Checkout URL döner
const initiateCommission = catchAsync(async (req, res) => {
  const { offerId } = req.params;

  // Teklif durumu kontrolü
  const { rows } = await db.query(
    `SELECT o.*, l.title, l.id AS listing_id,
            u_b.name AS buyer_name, u_b.phone AS buyer_phone,
            u_b.email AS buyer_email, u_b.stripe_customer_id
     FROM offers o
     JOIN listings l ON l.id = o.listing_id
     JOIN users u_b  ON u_b.id = o.buyer_id
     WHERE o.id=$1 AND o.buyer_id=$2`,
    [offerId, req.user.id]
  );
  if (!rows.length) throw new AppError('Teklif bulunamadı.', 404);

  const offer  = rows[0];
  if (offer.status !== 'accepted') {
    throw new AppError('Sadece kabul edilmiş teklifler için ödeme yapılabilir.', 400);
  }

  // Daha önce ödeme var mı?
  const { rows: existing } = await db.query(
    "SELECT id, status FROM payments WHERE offer_id=$1 AND status IN ('paid','awaiting_payment')",
    [offerId]
  );
  if (existing.length) {
    if (existing[0].status === 'paid') throw new AppError('Bu teklif için ödeme zaten yapılmış.', 400);
    // awaiting_payment ise yeni checkout açma, aynı linki dön (yeniden oluşturmak gerekirse devam et)
  }

  const buyer   = { id: req.user.id, name: offer.buyer_name, phone: offer.buyer_phone, email: offer.buyer_email, stripe_customer_id: offer.stripe_customer_id };
  const listing = { title: offer.title, id: offer.listing_id };

  const { url, commission } = await createCommissionCheckout({ offer, buyer, listing });

  logger.info(`Komisyon checkout başlatıldı: teklif ${offerId}, tutar ${commission} TL`);
  res.json({ checkout_url: url, commission });
});

// GET /api/payments/history
// Kullanıcının ödeme geçmişi
const getPaymentHistory = catchAsync(async (req, res) => {
  const { rows } = await db.query(
    `SELECT p.*, l.title AS listing_title, i.pdf_url AS invoice_pdf
     FROM payments p
     JOIN offers   o ON o.id = p.offer_id
     JOIN listings l ON l.id = o.listing_id
     LEFT JOIN invoices i ON i.payment_id = p.id
     WHERE p.buyer_id=$1
     ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// ── Premium Üyelik ────────────────────────────────

// GET /api/payments/plans
const getPlans = catchAsync(async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM subscription_plans WHERE is_active=true ORDER BY price_monthly ASC'
  );
  res.json(rows);
});

// GET /api/payments/subscription
// Aktif abonelik bilgisi
const getSubscription = catchAsync(async (req, res) => {
  const { rows } = await db.query(
    `SELECT s.*, p.name AS plan_name, p.slug AS plan_slug, p.features,
            p.price_monthly, p.price_yearly
     FROM subscriptions s
     JOIN subscription_plans p ON p.id = s.plan_id
     WHERE s.user_id=$1 AND s.status IN ('active','trialing','past_due')
     ORDER BY s.created_at DESC LIMIT 1`,
    [req.user.id]
  );
  res.json(rows[0] || null);
});

// POST /api/payments/subscribe
const subscribe = catchAsync(async (req, res) => {
  const { planSlug, interval = 'month' } = req.body;

  if (!['month', 'year'].includes(interval)) {
    throw new AppError('Geçersiz abonelik dönemi.', 400);
  }

  // Zaten aktif aboneliği var mı?
  const { rows: existing } = await db.query(
    "SELECT id FROM subscriptions WHERE user_id=$1 AND status='active'",
    [req.user.id]
  );
  if (existing.length) {
    throw new AppError('Zaten aktif bir aboneliğiniz var.', 400);
  }

  const { url, plan } = await createSubscriptionCheckout({
    user: req.user, planSlug, interval,
  });

  logger.info(`Abonelik checkout: kullanıcı ${req.user.id}, plan ${planSlug}`);
  res.json({ checkout_url: url, plan });
});

// DELETE /api/payments/subscription
// Abonelik iptali (dönem sonunda)
const cancelSubscription = catchAsync(async (req, res) => {
  const { rows } = await db.query(
    "SELECT * FROM subscriptions WHERE user_id=$1 AND status='active' ORDER BY created_at DESC LIMIT 1",
    [req.user.id]
  );
  if (!rows.length) throw new AppError('Aktif abonelik bulunamadı.', 404);

  const { stripe } = require('../utils/stripe');
  await stripe.subscriptions.update(rows[0].stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  await db.query(
    'UPDATE subscriptions SET cancel_at_period_end=true WHERE id=$1', [rows[0].id]
  );

  res.json({
    message: 'Aboneliğiniz dönem sonunda iptal edilecek.',
    ends_at: rows[0].current_period_end,
  });
});

// ── Stripe Webhook ────────────────────────────────
// POST /api/payments/webhook
// raw body gerekli — express.json() öncesinde işlenmeli
const webhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    await handleWebhook(req.body, sig);
    res.json({ received: true });
  } catch (err) {
    logger.error(`Webhook hatası: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// ── Ödeme başarı/iptal sayfaları için ────────────
// GET /api/payments/verify-session/:sessionId
const verifySession = catchAsync(async (req, res) => {
  const { stripe } = require('../utils/stripe');
  const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

  res.json({
    status:        session.payment_status,
    type:          session.metadata?.type,
    amount_total:  session.amount_total / 100,
    currency:      session.currency,
  });
});

module.exports = {
  getCommissionInfo,
  initiateCommission,
  getPaymentHistory,
  getPlans,
  getSubscription,
  subscribe,
  cancelSubscription,
  webhook,
  verifySession,
};
