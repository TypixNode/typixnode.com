-- Make order rows payment-provider-agnostic.
-- The original schema hard-coded Stripe column names (stripe_session_id /
-- stripe_payment_intent). PayPal (and later Alipay) ids were being stuffed into
-- those Stripe-named columns, which is semantically wrong. We introduce neutral
-- columns and backfill existing rows. Old columns are kept (not dropped) for
-- backward compatibility and zero data loss — SQLite column drops are awkward
-- and we no longer write to them.

ALTER TABLE orders ADD COLUMN provider TEXT;       -- 'stripe' | 'paypal' | 'alipay'
ALTER TABLE orders ADD COLUMN provider_ref TEXT;   -- provider order/session id
ALTER TABLE orders ADD COLUMN provider_txn TEXT;   -- provider transaction/payment id

-- Backfill from the legacy Stripe-named columns.
UPDATE orders SET provider_ref = stripe_session_id WHERE provider_ref IS NULL;
UPDATE orders SET provider_txn = stripe_payment_intent WHERE provider_txn IS NULL;

-- Infer provider from the id shape: Stripe Checkout sessions start with 'cs_';
-- everything else stored so far is a PayPal order id.
UPDATE orders
  SET provider = CASE
    WHEN stripe_session_id LIKE 'cs_%' THEN 'stripe'
    WHEN stripe_session_id IS NOT NULL THEN 'paypal'
    ELSE provider
  END
  WHERE provider IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_provider_ref ON orders (provider_ref);
CREATE INDEX IF NOT EXISTS idx_orders_provider ON orders (provider);
