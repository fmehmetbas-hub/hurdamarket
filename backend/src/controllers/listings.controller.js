const cache = require('./../utils/cache');
const db         = require('../db');
const cloudinary = require('cloudinary').v2;
const { AppError, catchAsync } = require('../utils/errors');
const logger     = require('../utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getListings = catchAsync(async (req, res) => {
  const { category, city, q, lat, lng, radius=50, weight_min, weight_max, sort='newest', page=1, limit=20 } = req.query;
  const params = [];
  const where  = ["l.status = 'active'"];

  if (category)   { params.push(category);           where.push(`l.category = $${params.length}`); }
  if (city)       { params.push(`%${city}%`);        where.push(`l.city ILIKE $${params.length}`); }
  if (q)          { params.push(`%${q}%`);           where.push(`(l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`); }
  if (weight_min) { params.push(Number(weight_min)); where.push(`l.weight_kg >= $${params.length}`); }
  if (weight_max) { params.push(Number(weight_max)); where.push(`l.weight_kg <= $${params.length}`); }

  let distanceSelect = '';
  if (lat && lng) {
    params.push(Number(lng), Number(lat), Number(radius) * 1000);
    where.push(`l.location IS NOT NULL AND ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($${params.length-2}, $${params.length-1}), 4326)::geography, $${params.length})`);
    distanceSelect = `, ROUND(ST_Distance(l.location::geography, ST_SetSRID(ST_MakePoint($${params.length-2}, $${params.length-1}), 4326)::geography)/1000, 1) AS distance_km`;
  }

  const orderMap = { newest:'l.created_at DESC', oldest:'l.created_at ASC', popular:'l.view_count DESC', weight:'l.weight_kg DESC', distance: lat&&lng ? 'distance_km ASC' : 'l.created_at DESC' };
  const orderBy  = orderMap[sort] || orderMap.newest;
  const offset   = (Number(page)-1) * Number(limit);
  const countParams = [...params];
  params.push(Number(limit), offset);

  const sql = `
    SELECT l.id, l.title, l.category, l.weight_kg, l.city, l.district,
           l.lat, l.lng, l.status, l.view_count, l.is_featured, l.created_at
           ${distanceSelect},
           u.id AS seller_id, u.name AS seller_name, u.rating AS seller_rating,
           (SELECT url FROM listing_photos WHERE listing_id=l.id ORDER BY sort_order LIMIT 1) AS cover_photo,
           (SELECT COUNT(*) FROM offers    WHERE listing_id=l.id) AS offer_count,
           (SELECT COUNT(*) FROM favorites WHERE listing_id=l.id) AS favorite_count
    FROM listings l JOIN users u ON u.id=l.user_id
    WHERE ${where.join(' AND ')}
    ORDER BY l.is_featured DESC, ${orderBy}
    LIMIT $${params.length-1} OFFSET $${params.length}`;

  const [{ rows }, { rows: cnt }] = await Promise.all([
    db.query(sql, params),
    db.query(`SELECT COUNT(*) FROM listings l WHERE ${where.join(' AND ')}`, countParams),
  ]);

  res.json({ listings: rows, total: Number(cnt[0].count), page: Number(page), pages: Math.ceil(Number(cnt[0].count)/Number(limit)) });
});

const getListingsForMap = catchAsync(async (req, res) => {
  const { category, city, lat, lng, radius=100 } = req.query;
  const params = [];
  const where  = ["l.status = 'active'", "l.location IS NOT NULL"];

  if (category) { params.push(category);    where.push(`l.category = $${params.length}`); }
  if (city)     { params.push(`%${city}%`); where.push(`l.city ILIKE $${params.length}`); }
  if (lat && lng) {
    params.push(Number(lng), Number(lat), Number(radius)*1000);
    where.push(`ST_DWithin(l.location::geography, ST_SetSRID(ST_MakePoint($${params.length-2}, $${params.length-1}), 4326)::geography, $${params.length})`);
  }

  const { rows } = await db.query(`
    SELECT l.id, l.title, l.category, l.weight_kg, l.city,
           ST_Y(l.location::geometry) AS lat, ST_X(l.location::geometry) AS lng,
           (SELECT url FROM listing_photos WHERE listing_id=l.id ORDER BY sort_order LIMIT 1) AS cover_photo
    FROM listings l WHERE ${where.join(' AND ')} LIMIT 500`, params);

  res.json(rows);
});

const getListing = catchAsync(async (req, res) => {
  const { rows } = await db.query(`
    SELECT l.*, u.name AS seller_name, u.phone AS seller_phone,
           u.rating AS seller_rating, u.review_count AS seller_reviews, u.created_at AS seller_since
    FROM listings l JOIN users u ON u.id=l.user_id WHERE l.id=$1`, [req.params.id]);

  if (!rows.length) throw new AppError('İlan bulunamadı.', 404);

  const [{ rows: photos }, { rows: similar }] = await Promise.all([
    db.query('SELECT url, sort_order FROM listing_photos WHERE listing_id=$1 ORDER BY sort_order', [req.params.id]),
    db.query(`SELECT l.id, l.title, l.city, l.category, l.weight_kg,
              (SELECT url FROM listing_photos WHERE listing_id=l.id ORDER BY sort_order LIMIT 1) AS cover_photo
              FROM listings l WHERE l.category=$1 AND l.id!=$2 AND l.status='active'
              ORDER BY l.created_at DESC LIMIT 4`, [rows[0].category, req.params.id]),
  ]);

  await db.query('UPDATE listings SET view_count=view_count+1 WHERE id=$1', [req.params.id]);
  res.json({ ...rows[0], photos, similar });
});

const createListing = catchAsync(async (req, res) => {
  const { title, category, weight_kg, description, city, district, address, lat, lng } = req.body;
  const files = req.files || [];

  const { rows } = await db.query(
    `INSERT INTO listings (user_id,title,category,weight_kg,description,city,district,address,lat,lng)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.id, title, category, weight_kg||null, description||null, city, district||null, address||null, lat||null, lng||null]
  );
  const listing = rows[0];

  if (files.length) {
    const uploads = await Promise.all(files.map((f,i) =>
      cloudinary.uploader.upload(`data:${f.mimetype};base64,${f.buffer.toString('base64')}`,
        { folder: `hurdamarket/${listing.id}`, transformation:[{width:1200,crop:'limit',quality:'auto'}] }
      ).then(r => ({ url: r.secure_url, sort_order: i, listing_id: listing.id }))
    ));
    const ph = uploads.map((_,i) => `($${i*3+1},$${i*3+2},$${i*3+3})`).join(',');
    await db.query(`INSERT INTO listing_photos (listing_id,url,sort_order) VALUES ${ph}`, uploads.flatMap(u=>[u.listing_id,u.url,u.sort_order]));
    listing.photos = uploads.map(u=>({url:u.url,sort_order:u.sort_order}));
  }

  logger.info(`Yeni ilan: ${listing.id}`);
  res.status(201).json(listing);
});

const updateListing = catchAsync(async (req, res) => {
  const { title, category, weight_kg, description, city, district, address, lat, lng, status } = req.body;
  const { rows } = await db.query(
    `UPDATE listings SET title=$1,category=$2,weight_kg=$3,description=$4,city=$5,district=$6,
     address=$7,lat=$8,lng=$9,status=$10,updated_at=NOW() WHERE id=$11 AND user_id=$12 RETURNING *`,
    [title, category, weight_kg, description, city, district, address, lat, lng, status, req.params.id, req.user.id]
  );
  if (!rows.length) throw new AppError('İlan bulunamadı veya yetkiniz yok.', 404);
  res.json(rows[0]);
});

const deleteListing = catchAsync(async (req, res) => {
  const { rows } = await db.query('DELETE FROM listings WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user.id]);
  if (!rows.length) throw new AppError('İlan bulunamadı veya yetkiniz yok.', 404);
  res.json({ message: 'İlan silindi.' });
});



// GET /api/listings/mine — giriş yapan kullanıcının kendi ilanları
const getMyListings = catchAsync(async (req, res) => {
  const { rows } = await db.query(`
    SELECT l.id, l.title, l.category, l.weight_kg, l.city, l.status,
           l.view_count, l.created_at,
           (SELECT url FROM listing_photos WHERE listing_id=l.id ORDER BY sort_order LIMIT 1) AS cover_photo,
           (SELECT COUNT(*) FROM offers WHERE listing_id=l.id) AS offer_count
    FROM listings l
    WHERE l.user_id = $1
    ORDER BY l.created_at DESC
  `, [req.user.id]);
  res.json({ listings: rows, total: rows.length });
});

// Export güncelleme
module.exports = { getListings, getListingsForMap, getMyListings, getListing, createListing, updateListing, deleteListing };
