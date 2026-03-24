const db = require('../db');
const { AppError, catchAsync } = require('../utils/errors');

// POST /api/favorites/:listingId — favoriye ekle / çıkar (toggle)
const toggleFavorite = catchAsync(async (req, res) => {
  const { listingId } = req.params;

  const { rows: existing } = await db.query(
    'SELECT id FROM favorites WHERE user_id=$1 AND listing_id=$2',
    [req.user.id, listingId]
  );

  if (existing.length) {
    await db.query('DELETE FROM favorites WHERE user_id=$1 AND listing_id=$2', [req.user.id, listingId]);
    return res.json({ favorited: false });
  }

  // İlan var mı kontrol et
  const { rows: listing } = await db.query('SELECT id FROM listings WHERE id=$1', [listingId]);
  if (!listing.length) throw new AppError('İlan bulunamadı.', 404);

  await db.query(
    'INSERT INTO favorites (user_id, listing_id) VALUES ($1,$2)',
    [req.user.id, listingId]
  );
  res.json({ favorited: true });
});

// GET /api/favorites — favorileri listele
const getFavorites = catchAsync(async (req, res) => {
  const { rows } = await db.query(`
    SELECT l.id, l.title, l.category, l.weight_kg, l.city, l.status, l.created_at,
           u.name AS seller_name, u.rating AS seller_rating,
           (SELECT url FROM listing_photos WHERE listing_id=l.id ORDER BY sort_order LIMIT 1) AS cover_photo,
           f.created_at AS favorited_at
    FROM favorites f
    JOIN listings l ON l.id = f.listing_id
    JOIN users    u ON u.id = l.user_id
    WHERE f.user_id = $1
    ORDER BY f.created_at DESC
  `, [req.user.id]);
  res.json(rows);
});

// GET /api/favorites/check/:listingId — favori mi?
const checkFavorite = catchAsync(async (req, res) => {
  const { rows } = await db.query(
    'SELECT id FROM favorites WHERE user_id=$1 AND listing_id=$2',
    [req.user.id, req.params.listingId]
  );
  res.json({ favorited: rows.length > 0 });
});

module.exports = { toggleFavorite, getFavorites, checkFavorite };
