-- Faz 5: Stripe Ödeme Sistemi
-- Çalıştır: psql $DATABASE_URL -f database/migration_faz5.sql

-- Komisyon ödemeleri
CREATE TABLE IF NOT EXISTS payments (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id             UUID NOT NULL REFERENCES offers(id),
  buyer_id             UUID NOT NULL REFERENCES users(id),
  amount               NUMERIC(12,2) NOT NULL,   -- komisyon tutarı (TL)
  deal_amount          NUMERIC(12,2) NOT NULL,   -- asıl anlaşma tutarı
  commission_rate      NUMERIC(4,2)  NOT NULL DEFAULT 4.00,
  currency             VARCHAR(3)    NOT NULL DEFAULT 'try',
  stripe_payment_intent_id VARCHAR(200) UNIQUE,
  stripe_checkout_session_id VARCHAR(200) UNIQUE,
  status               VARCHAR(30) NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','awaiting_payment','paid','failed','refunded')),
  paid_at              TIMESTAMPTZ,
  invoice_url          TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_offer   ON payments(offer_id);
CREATE INDEX IF NOT EXISTS idx_payments_buyer   ON payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe  ON payments(stripe_payment_intent_id);

-- Premium üyelik planları
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 VARCHAR(100) NOT NULL,
  slug                 VARCHAR(50)  NOT NULL UNIQUE,
  price_monthly        NUMERIC(10,2) NOT NULL,
  price_yearly         NUMERIC(10,2) NOT NULL,
  stripe_price_monthly VARCHAR(200),
  stripe_price_yearly  VARCHAR(200),
  features             JSONB,
  is_active            BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanıcı abonelikleri
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id              UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id VARCHAR(200) UNIQUE,
  stripe_customer_id   VARCHAR(200),
  status               VARCHAR(30) NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','past_due','cancelled','trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subs_user   ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_stripe ON subscriptions(stripe_subscription_id);

-- Faturalar
CREATE TABLE IF NOT EXISTS invoices (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES users(id),
  payment_id           UUID REFERENCES payments(id),
  subscription_id      UUID REFERENCES subscriptions(id),
  stripe_invoice_id    VARCHAR(200) UNIQUE,
  amount               NUMERIC(12,2) NOT NULL,
  currency             VARCHAR(3) DEFAULT 'try',
  status               VARCHAR(20) DEFAULT 'draft',
  invoice_number       VARCHAR(50) UNIQUE,
  pdf_url              TEXT,
  issued_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);

-- Fatura numarası otomatik üretici
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number = 'HM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_number ON invoices;
CREATE TRIGGER trg_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW WHEN (NEW.invoice_number IS NULL)
EXECUTE FUNCTION generate_invoice_number();

-- users tablosuna Stripe customer ID ekle
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;

-- Varsayılan planları ekle
INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, features) VALUES
  ('Temel', 'basic', 0, 0, '{"max_offers_per_month": 10, "featured_listings": 0, "priority_support": false}'),
  ('Pro Alıcı', 'pro', 149.90, 1499.00, '{"max_offers_per_month": -1, "featured_listings": 3, "priority_support": true, "advanced_filters": true}'),
  ('Kurumsal', 'enterprise', 399.90, 3999.00, '{"max_offers_per_month": -1, "featured_listings": 10, "priority_support": true, "advanced_filters": true, "api_access": true}')
ON CONFLICT (slug) DO NOTHING;
