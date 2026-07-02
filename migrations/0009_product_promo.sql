-- Limited-time promotional pricing for products.
--
-- A product is "on promo" when promo_usd is set to a positive value BELOW the
-- regular `usd` price AND promo_ends is either NULL (no expiry) or in the future.
-- The SERVER is the price authority: catalog.ts derives the effective price from
-- these columns, so checkout charges the sale price — the frontend only displays
-- it (strikethrough original + sale price + a hover deadline).
--
-- Accessories/options (TF card, SSD, CM0/CM4/CM5 module deltas) live in
-- product_option_values and intentionally have NO promo — deltas are never
-- discounted; only a product's base price can go on sale.

ALTER TABLE products ADD COLUMN promo_usd INTEGER;   -- sale price, whole USD. NULL = no promo
ALTER TABLE products ADD COLUMN promo_ends TEXT;     -- ISO 8601 datetime the promo ends. NULL = no expiry
