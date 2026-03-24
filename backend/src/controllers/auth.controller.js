const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { AppError, catchAsync } = require('../utils/errors');
const { sendOtpSms }           = require('../utils/notifications');
const logger                   = require('../utils/logger');

const generateOtp = () => {
  if (process.env.SMS_TEST_MODE === 'true') return '123456';
  return String(Math.floor(100000 + Math.random() * 900000));
};

const signToken = (userId) => jwt.sign(
  { userId },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const sendOtp = catchAsync(async (req, res) => {
  const { phone } = req.body;
  const code      = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.query('INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1,$2,$3)', [phone, code, expiresAt]);
  await sendOtpSms(phone, code);
  logger.info(`OTP gönderildi: ${phone}`);
  res.json({ message: 'Doğrulama kodu gönderildi.' });
});

const register = catchAsync(async (req, res) => {
  const { name, phone, email, password, role, city, otp } = req.body;

  const { rows: otpRows } = await db.query(
    `SELECT id FROM otp_codes WHERE phone=$1 AND code=$2 AND is_used=false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [phone, otp]
  );
  if (!otpRows.length) throw new AppError('Geçersiz veya süresi dolmuş doğrulama kodu.', 400);

  const { rows: existing } = await db.query('SELECT id FROM users WHERE phone=$1', [phone]);
  if (existing.length) throw new AppError('Bu telefon numarası zaten kayıtlı.', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await db.query(
    `INSERT INTO users (name, phone, email, password_hash, role, city, is_verified)
     VALUES ($1,$2,$3,$4,$5,$6,true)
     RETURNING id, name, phone, email, role, city, rating, created_at`,
    [name, phone, email || null, passwordHash, role || 'seller', city || null]
  );
  await db.query('UPDATE otp_codes SET is_used=true WHERE id=$1', [otpRows[0].id]);

  const token = signToken(rows[0].id);
  logger.info(`Yeni kullanıcı: ${phone}`);
  res.status(201).json({ token, user: rows[0] });
});

const login = catchAsync(async (req, res) => {
  const { phone, password } = req.body;
  const { rows } = await db.query('SELECT * FROM users WHERE phone=$1 AND is_active=true', [phone]);
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
    throw new AppError('Telefon numarası veya şifre hatalı.', 401);
  }
  const { password_hash, ...safeUser } = rows[0];
  const token = signToken(safeUser.id);
  logger.info(`Giriş: ${phone}`);
  res.json({ token, user: safeUser });
});

const me = catchAsync(async (req, res) => {
  res.json({ user: req.user });
});

const updateMe = catchAsync(async (req, res) => {
  const { name, email, city, district } = req.body;
  const { rows } = await db.query(
    `UPDATE users SET
       name=COALESCE($1,name), email=COALESCE($2,email),
       city=COALESCE($3,city), district=COALESCE($4,district), updated_at=NOW()
     WHERE id=$5
     RETURNING id, name, phone, email, role, city, district, rating, review_count`,
    [name||null, email||null, city||null, district||null, req.user.id]
  );
  res.json({ user: rows[0] });
});

module.exports = { sendOtp, register, login, me, updateMe };
