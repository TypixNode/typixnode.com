-- Hide deck / Pico-Mac / CM0 SKUs from the storefront (products.active = 0).
-- Keyboard SKUs stay listed. Historical orders still store the old sku ids.
UPDATE products SET active = 0, updated_at = datetime('now')
 WHERE sku IN ('typixdeck', 'picomac', 'cm0-adapter', 'cm0-module', 'cm0-adapter-raw');
