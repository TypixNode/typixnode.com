-- Newsletter / mailing-list subscribers + a lightweight email audit log.
--
-- Double opt-in model (industry standard, anti-abuse & CAN-SPAM/GDPR friendly):
--   subscribe  -> row created with status 'pending' + an unguessable `token`.
--                 A confirmation email is sent containing a confirm link.
--   confirm    -> status flips to 'active' (this is the proof of consent).
--   unsubscribe-> status flips to 'unsubscribed' (via the same `token`, which is
--                 embedded in every email's List-Unsubscribe footer).
-- The single `token` doubles as the confirm AND unsubscribe secret, so links are
-- capability URLs (no login needed) but remain unguessable.

CREATE TABLE IF NOT EXISTS subscribers (
  id              TEXT PRIMARY KEY,                 -- sub_xxx
  email           TEXT NOT NULL UNIQUE,             -- lowercased + trimmed
  name            TEXT,
  lang            TEXT NOT NULL DEFAULT 'en',       -- locale for future localized sends
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | active | unsubscribed | bounced
  token           TEXT NOT NULL,                    -- confirm + unsubscribe capability secret
  source          TEXT,                             -- 'footer' | 'checkout' | 'import' | ...
  ip              TEXT,                             -- best-effort, for abuse triage
  user_agent      TEXT,
  created_at      TEXT NOT NULL,
  confirmed_at    TEXT,
  unsubscribed_at TEXT,
  last_email_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_token ON subscribers (token);

-- Lightweight audit trail of every outbound email (transactional + newsletter).
-- Handy for the admin to see what went out, retry, and debug deliverability.
CREATE TABLE IF NOT EXISTS email_log (
  id          TEXT PRIMARY KEY,                     -- eml_xxx
  kind        TEXT NOT NULL,                        -- 'order' | 'subscribe_confirm' | 'welcome' | 'admin_subscribe' | 'admin_order' | 'newsletter'
  to_email    TEXT NOT NULL,
  subject     TEXT,
  status      TEXT NOT NULL DEFAULT 'sent',         -- sent | skipped | failed
  error       TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_log_kind ON email_log (kind);
CREATE INDEX IF NOT EXISTS idx_email_log_to ON email_log (to_email);
