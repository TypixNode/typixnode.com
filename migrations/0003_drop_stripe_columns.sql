-- Drop the legacy Stripe-named columns now that data lives in the neutral
-- provider_ref / provider_txn columns (migration 0002 backfilled them).
--
-- stripe_session_id carried an inline UNIQUE constraint, which SQLite cannot
-- remove via ALTER TABLE DROP COLUMN. The portable, guaranteed-correct approach
-- is the standard SQLite "rebuild table" dance: create the new shape, copy data,
-- drop old, rename. Done inside the migration (D1 runs each file in order).

-- 1. New table without the stripe_* columns.
CREATE TABLE orders_new (
  id            TEXT PRIMARY KEY,
  provider      TEXT,                              -- 'stripe' | 'paypal' | 'alipay'
  provider_ref  TEXT UNIQUE,                       -- provider order/session id
  provider_txn  TEXT,                              -- provider transaction/payment id
  email         TEXT,
  customer_name TEXT,
  amount_total  INTEGER NOT NULL DEFAULT 0,        -- minor units (cents)
  currency      TEXT NOT NULL DEFAULT 'usd',
  status        TEXT NOT NULL DEFAULT 'pending',   -- pending | paid | fulfilled | canceled
  locale        TEXT NOT NULL DEFAULT 'en',
  items         TEXT NOT NULL,                     -- JSON line items
  shipping      TEXT,                              -- JSON shipping address
  created_at    TEXT NOT NULL,
  paid_at       TEXT
);

-- 2. Copy existing rows (only the kept columns).
INSERT INTO orders_new
  (id, provider, provider_ref, provider_txn, email, customer_name,
   amount_total, currency, status, locale, items, shipping, created_at, paid_at)
SELECT
   id, provider, provider_ref, provider_txn, email, customer_name,
   amount_total, currency, status, locale, items, shipping, created_at, paid_at
FROM orders;

-- 3. Replace old table.
DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;

-- 4. Recreate the indexes we still want (the old stripe-session index is gone).
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_provider ON orders (provider);
-- provider_ref UNIQUE is enforced by the column constraint above.
