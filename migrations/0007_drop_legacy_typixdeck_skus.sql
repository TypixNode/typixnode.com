-- Drop the legacy fixed TypixDeck bundle SKUs. TypixDeck is now sold as ONE
-- configurable SKU (`typixdeck`, base $119) whose price is the body base plus
-- the chosen `compute` / `storage` option deltas (product_option_values, 0006):
--   body +$0, cm0 +$40, cm4 +$95, cm5 +$105.
-- So typixdeck-cm0/cm4/cm5 only duplicated what the compute option group already
-- expresses (119+40=159, 119+95=214, 119+105=224) and are removed.
--
-- Safe for history: order prices/names are snapshotted onto orders.items[]
-- (incl. options[]), so past orders stay reconstructable without these rows.
-- Idempotent: re-running the migration chain re-inserts via 0005's
-- INSERT OR IGNORE, then this DELETE removes them again -> final state is clean.

DELETE FROM products WHERE sku IN ('typixdeck-cm0', 'typixdeck-cm4', 'typixdeck-cm5');
