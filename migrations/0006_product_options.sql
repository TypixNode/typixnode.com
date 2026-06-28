-- Configurable product options (single SKU + options), so option surcharges are
-- D1-driven and dashboard-editable — NOT hard-coded. The base price stays in
-- products.usd (e.g. typixdeck = 119); each option value adds delta_usd on top.
--
-- Keys are semantic and match the snapshot stored in orders.items[].options[]:
--   product_sku  e.g. 'typixdeck'
--   group_key    e.g. 'compute' | 'storage'
--   value_key    e.g. 'body','cm0','cm4','cm5' / 'none','tf64','ssd128'
-- so historical orders stay reconstructable and the dashboard edits the same rows.

CREATE TABLE IF NOT EXISTS product_option_values (
  product_sku    TEXT NOT NULL,
  group_key      TEXT NOT NULL,
  value_key      TEXT NOT NULL,
  group_label_en TEXT NOT NULL DEFAULT '',
  group_label_zh TEXT NOT NULL DEFAULT '',
  group_label_ja TEXT NOT NULL DEFAULT '',
  label_en       TEXT NOT NULL DEFAULT '',
  label_zh       TEXT NOT NULL DEFAULT '',
  label_ja       TEXT NOT NULL DEFAULT '',
  delta_usd      INTEGER NOT NULL DEFAULT 0,   -- whole USD added to the base price
  note_en        TEXT,                          -- optional advisory (not a hard block)
  note_zh        TEXT,
  note_ja        TEXT,
  required       INTEGER NOT NULL DEFAULT 0,    -- 1 = the group must be chosen
  is_default     INTEGER NOT NULL DEFAULT 0,    -- 1 = the default value for the group
  sort           INTEGER NOT NULL DEFAULT 0,    -- display order within the group
  active         INTEGER NOT NULL DEFAULT 1,    -- 0 = hidden
  updated_at     TEXT,
  PRIMARY KEY (product_sku, group_key, value_key)
);

CREATE INDEX IF NOT EXISTS idx_pov_product ON product_option_values (product_sku, active, sort);

-- Seed TypixDeck options from the (formerly hard-coded) deltas. Idempotent.
-- compute: required group. storage: optional group.
INSERT OR IGNORE INTO product_option_values
  (product_sku, group_key, value_key,
   group_label_en, group_label_zh, group_label_ja,
   label_en, label_zh, label_ja,
   delta_usd, note_en, note_zh, note_ja, required, is_default, sort, active, updated_at) VALUES
 ('typixdeck','compute','body',
   'Compute','核心','コンピュート',
   'Body only','仅机身','本体のみ',
   0, NULL, NULL, NULL, 1, 1, 0, 1, '2026-06-28T00:00:00Z'),
 ('typixdeck','compute','cm0',
   'Compute','核心','コンピュート',
   'CM0 (soldered CM0→CM4 adapter)','CM0（含贴片 CM0→CM4 转接板）','CM0（CM0→CM4 アダプタ実装済）',
   40, NULL, NULL, NULL, 1, 0, 1, 1, '2026-06-28T00:00:00Z'),
 ('typixdeck','compute','cm4',
   'Compute','核心','コンピュート',
   'CM4 · 4GB · Wi-Fi · no eMMC','CM4 · 4GB · WiFi · 无 eMMC','CM4 · 4GB · Wi-Fi · eMMC なし',
   95, NULL, NULL, NULL, 1, 0, 2, 1, '2026-06-28T00:00:00Z'),
 ('typixdeck','compute','cm5',
   'Compute','核心','コンピュート',
   'CM5 · 4GB · Wi-Fi · no eMMC','CM5 · 4GB · WiFi · 无 eMMC','CM5 · 4GB · Wi-Fi · eMMC なし',
   105, NULL, NULL, NULL, 1, 0, 3, 1, '2026-06-28T00:00:00Z'),
 ('typixdeck','storage','none',
   'Storage','存储','ストレージ',
   'No TF card','不含 TF 卡','TF カードなし',
   0, NULL, NULL, NULL, 0, 1, 0, 1, '2026-06-28T00:00:00Z'),
 ('typixdeck','storage','tf64',
   'Storage','存储','ストレージ',
   'SanDisk 64GB · Raspberry Pi OS preloaded','SanDisk 64GB · 预装树莓派 OS','SanDisk 64GB · Raspberry Pi OS プリインストール',
   19, NULL, NULL, NULL, 0, 0, 1, 1, '2026-06-28T00:00:00Z'),
 ('typixdeck','storage','ssd128',
   'Storage','存储','ストレージ',
   'M.2 SSD 128GB · Toshiba 2230 · OS preloaded','M.2 SSD 128GB · 东芝 2230 · 预装系统','M.2 SSD 128GB · 東芝 2230 · OS プリインストール',
   25,
   'CM4 / CM5 only — CM0 uses eMMC or a TF card',
   '仅 CM4 / CM5 可用 — CM0 只能用 eMMC 或 TF 卡',
   'CM4 / CM5 のみ — CM0 は eMMC か TF カード',
   0, 0, 2, 1, '2026-06-28T00:00:00Z');
