-- Raise TypixDeck body base to $174 (~¥1,250 at the site's 7.2 CNY display rate).
-- Seed/fallback in catalog.ts + site.js is updated in the same change; this
-- UPDATE keeps live D1 in lockstep. Clear the $99 promo so the effective
-- storefront price is the new base, not the old sale.

UPDATE products
   SET usd = 174,
       promo_usd = NULL,
       promo_ends = NULL,
       updated_at = '2026-09-07T00:00:00Z'
 WHERE sku = 'typixdeck';
