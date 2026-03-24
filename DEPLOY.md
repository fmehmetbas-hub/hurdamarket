# HurdaMarket Deploy Rehberi

## Mimari

```
GitHub
  ├── push to main
  │     ├── GitHub Actions → test çalışır
  │     ├── Railway       → backend deploy
  │     └── Vercel        → frontend deploy
  │
  └── Canlı sistem:
        ├── api.hurdamarket.com  → Railway (Node.js + PostgreSQL)
        ├── hurdamarket.com      → Vercel  (React)
        └── Redis               → Railway add-on
```

---

## 1. GitHub Repository

```bash
# Projeyi GitHub'a yükle
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/KULLANICI/hurdamarket.git
git push -u origin main
```

---

## 2. Railway — Backend + Veritabanı

### 2.1 Hesap ve proje oluştur

1. [railway.app](https://railway.app) → GitHub ile giriş
2. **New Project** → **Deploy from GitHub repo** → repoyu seç
3. **Add Service** → **Database** → **PostgreSQL** ekle
4. **Add Service** → **Redis** ekle

### 2.2 Ortam değişkenlerini ayarla

Railway dashboard → backend servisi → **Variables** sekmesi:

```
DATABASE_URL        = (Railway otomatik sağlar - ${{Postgres.DATABASE_URL}})
REDIS_URL           = (Railway otomatik sağlar - ${{Redis.REDIS_URL}})
JWT_SECRET          = openssl rand -hex 32  ← terminalde çalıştır, çıktıyı kopyala
JWT_EXPIRES_IN      = 7d
FRONTEND_URL        = https://hurdamarket.com
NODE_ENV            = production
PORT                = 5000

CLOUDINARY_CLOUD_NAME = ...
CLOUDINARY_API_KEY    = ...
CLOUDINARY_API_SECRET = ...

STRIPE_SECRET_KEY     = sk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...

NETGSM_USERCODE   = ...
NETGSM_PASSWORD   = ...
NETGSM_MSGHEADER  = HURDAMARKET

SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = info@hurdamarket.com
SMTP_PASS = ...

SENTRY_DSN = https://...@sentry.io/...
```

### 2.3 Veritabanı migration

```bash
# Railway CLI
npm install -g @railway/cli
railway login

# Migration çalıştır
railway run --service hurdamarket-db \
  psql $DATABASE_URL -f database/schema.sql

railway run --service hurdamarket-db \
  psql $DATABASE_URL -f database/migration_faz3.sql

railway run --service hurdamarket-db \
  psql $DATABASE_URL -f database/migration_faz4.sql

railway run --service hurdamarket-db \
  psql $DATABASE_URL -f database/migration_faz5.sql

# Admin kullanıcısı ata
railway run --service hurdamarket-db \
  psql $DATABASE_URL -c "UPDATE users SET role='admin' WHERE phone='05XXXXXXXXX';"
```

### 2.4 Custom domain (opsiyonel)

Railway → backend servisi → **Settings** → **Domains** → `api.hurdamarket.com`

---

## 3. Vercel — Frontend

### 3.1 Deploy

```bash
npm install -g vercel
cd frontend
vercel --prod
```

### 3.2 Ortam değişkenleri

Vercel Dashboard → Project → **Settings** → **Environment Variables**:

```
VITE_API_URL = https://api.hurdamarket.com/api
```

### 3.3 Custom domain

Vercel Dashboard → Project → **Settings** → **Domains** → `hurdamarket.com`

DNS ayarları (domain sağlayıcında):
```
A     @         76.76.21.21    (Vercel IP)
CNAME www       cname.vercel-dns.com
CNAME api       <railway-domain>.railway.app
```

---

## 4. GitHub Actions Secrets

GitHub → repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Değer |
|--------|-------|
| `RAILWAY_TOKEN` | railway.app → Account → Tokens |
| `VERCEL_TOKEN` | vercel.com → Account → Tokens |
| `VERCEL_ORG_ID` | vercel.com → Account → Settings |
| `VERCEL_PROJECT_ID` | Proje → Settings → General |
| `VITE_API_URL` | `https://api.hurdamarket.com/api` |
| `SLACK_WEBHOOK` | Slack app webhook URL (opsiyonel) |

---

## 5. Stripe Webhook

Canlıya geçince Stripe webhook URL güncelle:

```bash
stripe listen --forward-to https://api.hurdamarket.com/api/payments/webhook
```

Veya Stripe Dashboard → Webhooks → endpoint ekle:
- URL: `https://api.hurdamarket.com/api/payments/webhook`
- Events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`

---

## 6. Monitoring

### Sentry

1. [sentry.io](https://sentry.io) → yeni proje → Node.js
2. DSN'yi kopyala → Railway env'e `SENTRY_DSN` olarak ekle

### Uptime monitoring (ücretsiz)

[uptimerobot.com](https://uptimerobot.com) → Monitor ekle:
- URL: `https://api.hurdamarket.com/api/health`
- Interval: 5 dakika
- Alert: e-posta

---

## 7. Deploy Akışı

```
Kod yaz → git push origin main
              ↓
        GitHub Actions tetiklenir
              ↓
        ┌─────────────┐
        │  test job   │  ← PostgreSQL service container
        └──────┬──────┘
               │ başarılı
       ┌───────┴────────┐
       ↓                ↓
  Railway deploy   Vercel deploy
  (backend)        (frontend)
       ↓                ↓
  api.hurdamarket.com  hurdamarket.com
```

---

## 8. Hızlı Kontrol Listesi

- [ ] `JWT_SECRET` en az 32 karakter rastgele string
- [ ] `NODE_ENV=production` ayarlı
- [ ] Tüm migration'lar çalıştırıldı
- [ ] Stripe webhook URL güncellendi
- [ ] Admin kullanıcısı atandı
- [ ] Cloudinary klasör limitleri kontrol edildi
- [ ] Sentry DSN Railway'de tanımlı
- [ ] Uptime monitoring kuruldu
