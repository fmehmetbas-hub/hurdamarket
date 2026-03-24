const db     = require('../db');
const { AppError, catchAsync } = require('../utils/errors');
const { createNotification }   = require('./notifications.controller');
const logger = require('../utils/logger');

// ── Dashboard ─────────────────────────────────────

// GET /api/admin/stats
const getStats = catchAsync(async (req, res) => {
  const [stats, categories, dailySignups, dailyListings] = await Promise.all([
    db.query('SELECT * FROM platform_stats'),
    db.query('SELECT * FROM category_stats'),
    db.query('SELECT * FROM daily_signups ORDER BY day ASC'),
    db.query(`
      SELECT DATE_TRUNC('day', created_at)::date AS day, COUNT(*) AS count
      FROM listings WHERE created_at > NOW() - INTERVAL '30d'
      GROUP BY 1 ORDER BY 1
    `),
  ]);

  res.json({
    stats:        stats.rows[0],
    categories:   categories.rows,
    dailySignups: dailySignups.rows,
    dailyListings:dailyListings.rows,
  });
});

// ── Kullanıcı Yönetimi ────────────────────────────

// GET /api/admin/users
const getUsers = catchAsync(async (req, res) => {
  const { q, role, page = 1, limit = 30 } = req.query;
  const params = [];
  const where  = ['1=1'];

  if (q) {
    params.push(`%${q}%`);
    where.push(`(u.name ILIKE $${params.length} OR u.phone ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }
  if (role) {
    params.push(role);
    where.push(`u.role = $${params.length}`);
  }

  const offset = (Number(page) - 1) * Number(limit);
  const countParams = [...params];
  params.push(Number(limit), offset);

  const [{ rows }, { rows: cnt }] = await Promise.all([
    db.query(`
      SELECT u.id, u.name, u.phone, u.email, u.role, u.city,
             u.rating, u.review_count, u.is_active, u.is_verified, u.created_at,
             (SELECT COUNT(*) FROM listings WHERE user_id = u.id) AS listing_count,
             (SELECT COUNT(*) FROM offers   WHERE buyer_id = u.id) AS offer_count
      FROM users u
      WHERE ${where.join(' AND ')}
      ORDER BY u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params),
    db.query(`SELECT COUNT(*) FROM users u WHERE ${where.join(' AND ')}`, countParams),
  ]);

  res.json({ users: rows, total: Number(cnt[0].count), page: Number(page) });
});

// PATCH /api/admin/users/:id
const updateUser = catchAsync(async (req, res) => {
  const { is_active, role, note } = req.body;
  const { id } = req.params;

  if (id === req.user.id) throw new AppError('Kendi hesabınızı bu işlemle güncelleyemezsiniz.', 400);

  const updates = [];
  const params  = [];

  if (is_active !== undefined) { params.push(is_active); updates.push(`is_active = $${params.length}`); }
  if (role)                    { params.push(role);       updates.push(`role = $${params.length}`); }

  if (!updates.length) throw new AppError('Güncellenecek alan bulunamadı.', 400);

  params.push(id);
  const { rows } = await db.query(
    `UPDATE users SET ${updates.join(', ')}, updated_at=NOW() WHERE id=$${params.length} RETURNING id, name, phone, role, is_active`,
    params
  );
  if (!rows.length) throw new AppError('Kullanıcı bulunamadı.', 404);

  const action = is_active === false ? 'hesabınız askıya alındı' : is_active === true ? 'hesabınız yeniden aktif edildi' : `rol güncellendi: ${role}`;
  await createNotification(id, 'system', 'Hesap güncellendi', `Admin tarafından ${action}.`);

  logger.info(`Admin ${req.user.id} kullanıcı güncelledi: ${id} — ${JSON.stringify({ is_active, role })}`);
  res.json(rows[0]);
});

// ── İlan Moderasyonu ──────────────────────────────

// GET /api/admin/listings
const getListings = catchAsync(async (req, res) => {
  const { q, status, category, page = 1, limit = 30 } = req.query;
  const params = [];
  const where  = ['1=1'];

  if (q)        { params.push(`%${q}%`);  where.push(`(l.title ILIKE $${params.length} OR u.name ILIKE $${params.length})`); }
  if (status)   { params.push(status);    where.push(`l.status = $${params.length}`); }
  if (category) { params.push(category);  where.push(`l.category = $${params.length}`); }

  const offset = (Number(page) - 1) * Number(limit);
  const countParams = [...params];
  params.push(Number(limit), offset);

  const [{ rows }, { rows: cnt }] = await Promise.all([
    db.query(`
      SELECT l.id, l.title, l.category, l.city, l.weight_kg,
             l.status, l.view_count, l.is_featured, l.created_at,
             u.id AS seller_id, u.name AS seller_name, u.phone AS seller_phone,
             (SELECT url FROM listing_photos WHERE listing_id=l.id ORDER BY sort_order LIMIT 1) AS cover_photo,
             (SELECT COUNT(*) FROM offers WHERE listing_id=l.id) AS offer_count,
             (SELECT COUNT(*) FROM reports WHERE listing_id=l.id) AS report_count
      FROM listings l JOIN users u ON u.id = l.user_id
      WHERE ${where.join(' AND ')}
      ORDER BY report_count DESC, l.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params),
    db.query(`SELECT COUNT(*) FROM listings l JOIN users u ON u.id=l.user_id WHERE ${where.join(' AND ')}`, countParams),
  ]);

  res.json({ listings: rows, total: Number(cnt[0].count), page: Number(page) });
});

// PATCH /api/admin/listings/:id
const updateListing = catchAsync(async (req, res) => {
  const { status, is_featured, admin_note } = req.body;
  const updates = [];
  const params  = [];

  if (status     !== undefined) { params.push(status);     updates.push(`status = $${params.length}`); }
  if (is_featured !== undefined) { params.push(is_featured); updates.push(`is_featured = $${params.length}`); }

  if (!updates.length) throw new AppError('Güncellenecek alan yok.', 400);

  params.push(req.params.id);
  const { rows } = await db.query(
    `UPDATE listings SET ${updates.join(', ')}, updated_at=NOW() WHERE id=$${params.length} RETURNING id, title, status, is_featured, user_id`,
    params
  );
  if (!rows.length) throw new AppError('İlan bulunamadı.', 404);

  // İlan sahibine bildir
  if (status === 'cancelled') {
    await createNotification(rows[0].user_id, 'system', 'İlanınız kaldırıldı',
      admin_note || 'İlanınız platform kurallarına aykırı olduğu için kaldırıldı.');
  }

  logger.info(`Admin ${req.user.id} ilan güncelledi: ${req.params.id} — ${JSON.stringify({ status, is_featured })}`);
  res.json(rows[0]);
});

// ── Rapor Yönetimi ────────────────────────────────

// GET /api/admin/reports
const getReports = catchAsync(async (req, res) => {
  const { status = 'pending', page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { rows } = await db.query(`
    SELECT r.*,
           u_rep.name  AS reporter_name,
           u_rep.phone AS reporter_phone,
           l.title     AS listing_title,
           u_rep2.name AS reported_user_name
    FROM reports r
    JOIN users u_rep ON u_rep.id = r.reporter_id
    LEFT JOIN listings l     ON l.id    = r.listing_id
    LEFT JOIN users u_rep2   ON u_rep2.id = r.user_id
    WHERE r.status = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `, [status, Number(limit), offset]);

  const { rows: cnt } = await db.query(
    'SELECT COUNT(*) FROM reports WHERE status=$1', [status]
  );

  res.json({ reports: rows, total: Number(cnt[0].count) });
});

// PATCH /api/admin/reports/:id
const updateReport = catchAsync(async (req, res) => {
  const { status, admin_note } = req.body;

  if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
    throw new AppError('Geçersiz durum.', 400);
  }

  const { rows } = await db.query(
    `UPDATE reports SET status=$1, admin_note=$2, updated_at=NOW()
     WHERE id=$3 RETURNING *`,
    [status, admin_note || null, req.params.id]
  );
  if (!rows.length) throw new AppError('Rapor bulunamadı.', 404);

  logger.info(`Admin ${req.user.id} rapor güncelledi: ${req.params.id} — ${status}`);
  res.json(rows[0]);
});

// POST /api/admin/reports (kullanıcı şikayet oluşturur)
const createReport = catchAsync(async (req, res) => {
  const { listing_id, user_id, reason, description } = req.body;

  if (!listing_id && !user_id) throw new AppError('İlan veya kullanıcı belirtilmeli.', 400);

  const { rows } = await db.query(
    `INSERT INTO reports (reporter_id, listing_id, user_id, reason, description)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.id, listing_id || null, user_id || null, reason, description || null]
  );
  res.status(201).json(rows[0]);
});

module.exports = { getStats, getUsers, updateUser, getListings, updateListing, getReports, updateReport, createReport };
