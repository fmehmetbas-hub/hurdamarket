require('./setup');
const request = require('supertest');
const express = require('express');
const routes  = require('../routes');
const { errorHandler } = require('../utils/errors');
const { clearDb, createUser, createListing } = require('./helpers');

const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

describe('Listings API', () => {

  let seller, buyer, listing;

  beforeEach(async () => {
    await clearDb();
    seller  = await createUser({ phone: '05321111111', role: 'seller' });
    buyer   = await createUser({ phone: '05322222222', role: 'buyer' });
    listing = await createListing(seller.user.id);
  });

  describe('GET /api/listings', () => {
    it('aktif ilanları listeler', async () => {
      const res = await request(app).get('/api/listings');
      expect(res.status).toBe(200);
      expect(res.body.listings).toBeInstanceOf(Array);
      expect(res.body.listings.length).toBe(1);
    });

    it('kategori filtresi çalışır', async () => {
      await createListing(seller.user.id, { title: 'Bakır kablo', category: 'bakir' });
      const res = await request(app).get('/api/listings?category=bakir');
      expect(res.status).toBe(200);
      expect(res.body.listings.every(l => l.category === 'bakir')).toBe(true);
    });

    it('şehir araması çalışır', async () => {
      const res = await request(app).get('/api/listings?city=İzmir');
      expect(res.status).toBe(200);
      expect(res.body.listings.length).toBe(1);
    });
  });

  describe('GET /api/listings/:id', () => {
    it('ilan detayını döner', async () => {
      const res = await request(app).get(`/api/listings/${listing.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(listing.id);
      expect(res.body.seller_name).toBeDefined();
    });

    it('olmayan ilan: 404 döner', async () => {
      const res = await request(app).get('/api/listings/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/listings', () => {
    it('auth olmadan 401 döner', async () => {
      const res = await request(app)
        .post('/api/listings')
        .field('title', 'Test')
        .field('category', 'demir')
        .field('city', 'İzmir');
      expect(res.status).toBe(401);
    });

    it('geçersiz kategori: 400 döner', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${seller.token}`)
        .field('title', 'Test ilan')
        .field('category', 'gecersiz_kategori')
        .field('city', 'İzmir');
      expect(res.status).toBe(400);
    });

    it('çok kısa başlık: 400 döner', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${seller.token}`)
        .field('title', 'Kıs')
        .field('category', 'demir')
        .field('city', 'İzmir');
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/listings/:id', () => {
    it('sahip ilanı silebilir', async () => {
      const res = await request(app)
        .delete(`/api/listings/${listing.id}`)
        .set('Authorization', `Bearer ${seller.token}`);
      expect(res.status).toBe(200);
    });

    it('başkasının ilanını silemez: 404 döner', async () => {
      const res = await request(app)
        .delete(`/api/listings/${listing.id}`)
        .set('Authorization', `Bearer ${buyer.token}`);
      expect(res.status).toBe(404);
    });
  });
});

describe('Offers API', () => {

  let seller, buyer, listing;

  beforeEach(async () => {
    await clearDb();
    seller  = await createUser({ phone: '05321111111', role: 'seller' });
    buyer   = await createUser({ phone: '05322222222', role: 'buyer' });
    listing = await createListing(seller.user.id);
  });

  describe('POST /api/listings/:id/offers', () => {
    it('alıcı teklif verebilir', async () => {
      const res = await request(app)
        .post(`/api/listings/${listing.id}/offers`)
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ price: 500 });
      expect(res.status).toBe(201);
      expect(res.body.price).toBe('500');
    });

    it('satıcı kendi ilanına teklif veremez', async () => {
      const res = await request(app)
        .post(`/api/listings/${listing.id}/offers`)
        .set('Authorization', `Bearer ${seller.token}`)
        .send({ price: 500 });
      expect(res.status).toBe(400);
    });

    it('negatif fiyat: 400 döner', async () => {
      const res = await request(app)
        .post(`/api/listings/${listing.id}/offers`)
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ price: -100 });
      expect(res.status).toBe(400);
    });

    it('auth olmadan: 401 döner', async () => {
      const res = await request(app)
        .post(`/api/listings/${listing.id}/offers`)
        .send({ price: 500 });
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/offers/:id', () => {

    let offer;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/listings/${listing.id}/offers`)
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ price: 500 });
      offer = res.body;
    });

    it('satıcı teklifi kabul edebilir', async () => {
      const res = await request(app)
        .patch(`/api/offers/${offer.id}`)
        .set('Authorization', `Bearer ${seller.token}`)
        .send({ status: 'accepted' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('accepted');
    });

    it('satıcı teklifi reddedebilir', async () => {
      const res = await request(app)
        .patch(`/api/offers/${offer.id}`)
        .set('Authorization', `Bearer ${seller.token}`)
        .send({ status: 'rejected' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('rejected');
    });

    it('alıcı teklifi iptal edebilir', async () => {
      const res = await request(app)
        .patch(`/api/offers/${offer.id}`)
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ status: 'cancelled' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });

    it('alıcı kendi teklifini kabul edemez', async () => {
      const res = await request(app)
        .patch(`/api/offers/${offer.id}`)
        .set('Authorization', `Bearer ${buyer.token}`)
        .send({ status: 'accepted' });
      expect(res.status).toBe(403);
    });
  });
});
