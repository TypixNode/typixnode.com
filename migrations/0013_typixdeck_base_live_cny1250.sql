-- Align TypixDeck body to $186 so live CNY display is ~¥1,250 (USD/CNY ≈ 6.72).
-- 0012 set $174 against the 7.2 fallback rate; this follows up for the live FX.

UPDATE products
   SET usd = 186,
       promo_usd = NULL,
       promo_ends = NULL,
       updated_at = '2026-09-07T00:00:00Z'
 WHERE sku = 'typixdeck';
