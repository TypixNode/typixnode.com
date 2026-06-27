-- TypixNode order storage (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS orders (
  id                    TEXT PRIMARY KEY,             -- internal order id, e.g. ord_xxx
  stripe_session_id     TEXT UNIQUE,                  -- Stripe Checkout Session id
  stripe_payment_intent TEXT,                         -- Stripe PaymentIntent id
  email                 TEXT,
  customer_name         TEXT,
  amount_total          INTEGER NOT NULL DEFAULT 0,   -- minor units (cents)
  currency              TEXT NOT NULL DEFAULT 'usd',
  status                TEXT NOT NULL DEFAULT 'pending', -- pending | paid | fulfilled | canceled
  locale                TEXT NOT NULL DEFAULT 'en',
  items                 TEXT NOT NULL,                -- JSON: [{slug,name,qty,unitPrice}]
  shipping              TEXT,                         -- JSON shipping address
  created_at            TEXT NOT NULL,
  paid_at               TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_session ON orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
