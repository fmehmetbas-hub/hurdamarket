-- Faz 4: Admin Paneli
-- Çalıştır: psql $DATABASE_URL -f database/migration_faz4.sql

-- Admin rolü
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- Şikayet / rapor tablosu
CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id   UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  reason       VARCHAR(100) NOT NULL,
  description  TEXT,
  status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  admin_note   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_listing ON reports(listing_id);

-- Platform istatistikleri view
CREATE OR REPLACE VIEW platform_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE is_active = true)                    AS total_users,
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7d') AS new_users_7d,
  (SELECT COUNT(*) FROM listings WHERE status = 'active')                AS active_listings,
  (SELECT COUNT(*) FROM listings WHERE created_at > NOW() - INTERVAL '7d') AS new_listings_7d,
  (SELECT COUNT(*) FROM offers WHERE status = 'accepted')                AS total_deals,
  (SELECT COUNT(*) FROM offers WHERE created_at > NOW() - INTERVAL '7d') AS new_offers_7d,
  (SELECT COALESCE(SUM(weight_kg), 0) FROM listings WHERE status = 'sold') AS total_weight_recycled,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending')                AS pending_reports;

-- Günlük kayıt istatistikleri
CREATE OR REPLACE VIEW daily_signups AS
SELECT
  DATE_TRUNC('day', created_at)::date AS day,
  COUNT(*) AS count
FROM users
WHERE created_at > NOW() - INTERVAL '30d'
GROUP BY 1 ORDER BY 1;

-- Kategori bazlı ilan sayısı
CREATE OR REPLACE VIEW category_stats AS
SELECT
  category,
  COUNT(*) FILTER (WHERE status = 'active')     AS active_count,
  COUNT(*) FILTER (WHERE status = 'sold')       AS sold_count,
  ROUND(AVG(weight_kg), 1)                      AS avg_weight,
  COUNT(*) AS total_count
FROM listings
GROUP BY category
ORDER BY total_count DESC;

-- Admin kullanıcısı oluştur (ilk çalıştırmada şifreyi değiştir!)
-- UPDATE users SET role='admin' WHERE phone='05XXXXXXXXX';

-- Push notification token tablosu (Faz 6 eklentisi)
CREATE TABLE IF NOT EXISTS push_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(500) NOT NULL UNIQUE,
  platform   VARCHAR(10) DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
