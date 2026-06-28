-- Move the product catalogue (prices, names) out of hard-coded JS/TS into D1 so
-- the dashboard can edit prices and they take effect without a code deploy.
-- SKU ids stay semantic (typixdeck, keyboard-wired, cm0-adapter, ...) and match
-- the ids already stored in orders.items.

CREATE TABLE IF NOT EXISTS products (
  sku        TEXT PRIMARY KEY,
  name_en    TEXT NOT NULL,
  name_zh    TEXT NOT NULL,
  name_ja    TEXT NOT NULL,
  usd        INTEGER NOT NULL DEFAULT 0,   -- whole US dollars (matches old catalog.ts)
  img        TEXT,                          -- references main-site static asset, e.g. /assets/x.png
  active     INTEGER NOT NULL DEFAULT 1,    -- 1 = on sale, 0 = hidden
  sort       INTEGER NOT NULL DEFAULT 0,    -- display order (lower first)
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products (active);

-- Seed from the existing hard-coded catalogue (catalog.ts). Idempotent.
INSERT OR IGNORE INTO products (sku, name_en, name_zh, name_ja, usd, img, active, sort, updated_at) VALUES
 ('typixdeck',        'TypixDeck (body only)',            'TypixDeck（仅机身）',          'TypixDeck（本体のみ）',              119, '/assets/cyberdeck.png',        1, 10, '2026-06-28T00:00:00Z'),
 ('typixdeck-cm4',    'TypixDeck · CM4 4GB (+ battery)',  'TypixDeck · CM4 4GB（含电池）', 'TypixDeck · CM4 4GB（バッテリー付）', 214, '/assets/cyberdeck.png',        1, 11, '2026-06-28T00:00:00Z'),
 ('typixdeck-cm5',    'TypixDeck · CM5 4GB (+ battery)',  'TypixDeck · CM5 4GB（含电池）', 'TypixDeck · CM5 4GB（バッテリー付）', 224, '/assets/cyberdeck.png',        1, 12, '2026-06-28T00:00:00Z'),
 ('typixdeck-cm0',    'TypixDeck · CM0 (soldered adapter)','TypixDeck · CM0（含贴片转接板）','TypixDeck · CM0（実装済アダプタ付）', 159, '/assets/cm0-adapter.png',      1, 13, '2026-06-28T00:00:00Z'),
 ('keyboard',         'BLE Keyboard',                     '蓝牙键盘',                     'BLE キーボード',                     39,  '/assets/keyboard.jpg',         1, 20, '2026-06-28T00:00:00Z'),
 ('keyboard-wired',   'Wired Keyboard',                   '有线键盘',                     '有線キーボード',                     29,  '/assets/keyboard.jpg',         1, 21, '2026-06-28T00:00:00Z'),
 ('diysuite',         'Silicone Snap-Dome DIY Kit',       '硅胶锅仔片 DIY 套件',          'シリコンドーム DIY キット',          9,   '/assets/diysuite.jpg',         1, 30, '2026-06-28T00:00:00Z'),
 ('picomac',          'Pico-Mac Nano',                    'Pico-Mac Nano',                'Pico-Mac Nano',                      60,  '/assets/picomac.jpg',          1, 40, '2026-06-28T00:00:00Z'),
 ('cm0-adapter',      'CM0→CM4 Adapter (CM0 soldered)',   'CM0 转 CM4 转接板（已贴片 CM0）','CM0→CM4 アダプタ（CM0 実装済）',      40,  '/assets/cm0-adapter.png',      1, 50, '2026-06-28T00:00:00Z'),
 ('cm0-module',       'CM0 Module',                       'CM0 模块',                     'CM0 モジュール',                     30,  '/assets/cm0-module.jpeg',      1, 51, '2026-06-28T00:00:00Z'),
 ('cm0-adapter-raw',  'CM0→CM4 Adapter (bare board)',     'CM0 转 CM4 转接板（裸板）',     'CM0→CM4 アダプタ（基板のみ）',       10,  '/assets/cm0-adapter-raw.png',  1, 52, '2026-06-28T00:00:00Z');
