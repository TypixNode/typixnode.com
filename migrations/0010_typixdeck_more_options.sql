-- More TypixDeck options (data-driven, dashboard-editable — same table as 0006):
--   compute: extra RAM tiers CM4·2GB, CM5·8GB, CM5·16GB, plus a "custom/other"
--            entry (delta 0) that routes to a custom-order email flow on the site.
--   storage: larger media — SanDisk 128GB and M.2 SSD 256GB.
-- Idempotent (INSERT OR IGNORE). Existing rows are re-spaced (sort) so the new
-- values slot into the intended positions.

-- Re-space existing sorts to leave gaps for the inserts below.
UPDATE product_option_values SET sort = 10 WHERE product_sku='typixdeck' AND group_key='compute' AND value_key='cm0';
UPDATE product_option_values SET sort = 30 WHERE product_sku='typixdeck' AND group_key='compute' AND value_key='cm4';
UPDATE product_option_values SET sort = 40 WHERE product_sku='typixdeck' AND group_key='compute' AND value_key='cm5';
UPDATE product_option_values SET sort = 10 WHERE product_sku='typixdeck' AND group_key='storage' AND value_key='tf64';
UPDATE product_option_values SET sort = 20 WHERE product_sku='typixdeck' AND group_key='storage' AND value_key='ssd128';

INSERT OR IGNORE INTO product_option_values
  (product_sku, group_key, value_key,
   group_label_en, group_label_zh, group_label_ja,
   label_en, label_zh, label_ja,
   delta_usd, note_en, note_zh, note_ja, required, is_default, sort, active, updated_at) VALUES
 ('typixdeck','compute','cm4_2g',
   'Compute','核心','コンピュート',
   'CM4 · 2GB · Wi-Fi · no eMMC','CM4 · 2GB · WiFi · 无 eMMC','CM4 · 2GB · Wi-Fi · eMMC なし',
   75, NULL, NULL, NULL, 1, 0, 20, 1, '2026-07-02T00:00:00Z'),
 ('typixdeck','compute','cm5_8g',
   'Compute','核心','コンピュート',
   'CM5 · 8GB · Wi-Fi · no eMMC','CM5 · 8GB · WiFi · 无 eMMC','CM5 · 8GB · Wi-Fi · eMMC なし',
   130, NULL, NULL, NULL, 1, 0, 50, 1, '2026-07-02T00:00:00Z'),
 ('typixdeck','compute','cm5_16g',
   'Compute','核心','コンピュート',
   'CM5 · 16GB · Wi-Fi · no eMMC','CM5 · 16GB · WiFi · 无 eMMC','CM5 · 16GB · Wi-Fi · eMMC なし',
   165, NULL, NULL, NULL, 1, 0, 60, 1, '2026-07-02T00:00:00Z'),
 ('typixdeck','compute','custom',
   'Compute','核心','コンピュート',
   'Custom / other','其他定制','カスタム / その他',
   0, NULL, NULL, NULL, 1, 0, 90, 1, '2026-07-02T00:00:00Z'),
 ('typixdeck','storage','tf128',
   'Storage','存储','ストレージ',
   'SanDisk 128GB · Raspberry Pi OS preloaded','SanDisk 128GB · 预装树莓派 OS','SanDisk 128GB · Raspberry Pi OS プリインストール',
   29, NULL, NULL, NULL, 0, 0, 30, 1, '2026-07-02T00:00:00Z'),
 ('typixdeck','storage','ssd256',
   'Storage','存储','ストレージ',
   'M.2 SSD 256GB · Toshiba 2230 · OS preloaded','M.2 SSD 256GB · 东芝 2230 · 预装系统','M.2 SSD 256GB · 東芝 2230 · OS プリインストール',
   45,
   'CM4 / CM5 only — CM0 uses eMMC or a TF card',
   '仅 CM4 / CM5 可用 — CM0 只能用 eMMC 或 TF 卡',
   'CM4 / CM5 のみ — CM0 は eMMC か TF カード',
   0, 0, 40, 1, '2026-07-02T00:00:00Z');
