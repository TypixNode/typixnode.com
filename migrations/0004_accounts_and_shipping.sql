-- Accounts (multi-provider OAuth) + shipping/tracking fields.
--
-- Identity model (industry-standard, extensible — see Lucia / Auth.js):
--   users           one row per person/account (lean: profile only).
--   oauth_accounts  one row per linked provider login. UNIQUE(provider,
--                   provider_user_id). Adding Google/Apple later = new rows,
--                   no schema change. The provider's own username/email live
--                   here and are kept SEPARATE from the checkout (order) email.
--   user_emails     the orders<->users join key, normalized. A person owns
--                   MANY emails (GitHub email, checkout email, ...). An order
--                   links to a user when orders.email matches a VERIFIED row
--                   here. We never auto-link on an unverified email (account-
--                   takeover safety); the checkout email is added only after
--                   proven ownership (success-page session / order_id+email).
--   orders.user_id  denormalized cache, set when an order is linked/claimed.

-- 1. Users — lean profile only.
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,           -- usr_xxx
  name           TEXT,
  avatar_url     TEXT,
  primary_email  TEXT,                        -- display/contact only (NOT the join key)
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  last_login_at  TEXT
);

-- 2. OAuth identities — extensible linking backbone.
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id                TEXT PRIMARY KEY,         -- oac_xxx
  user_id           TEXT NOT NULL,
  provider          TEXT NOT NULL,            -- 'github' | 'google' | 'apple'
  provider_user_id  TEXT NOT NULL,            -- stable id from the provider
  provider_username TEXT,                     -- e.g. GitHub login
  provider_email    TEXT,                     -- provider account email (informational)
  created_at        TEXT NOT NULL,
  updated_at        TEXT,
  UNIQUE (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts (user_id);

-- 3. Email ownership — the orders<->users join key (one user : many emails).
CREATE TABLE IF NOT EXISTS user_emails (
  email      TEXT PRIMARY KEY,                -- lowercased
  user_id    TEXT NOT NULL,
  verified   INTEGER NOT NULL DEFAULT 0,      -- 1 = provider-verified or claim-proven
  source     TEXT,                            -- 'oauth:github' | 'order' | 'manual'
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_emails_user ON user_emails (user_id);

-- 4. Link orders to an account + add shipping/tracking columns.
ALTER TABLE orders ADD COLUMN user_id          TEXT;     -- FK -> users.id (nullable)
ALTER TABLE orders ADD COLUMN shipping_status   TEXT;    -- preparing | shipped | delivered
ALTER TABLE orders ADD COLUMN tracking_carrier  TEXT;
ALTER TABLE orders ADD COLUMN tracking_number   TEXT;
ALTER TABLE orders ADD COLUMN tracking_url       TEXT;
ALTER TABLE orders ADD COLUMN shipped_at         TEXT;
ALTER TABLE orders ADD COLUMN delivered_at       TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
