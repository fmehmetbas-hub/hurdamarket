require('./setup');
const request = require('supertest');
const express = require('express');
const routes  = require('../routes');
const { errorHandler } = require('../utils/errors');
const { clearDb, createUser } = require('./helpers');
const db = require('../db');

// Minimal test uygulaması
const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

describe('Auth API', () => {

  beforeEach(clearDb);

  // ── OTP ────────────────────────────────────────
  describe('POST /api/auth/send-otp', () => {

    it('geçerli telefonla OTP gönderir', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '05321234567' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();

      const { rows } = await db.query(
        'SELECT * FROM otp_codes WHERE phone=$1', ['05321234567']
      );
      expect(rows.length).toBe(1);
      expect(rows[0].code).toHaveLength(6);
    });

    it('geçersiz telefon formatında 400 döner', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '12345' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('telefon olmadan 400 döner', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ── REGISTER ───────────────────────────────────
  describe('POST /api/auth/register', () => {

    const validPayload = {
      name:     'Ahmet Yılmaz',
      phone:    '05321234567',
      password: 'sifre123',
      city:     'İzmir',
      role:     'seller',
      otp:      '123456',
    };

    beforeEach(async () => {
      // OTP oluştur
      await db.query(
        `INSERT INTO otp_codes (phone, code, expires_at)
         VALUES ('05321234567', '123456', NOW() + INTERVAL '5 minutes')`
      );
    });

    it('başarılı kayıt: token + user döner', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.phone).toBe('05321234567');
      expect(res.body.user.password_hash).toBeUndefined();
    });

    it('aynı telefon ile tekrar kayıt: 409 döner', async () => {
      await request(app).post('/api/auth/register').send(validPayload);

      // İkinci OTP ekle
      await db.query(
        `INSERT INTO otp_codes (phone, code, expires_at)
         VALUES ('05321234567', '123456', NOW() + INTERVAL '5 minutes')`
      );

      const res = await request(app)
        .post('/api/auth/register')
        .send(validPayload);
      expect(res.status).toBe(409);
    });

    it('yanlış OTP: 400 döner', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validPayload, otp: '000000' });
      expect(res.status).toBe(400);
    });

    it('kısa şifre: 400 döner', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validPayload, password: '123' });
      expect(res.status).toBe(400);
    });
  });

  // ── LOGIN ──────────────────────────────────────
  describe('POST /api/auth/login', () => {

    beforeEach(async () => {
      await createUser({ phone: '05321234567', password: 'sifre123' });
    });

    it('doğru bilgilerle token döner', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: '05321234567', password: 'sifre123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
    });

    it('yanlış şifre: 401 döner', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: '05321234567', password: 'yanlis' });
      expect(res.status).toBe(401);
    });

    it('olmayan numara: 401 döner', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: '05399999999', password: 'sifre123' });
      expect(res.status).toBe(401);
    });
  });

  // ── ME ─────────────────────────────────────────
  describe('GET /api/auth/me', () => {

    it('geçerli token ile profil döner', async () => {
      const { token, user } = await createUser();
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(user.id);
    });

    it('token olmadan 401 döner', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('geçersiz token: 401 döner', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer gecersiz.token.buraya');
      expect(res.status).toBe(401);
    });
  });
});
