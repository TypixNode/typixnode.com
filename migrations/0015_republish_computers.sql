-- Relist TypixDeck, Pico-Mac, and the three CM0 SKUs on the storefront.
-- Checkout stays paused (Kickstarter / Discord); this only restores product pages.
UPDATE products SET active = 1, updated_at = datetime('now')
 WHERE sku IN ('typixdeck', 'picomac', 'cm0-adapter', 'cm0-module', 'cm0-adapter-raw');
