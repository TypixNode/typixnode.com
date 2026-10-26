-- Refresh TypixDeck compute add-on deltas to Digi-Key China VAT-inclusive
-- street cost (Raspberry Pi official Wi-Fi Lite list × 1.13, whole USD).
-- Cross-check: 嘉立创 SMT shopCost for CM4104000 is ¥751.45 ≈ $104 @ 7.2.
-- Live D1 rows already exist (0006 / 0010); UPDATE so dashboard + checkout
-- pick up the new prices on the next `d1 migrations apply --remote`.

UPDATE product_option_values
   SET delta_usd = 71, updated_at = '2026-08-28T00:00:00Z'
 WHERE product_sku = 'typixdeck' AND group_key = 'compute' AND value_key = 'cm4_2g';

UPDATE product_option_values
   SET delta_usd = 107, updated_at = '2026-08-28T00:00:00Z'
 WHERE product_sku = 'typixdeck' AND group_key = 'compute' AND value_key = 'cm4';

UPDATE product_option_values
   SET delta_usd = 119, updated_at = '2026-08-28T00:00:00Z'
 WHERE product_sku = 'typixdeck' AND group_key = 'compute' AND value_key = 'cm5';

UPDATE product_option_values
   SET delta_usd = 192, updated_at = '2026-08-28T00:00:00Z'
 WHERE product_sku = 'typixdeck' AND group_key = 'compute' AND value_key = 'cm5_8g';

UPDATE product_option_values
   SET delta_usd = 339, updated_at = '2026-08-28T00:00:00Z'
 WHERE product_sku = 'typixdeck' AND group_key = 'compute' AND value_key = 'cm5_16g';
