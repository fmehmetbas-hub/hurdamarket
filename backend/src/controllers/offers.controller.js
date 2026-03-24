const db = require('../db');
const { AppError, catchAsync } = require('../utils/errors');
const { sendEmail, emailTemplates } = require('../utils/notifications');
const logger = require('../utils/logger');

const createOffer = catchAsync(async (req, res) => {
  const { price, pickup_date, note } = req.body;
  const listing_id = req.params.id;

  const { rows: listingRows } = await db.query(
    `SELECT l.*, u.email AS seller_email, u.name AS seller_name
     FROM listings l JOIN users u ON u.id = l.user_id
     WHERE l.id=$1 AND l.status='active'`,
    [listing_id]
  );
  if (!listingRows.length) throw new AppError('İlan bulunamadı veya aktif değil.', 404);
  if (listingRows[0].user_id === req.user.id) throw new AppError('Kendi ilanınıza teklif veremezsiniz.', 400);

  const { rows } = await db.query(
    `INSERT INTO offers (listing_id, buyer_id, price, pickup_date, note)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (listing_id, buyer_id)
     DO UPDATE SET price=$3, pickup_date=$4, note=$5, status='pending', updated_at=NOW()
     RETURNING *`,
    [listing_id, req.user.id, price, pickup_date || null, note || null]
  );

  if (listingRows[0].seller_email) {
    const tpl = emailTemplates.newOffer(listingRows[0].seller_name, listingRows[0].title, price);
    sendEmail({ to: listingRows[0].seller_email, ...tpl }).catch(() => {});
  }

  logger.info(`Teklif: ${req.user.id} -> ilan ${listing_id} -- ${price} TL`);
  res.status(201).json(rows[0]);
});

const getOffersForListing = catchAsync(async (req, res) => {
  const { rows: listing } = await db.query('SELECT user_id FROM listings WHERE id=$1', [req.params.id]);
  if (!listing.length) throw new AppError('İlan bulunamadı.', 404);
  if (listing[0].user_id !== req.user.id) throw new AppError('Bu işlem için yetkiniz yok.', 403);

  const { rows } = await db.query(
    `SELECT o.*, u.name AS buyer_name, u.phone AS buyer_phone,
            u.rating AS buyer_rating, u.review_count AS buyer_reviews
     FROM offers o JOIN users u ON u.id = o.buyer_id
     WHERE o.listing_id=$1 ORDER BY o.created_at DESC`,
    [req.params.id]
  );
  res.json(rows);
});

const updateOffer = catchAsync(async (req, res) => {
  const { status } = req.body;

  const { rows: offerRows } = await db.query(
    `SELECT o.*, l.user_id AS seller_id, l.title AS listing_title,
            u_buyer.email AS buyer_email, u_buyer.name AS buyer_name
     FROM offers o
     JOIN listings l ON l.id = o.listing_id
     JOIN users u_buyer ON u_buyer.id = o.buyer_id
     WHERE o.id=$1`,
    [req.params.id]
  );
  if (!offerRows.length) throw new AppError('Teklif bulunamadı.', 404);

  const offer = offerRows[0];
  if (status === 'cancelled' && offer.buyer_id !== req.user.id) throw new AppError('Yetki yok.', 403);
  if (['accepted','rejected'].includes(status) && offer.seller_id !== req.user.id) throw new AppError('Yetki yok.', 403);
  if (offer.status !== 'pending') throw new AppError('Sadece bekleyen teklifler güncellenebilir.', 400);

  const { rows } = await db.query(
    'UPDATE offers SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
    [status, req.params.id]
  );

  if (status === 'accepted') {
    await db.query("UPDATE listings SET status='pending' WHERE id=$1", [offer.listing_id]);
    if (offer.buyer_email) {
      const tpl = emailTemplates.offerAccepted(offer.buyer_name, offer.listing_title, offer.pickup_date);
      sendEmail({ to: offer.buyer_email, ...tpl }).catch(() => {});
    }
  }
  if (status === 'rejected' && offer.buyer_email) {
    const tpl = emailTemplates.offerRejected(offer.buyer_name, offer.listing_title);
    sendEmail({ to: offer.buyer_email, ...tpl }).catch(() => {});
  }

  logger.info(`Teklif guncellendi: ${req.params.id} -> ${status}`);
  res.json(rows[0]);
});

const getMyOffers = catchAsync(async (req, res) => {
  const { rows } = await db.query(
    `SELECT o.*, l.title AS listing_title, l.city AS listing_city,
            l.category AS listing_category,
            (SELECT url FROM listing_photos WHERE listing_id=l.id ORDER BY sort_order LIMIT 1) AS cover
     FROM offers o JOIN listings l ON l.id = o.listing_id
     WHERE o.buyer_id=$1 ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

module.exports = { createOffer, getOffersForListing, updateOffer, getMyOffers };
