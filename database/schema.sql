-- HurdaMarket Veritabanı Şeması
-- PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Kullanıcı rolleri
CREATE TYPE user_role AS ENUM ('seller', 'buyer', 'both');
CREATE TYPE listing_status AS ENUM ('active', 'pending', 'sold', 'cancelled');
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
CREATE TYPE listing_category AS ENUM (
  'demir', 'bakir', 'aluminyum', 'plastik',
  'elektronik', 'kagit', 'cam', 'tekstil', 'diger'
);

-- Kullanıcılar
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NOT NULL UNIQUE,
  email         VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role    NOT NULL DEFAULT 'seller',
  city          VARCHAR(80),
  district      VARCHAR(80),
  avatar_url    VARCHAR(500),
  rating        NUMERIC(2,1) DEFAULT 0.0,
  review_count  INT          DEFAULT 0,
  is_verified   BOOLEAN      DEFAULT FALSE,
  is_active     BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- İlanlar
CREATE TABLE listings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  category      listing_category NOT NULL,
  weight_kg     NUMERIC(10,2),
  description   TEXT,
  city          VARCHAR(80)  NOT NULL,
  district      VARCHAR(80),
  address       TEXT,
  lat           NUMERIC(10,7),
  lng           NUMERIC(10,7),
  status        listing_status NOT NULL DEFAULT 'active',
  view_count    INT          DEFAULT 0,
  is_featured   BOOLEAN      DEFAULT FALSE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- İlan fotoğrafları
CREATE TABLE listing_photos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id    UUID         NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url           VARCHAR(500) NOT NULL,
  sort_order    SMALLINT     DEFAULT 0,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- Teklifler
CREATE TABLE offers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id    UUID         NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price         NUMERIC(12,2) NOT NULL,
  pickup_date   DATE,
  note          TEXT,
  status        offer_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(listing_id, buyer_id)
);

-- Mesajlar (teklif bazlı)
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id      UUID         NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  sender_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT         NOT NULL,
  is_read       BOOLEAN      DEFAULT FALSE,
  sent_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- Değerlendirmeler
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id   UUID         NOT NULL REFERENCES users(id),
  reviewed_id   UUID         NOT NULL REFERENCES users(id),
  listing_id    UUID         REFERENCES listings(id),
  score         SMALLINT     NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(reviewer_id, listing_id)
);

-- SMS OTP
CREATE TABLE otp_codes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         VARCHAR(20)  NOT NULL,
  code          VARCHAR(6)   NOT NULL,
  expires_at    TIMESTAMPTZ  NOT NULL,
  is_used       BOOLEAN      DEFAULT FALSE,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_listings_user      ON listings(user_id);
CREATE INDEX idx_listings_category  ON listings(category);
CREATE INDEX idx_listings_city      ON listings(city);
CREATE INDEX idx_listings_status    ON listings(status);
CREATE INDEX idx_listings_location  ON listings(lat, lng);
CREATE INDEX idx_offers_listing     ON offers(listing_id);
CREATE INDEX idx_offers_buyer       ON offers(buyer_id);
CREATE INDEX idx_messages_offer     ON messages(offer_id);
CREATE INDEX idx_reviews_reviewed   ON reviews(reviewed_id);

-- Rating otomatik güncelleme
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    rating       = (SELECT AVG(score) FROM reviews WHERE reviewed_id = NEW.reviewed_id),
    review_count = (SELECT COUNT(*)   FROM reviews WHERE reviewed_id = NEW.reviewed_id)
  WHERE id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_user_rating();
