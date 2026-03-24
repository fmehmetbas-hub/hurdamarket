const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../db');

/**
 * Test veritabanını temizler.
 * Her test öncesinde çağrılır.
 */
const clearDb = async () => {
  await db.query('DELETE FROM messages');
  await db.query('DELETE FROM reviews');
  await db.query('DELETE FROM offers');
  await db.query('DELETE FROM listing_photos');
  await db.query('DELETE FROM listings');
  await db.query('DELETE FROM otp_codes');
  await db.query('DELETE FROM users');
};

/**
 * Test kullanıcısı oluşturur ve token döner.
 */
const createUser = async (overrides = {}) => {
  const defaults = {
    name:     'Test Kullanıcı',
    phone:    '05321234567',
    password: 'sifre123',
    role:     'seller',
    city:     'İzmir',
  };
  const data = { ...defaults, ...overrides };
  const hash = await bcrypt.hash(data.password, 10);

  const { rows } = await db.query(
    `INSERT INTO users (name, phone, password_hash, role, city, is_verified)
     VALUES ($1,$2,$3,$4,$5,true) RETURNING *`,
    [data.name, data.phone, hash, data.role, data.city]
  );

  const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user: rows[0], token };
};

/**
 * Test ilanı oluşturur.
 */
const createListing = async (userId, overrides = {}) => {
  const defaults = {
    title:    'Test hurda demir',
    category: 'demir',
    city:     'İzmir',
    weight_kg: 100,
  };
  const data = { ...defaults, ...overrides };
  const { rows } = await db.query(
    `INSERT INTO listings (user_id, title, category, city, weight_kg)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId, data.title, data.category, data.city, data.weight_kg]
  );
  return rows[0];
};

module.exports = { clearDb, createUser, createListing };
