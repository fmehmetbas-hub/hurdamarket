-- Faz 3: Konum bazlı arama için PostGIS eklentisi
-- Çalıştır: psql $DATABASE_URL -f database/migration_faz3.sql

-- PostGIS eklentisini etkinleştir (Opsiyonel: PostGIS yüklü değilse yorumda bırakın)
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- listings tablosuna geometry kolonu ekle
-- ALTER TABLE listings
--   ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

-- Mevcut lat/lng verilerini geometry'e dönüştür
-- UPDATE listings
-- SET location = ST_SetSRID(ST_MakePoint(lng::float, lat::float), 4326)
-- WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Spatial index (konum sorguları için kritik)
-- CREATE INDEX IF NOT EXISTS idx_listings_location_geo
-- ON listings USING GIST (location);

-- Konum bazlı arama için trigger: lat/lng değişince geometry'i güncelle
-- CREATE OR REPLACE FUNCTION sync_listing_location()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
--     NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng::float, NEW.lat::float), 4326);
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- DROP TRIGGER IF EXISTS trg_sync_location ON listings;
-- CREATE TRIGGER trg_sync_location
-- BEFORE INSERT OR UPDATE OF lat, lng ON listings
-- FOR EACH ROW EXECUTE FUNCTION sync_listing_location();

-- Favoriler tablosu
CREATE TABLE IF NOT EXISTS favorites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user    ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_id);

-- Bildirimler tablosu
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL, -- new_offer, offer_accepted, new_message vb.
  title       VARCHAR(200) NOT NULL,
  body        TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  data        JSONB,               -- ilgili kayıt id'leri
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_user    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_unread  ON notifications(user_id, is_read) WHERE is_read = FALSE;
