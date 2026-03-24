# HurdaMarket — Kurulum Rehberi

## Gereksinimler
- Node.js 18+
- PostgreSQL 14+
- Cloudinary hesabı (ücretsiz)

---

## 1. Veritabanı

```bash
# PostgreSQL'de veritabanı oluştur
createdb hurdamarket

# Şemayı uygula
psql hurdamarket -f database/schema.sql
```

---

## 2. Backend

```bash
cd backend

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
# .env dosyasını düzenle — DATABASE_URL ve JWT_SECRET mutlaka doldur

# Geliştirme sunucusu
npm run dev
# → http://localhost:5000
```

### .env zorunlu alanlar:
| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/hurdamarket` |
| `JWT_SECRET` | En az 32 karakter rastgele string |
| `CLOUDINARY_*` | cloudinary.com'dan ücretsiz al |

---

## 3. Frontend

```bash
cd frontend

# Bağımlılıkları yükle
npm install

# .env dosyası
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Geliştirme sunucusu
npm run dev
# → http://localhost:3000
```

---

## API Uç Noktaları

### Auth
| Method | Yol | Açıklama |
|--------|-----|----------|
| POST | `/api/auth/send-otp` | SMS OTP gönder |
| POST | `/api/auth/register` | Kayıt ol |
| POST | `/api/auth/login` | Giriş yap |
| GET  | `/api/auth/me` | Profil bilgisi |

### İlanlar
| Method | Yol | Açıklama |
|--------|-----|----------|
| GET  | `/api/listings` | Liste + filtrele |
| GET  | `/api/listings/:id` | Detay |
| POST | `/api/listings` | Yeni ilan (auth) |
| PUT  | `/api/listings/:id` | Güncelle (auth) |
| DELETE | `/api/listings/:id` | Sil (auth) |

### Teklifler
| Method | Yol | Açıklama |
|--------|-----|----------|
| POST  | `/api/listings/:id/offers` | Teklif ver |
| GET   | `/api/listings/:id/offers` | İlan teklifleri (sahip) |
| PATCH | `/api/offers/:id` | Kabul/Red |
| GET   | `/api/offers/my` | Kendi tekliflerin |

---

## Proje Yapısı

```
hurdamarket/
├── database/
│   └── schema.sql          ← Tüm tablolar + trigger
├── backend/
│   ├── src/
│   │   ├── index.js         ← Express + Socket.io
│   │   ├── routes/index.js  ← Tüm rotalar
│   │   ├── controllers/     ← İş mantığı
│   │   ├── middleware/      ← JWT auth
│   │   └── db/              ← PostgreSQL bağlantısı
│   └── .env.example
└── frontend/
    └── src/
        ├── App.jsx           ← Router
        ├── pages/            ← Sayfalar
        ├── components/       ← Navbar vb.
        ├── services/api.js   ← Axios
        └── store/            ← Zustand
```

---

## Sonraki Adımlar (Faz 2–4)

- [ ] Login / Register sayfaları
- [ ] İlan oluşturma sayfası (fotoğraf yükleme)
- [ ] Teklifler sayfası + mesajlaşma
- [ ] Harita görünümü (Leaflet)
- [ ] Admin paneli
- [ ] SMS entegrasyonu (Netgsm)
- [ ] Ödeme sistemi (İyzico)
