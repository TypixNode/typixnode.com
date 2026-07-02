// Server-side product catalogue — the single source of truth for PRICES.
// Mirrors the `PRODUCTS` object in /public/assets/js/site.js (which drives the
// front-end cart UI). The browser sends only { id, qty }; the server NEVER
// trusts client-sent prices and always re-derives the amount from this table.

export interface Product {
  id: string;
  /** Base price in USD (whole dollars). Stripe/PayPal amounts are derived from this. */
  usd: number;
  name: { en: string; zh: string; ja: string };
  /** Image path under /public (used for Stripe line-item images). */
  img: string;
  /** Limited-time sale price in USD (whole dollars). null = no promo. */
  promoUsd?: number | null;
  /** ISO 8601 datetime the promo ends. null = no expiry (still needs promoUsd). */
  promoEnds?: string | null;
}

/** The active sale price for a product, or null when there is no live promo.
 *  Active = promoUsd is a positive amount below the regular price AND the promo
 *  has not expired. This is the single rule used everywhere (checkout + API). */
export function activePromoUsd(p: Product, now: number = Date.now()): number | null {
  if (p.promoUsd == null) return null;
  const promo = Number(p.promoUsd);
  if (!Number.isFinite(promo) || promo <= 0 || promo >= p.usd) return null;
  if (p.promoEnds) {
    const t = Date.parse(p.promoEnds);
    if (Number.isFinite(t) && t <= now) return null; // expired
  }
  return Math.floor(promo);
}

/** Effective unit price (whole USD): the sale price if a promo is live, else base. */
export function effectiveUsd(p: Product, now: number = Date.now()): number {
  return activePromoUsd(p, now) ?? p.usd;
}

// This object is the SEED + safety fallback; the live catalogue is in D1
// (products table, migration 0005). TypixDeck is a single configurable SKU:
// $119 bare body + the chosen `compute` option delta (cm0 +$40, cm4 +$95,
// cm5 +$105; reference no-eMMC "Lite" 4GB street prices, Jun 2026) plus an
// optional `storage` delta. The deltas live in OPTIONS_SEED / product_option_values.
export const PRODUCTS: Record<string, Product> = {
  typixdeck: {
    id: 'typixdeck',
    usd: 119,
    name: {
      en: 'TypixDeck (body only)',
      zh: 'TypixDeck（仅机身）',
      ja: 'TypixDeck（本体のみ）',
    },
    img: '/assets/cyberdeck.png',
  },
  // CM4 / CM5 / CM0 are NOT separate SKUs. TypixDeck is one configurable product:
  // base $119 + the chosen `compute` option delta (cm0 +$40, cm4 +$95, cm5 +$105)
  // — see OPTIONS_SEED below and product_option_values (migration 0006).
  keyboard: {
    id: 'keyboard',
    usd: 39,
    name: { en: 'BLE Keyboard', zh: '蓝牙键盘', ja: 'BLE キーボード' },
    img: '/assets/keyboard.jpg',
  },
  'keyboard-wired': {
    id: 'keyboard-wired',
    usd: 29,
    name: { en: 'Wired Keyboard', zh: '有线键盘', ja: '有線キーボード' },
    img: '/assets/keyboard.jpg',
  },
  diysuite: {
    id: 'diysuite',
    usd: 9,
    name: {
      en: 'Silicone Snap-Dome DIY Kit',
      zh: '硅胶锅仔片 DIY 套件',
      ja: 'シリコンドーム DIY キット',
    },
    img: '/assets/diysuite.jpg',
  },
  picomac: {
    id: 'picomac',
    usd: 60,
    name: { en: 'Pico-Mac Nano', zh: 'Pico-Mac Nano', ja: 'Pico-Mac Nano' },
    img: '/assets/picomac.jpg',
  },
  // CM0-to-CM4 adapter with a CM0 module already soldered on (ready to drop in).
  'cm0-adapter': {
    id: 'cm0-adapter',
    usd: 40,
    name: {
      en: 'CM0→CM4 Adapter (CM0 soldered)',
      zh: 'CM0 转 CM4 转接板（已贴片 CM0）',
      ja: 'CM0→CM4 アダプタ（CM0 実装済）',
    },
    img: '/assets/cm0-adapter.png',
  },
  // Standalone CM0 module (castellated 132-pin, for your own adapter build).
  'cm0-module': {
    id: 'cm0-module',
    usd: 30,
    name: {
      en: 'CM0 Module',
      zh: 'CM0 模块',
      ja: 'CM0 モジュール',
    },
    img: '/assets/cm0-module.jpeg',
  },
  // Bare CM0→CM4 adapter PCB (no CM0 soldered) — solder your own.
  'cm0-adapter-raw': {
    id: 'cm0-adapter-raw',
    usd: 10,
    name: {
      en: 'CM0→CM4 Adapter (bare board)',
      zh: 'CM0 转 CM4 转接板（裸板）',
      ja: 'CM0→CM4 アダプタ（基板のみ）',
    },
    img: '/assets/cm0-adapter-raw.png',
  },
};

export type Locale = 'en' | 'zh' | 'ja';

// ---------------------------------------------------------------------------
// TypixDeck configurator (single SKU + options).
//
// `typixdeck` is sold as ONE product whose price is the body base ($119) plus
// the chosen option deltas. The SERVER is the price authority: resolveCart()
// re-derives every amount from this table and never trusts client prices.
// The chosen configuration is snapshotted onto the order line (options[]),
// so historical orders stay reconstructable even if this table changes.
//
// The former fixed bundle SKUs (typixdeck-cm0/cm4/cm5) have been removed —
// they only duplicated the `compute` option deltas. Standalone parts
// (cm0-adapter, cm0-module, cm0-adapter-raw) are genuine separate products.
// ---------------------------------------------------------------------------
interface OptionValue {
  delta: number; // USD added to the base
  label: { en: string; zh: string; ja: string };
  note?: { en: string; zh: string; ja: string }; // advisory text (not a hard block)
}
interface OptionGroup {
  label: { en: string; zh: string; ja: string };
  required: boolean;
  values: Record<string, OptionValue>;
  default: string;
}
/** sku -> groupKey -> OptionGroup. Drives configurable products like typixdeck. */
export type OptionsMap = Record<string, Record<string, OptionGroup>>;

// Hard-coded SEED + safety fallback. The live values live in D1
// (product_option_values, migration 0006) so the dashboard can edit deltas
// without a deploy. loadOptions() reads the DB; this is used only when the DB
// is empty/unreachable. Keep in sync with the migration seed.
export const OPTIONS_SEED: OptionsMap = {
  typixdeck: {
    compute: {
      label: { en: 'Compute', zh: '核心', ja: 'コンピュート' },
      required: true,
      default: 'body',
      values: {
        body: { delta: 0, label: { en: 'Body only', zh: '仅机身', ja: '本体のみ' } },
        cm0: { delta: 40, label: { en: 'CM0 (soldered CM0→CM4 adapter)', zh: 'CM0（含贴片转接板）', ja: 'CM0（実装済アダプタ）' } },
        cm4_2g: { delta: 75, label: { en: 'CM4 · 2GB · Wi-Fi · no eMMC', zh: 'CM4 · 2GB · WiFi · 无 eMMC', ja: 'CM4 · 2GB · Wi-Fi · eMMC なし' } },
        cm4: { delta: 95, label: { en: 'CM4 · 4GB · Wi-Fi · no eMMC', zh: 'CM4 · 4GB · WiFi · 无 eMMC', ja: 'CM4 · 4GB · Wi-Fi · eMMC なし' } },
        cm5: { delta: 105, label: { en: 'CM5 · 4GB · Wi-Fi · no eMMC', zh: 'CM5 · 4GB · WiFi · 无 eMMC', ja: 'CM5 · 4GB · Wi-Fi · eMMC なし' } },
        cm5_8g: { delta: 130, label: { en: 'CM5 · 8GB · Wi-Fi · no eMMC', zh: 'CM5 · 8GB · WiFi · 无 eMMC', ja: 'CM5 · 8GB · Wi-Fi · eMMC なし' } },
        cm5_16g: { delta: 165, label: { en: 'CM5 · 16GB · Wi-Fi · no eMMC', zh: 'CM5 · 16GB · WiFi · 无 eMMC', ja: 'CM5 · 16GB · Wi-Fi · eMMC なし' } },
        // "custom" routes to the custom-order email flow on the site; it is not a
        // real add-to-cart price (delta 0, guarded client-side).
        custom: { delta: 0, label: { en: 'Custom / other', zh: '其他定制', ja: 'カスタム / その他' } },
      },
    },
    storage: {
      label: { en: 'Storage', zh: '存储', ja: 'ストレージ' },
      required: false,
      default: 'none',
      values: {
        none: { delta: 0, label: { en: 'No TF card', zh: '不含 TF 卡', ja: 'TF カードなし' } },
        tf64: { delta: 19, label: { en: 'SanDisk 64GB · Raspberry Pi OS preloaded', zh: 'SanDisk 64GB · 预装树莓派 OS', ja: 'SanDisk 64GB · Raspberry Pi OS プリインストール' } },
        ssd128: {
          delta: 25,
          label: { en: 'M.2 SSD 128GB · 2230 · OS preloaded', zh: 'M.2 SSD 128GB · 2230 · 预装系统', ja: 'M.2 SSD 128GB · 2230 · OS プリインストール' },
          note: { en: 'CM4 / CM5 only — CM0 uses eMMC or a TF card', zh: '仅 CM4 / CM5 可用 — CM0 只能用 eMMC 或 TF 卡', ja: 'CM4 / CM5 のみ — CM0 は eMMC か TF カード' },
        },
        tf128: { delta: 29, label: { en: 'SanDisk 128GB · Raspberry Pi OS preloaded', zh: 'SanDisk 128GB · 预装树莓派 OS', ja: 'SanDisk 128GB · Raspberry Pi OS プリインストール' } },
        ssd256: {
          delta: 45,
          label: { en: 'M.2 SSD 256GB · 2230 · OS preloaded', zh: 'M.2 SSD 256GB · 2230 · 预装系统', ja: 'M.2 SSD 256GB · 2230 · OS プリインストール' },
          note: { en: 'CM4 / CM5 only — CM0 uses eMMC or a TF card', zh: '仅 CM4 / CM5 可用 — CM0 只能用 eMMC 或 TF 卡', ja: 'CM4 / CM5 のみ — CM0 は eMMC か TF カード' },
        },
      },
    },
  },
};

/** A chosen configuration, e.g. { compute: 'cm5', storage: 'ssd128' }. */
export type ConfigSelection = Record<string, string>;

/** Snapshot of one chosen option, stored on the order line. */
export interface ResolvedOption {
  group: string;
  value: string;
  label: string;
  deltaUsd: number;
}

export interface CartLine {
  id: string;
  qty: number;
  options?: ConfigSelection;
}

export interface ResolvedLine {
  id: string;
  name: string;
  qty: number;
  unitPriceUsd: number; // whole dollars
  unitAmount: number; // cents (minor units) — what Stripe/PayPal expect
  options?: ResolvedOption[]; // configuration snapshot (configured products only)
}

/**
 * Price a configured product line against a given options table.
 * Validates each option (unknown/missing -> the group default), sums the deltas
 * onto the base, and returns the line with a configuration snapshot. The price
 * comes entirely from `base` (products.usd) + `groups` (DB deltas) — nothing
 * is hard-coded in the hot path.
 */
function resolveConfigured(
  id: string,
  baseName: string,
  baseUsd: number,
  groups: Record<string, OptionGroup>,
  raw: ConfigSelection | undefined,
  qty: number,
  locale: Locale
): ResolvedLine {
  const sel: ResolvedOption[] = [];
  let priceUsd = baseUsd;
  for (const groupKey of Object.keys(groups)) {
    const group = groups[groupKey];
    const chosen = raw?.[groupKey];
    const valueKey = chosen && group.values[chosen] ? chosen : group.default;
    const v = group.values[valueKey];
    if (!v) continue;
    priceUsd += v.delta;
    sel.push({ group: groupKey, value: valueKey, label: v.label[locale] ?? v.label.en, deltaUsd: v.delta });
  }
  const name = [baseName, ...sel.map((s) => s.label)].join(' · ');
  return { id, name, qty, unitPriceUsd: priceUsd, unitAmount: priceUsd * 100, options: sel };
}

/** Validate + price a raw client cart against the seed catalogue + seed options.
 *  Synchronous, hard-coded fallback path. DB-backed callers use resolveCartDb. */
export function resolveCart(lines: unknown, locale: Locale = 'en'): ResolvedLine[] {
  return resolveCartWith(PRODUCTS, lines, locale, OPTIONS_SEED);
}

/** Subtotal in cents. */
export function subtotalCents(lines: ResolvedLine[]): number {
  return lines.reduce((n, l) => n + l.unitAmount * l.qty, 0);
}

// ---------------------------------------------------------------------------
// D1-backed catalogue. Prices/names live in the `products` table (migration
// 0005) so the dashboard can edit them without a deploy. The hard-coded
// PRODUCTS above is the seed + a safety fallback if the DB is empty/unreachable.
// A short in-process cache avoids a DB hit on every request (workers are
// short-lived, so this is effectively per-isolate).
// ---------------------------------------------------------------------------
let _catalogCache: { at: number; map: Record<string, Product> } | null = null;
const CATALOG_TTL_MS = 60_000;

export async function loadCatalog(db: D1Database | undefined): Promise<Record<string, Product>> {
  if (!db) return PRODUCTS;
  const now = Date.now();
  if (_catalogCache && now - _catalogCache.at < CATALOG_TTL_MS) return _catalogCache.map;
  try {
    const rs = await db
      .prepare(
        `SELECT sku, name_en, name_zh, name_ja, usd, img, promo_usd, promo_ends FROM products WHERE active = 1 ORDER BY sort`
      )
      .all();
    const rows = (rs?.results ?? []) as any[];
    if (!rows.length) return PRODUCTS; // empty table -> fall back to seed
    const map: Record<string, Product> = {};
    for (const r of rows) {
      map[r.sku] = {
        id: r.sku,
        usd: Number(r.usd) || 0,
        name: { en: r.name_en, zh: r.name_zh, ja: r.name_ja },
        img: r.img ?? '',
        promoUsd: r.promo_usd == null ? null : Number(r.promo_usd),
        promoEnds: r.promo_ends ?? null,
      };
    }
    _catalogCache = { at: now, map };
    return map;
  } catch {
    return PRODUCTS; // DB error -> never block checkout, use seed
  }
}

// Options cache (same TTL/fallback rationale as the catalogue cache).
let _optionsCache: { at: number; map: OptionsMap } | null = null;

/** Load the configurable-option table from D1 (product_option_values, 0006).
 *  Falls back to OPTIONS_SEED when the DB is empty/unreachable. */
export async function loadOptions(db: D1Database | undefined): Promise<OptionsMap> {
  if (!db) return OPTIONS_SEED;
  const now = Date.now();
  if (_optionsCache && now - _optionsCache.at < CATALOG_TTL_MS) return _optionsCache.map;
  try {
    const rs = await db
      .prepare(
        `SELECT product_sku, group_key, value_key,
                group_label_en, group_label_zh, group_label_ja,
                label_en, label_zh, label_ja, delta_usd,
                note_en, note_zh, note_ja, required, is_default, sort
           FROM product_option_values
          WHERE active = 1
          ORDER BY product_sku, group_key, sort`
      )
      .all();
    const rows = (rs?.results ?? []) as any[];
    if (!rows.length) return OPTIONS_SEED; // empty -> seed
    const map: OptionsMap = {};
    for (const r of rows) {
      const sku = r.product_sku as string;
      const gk = r.group_key as string;
      const vk = r.value_key as string;
      const bySku = (map[sku] ||= {});
      const grp = (bySku[gk] ||= {
        label: { en: r.group_label_en || gk, zh: r.group_label_zh || gk, ja: r.group_label_ja || gk },
        required: !!r.required,
        default: vk, // tentative; overwritten by the is_default row below
        values: {},
      });
      grp.values[vk] = {
        delta: Number(r.delta_usd) || 0,
        label: { en: r.label_en, zh: r.label_zh, ja: r.label_ja },
        note: r.note_en || r.note_zh || r.note_ja
          ? { en: r.note_en ?? '', zh: r.note_zh ?? '', ja: r.note_ja ?? '' }
          : undefined,
      };
      if (r.is_default) grp.default = vk;
    }
    // Guard: ensure each group's default points at an existing value.
    for (const sku of Object.keys(map))
      for (const gk of Object.keys(map[sku])) {
        const g = map[sku][gk];
        if (!g.values[g.default]) g.default = Object.keys(g.values)[0];
      }
    _optionsCache = { at: now, map };
    return map;
  } catch {
    return OPTIONS_SEED;
  }
}

/** Like resolveCart but prices from a given catalogue map + options map (DB-backed).
 *  A line whose `id` has an options definition AND a base product is priced as
 *  base + option deltas; everything else uses the flat product price. */
export function resolveCartWith(
  catalog: Record<string, Product>,
  lines: unknown,
  locale: Locale = 'en',
  options: OptionsMap = OPTIONS_SEED,
  now: number = Date.now()
): ResolvedLine[] {
  if (!Array.isArray(lines)) return [];
  const out: ResolvedLine[] = [];
  for (const raw of lines) {
    if (!raw || typeof raw !== 'object') continue;
    const id = String((raw as any).id ?? '');
    const qty = Math.max(1, Math.min(99, Math.floor(Number((raw as any).qty ?? 0))));
    if (!Number.isFinite(qty) || qty < 1) continue;
    const p = catalog[id];
    if (!p) continue;

    // Promo (limited-time sale) applies ONLY to the product's base price; option
    // deltas are never discounted. Effective price is authoritative for money.
    const baseUsd = effectiveUsd(p, now);

    const groups = options[id];
    if (groups) {
      // Configured product: base (products.usd, promo-adjusted) + option deltas.
      // Use a clean base name (strip a "(body only)"-style suffix) so the
      // composed name reads "TypixDeck · CM5 · … · M.2 SSD …".
      const fullName = p.name[locale] ?? p.name.en;
      const baseName = fullName.replace(/\s*[（(].*?[)）]\s*$/, '').trim();
      const opts = (raw as any).options;
      out.push(
        resolveConfigured(
          id,
          baseName,
          baseUsd,
          groups,
          opts && typeof opts === 'object' ? opts : undefined,
          qty,
          locale
        )
      );
      continue;
    }

    out.push({
      id,
      name: p.name[locale] ?? p.name.en,
      qty,
      unitPriceUsd: baseUsd,
      unitAmount: baseUsd * 100,
    });
  }
  return out;
}

/** Convenience: load catalogue + options from D1 then resolve a client cart. */
export async function resolveCartDb(
  db: D1Database | undefined,
  lines: unknown,
  locale: Locale = 'en'
): Promise<ResolvedLine[]> {
  const [catalog, options] = await Promise.all([loadCatalog(db), loadOptions(db)]);
  return resolveCartWith(catalog, lines, locale, options);
}

// ---------------------------------------------------------------------------
// Shipping. The marketing copy promises "free worldwide shipping", so the
// default rule is $0. Kept as a function so per-region rates can be added later
// without touching the checkout routes.
// ---------------------------------------------------------------------------
export interface ShippingOption {
  id: string;
  label: string;
  amount: number; // cents
}

export function shippingOptions(_country?: string): ShippingOption[] {
  return [{ id: 'free', label: 'Free worldwide shipping', amount: 0 }];
}

/** Countries we ship to (Stripe `shipping_address_collection`). Worldwide. */
export const SHIPPING_COUNTRIES = 'WORLDWIDE' as const;

// ---------------------------------------------------------------------------
// Order id — short, sortable-ish, prefixed. No Math.random in Workers-safe code
// path is required here (this runs server-side in the request, where crypto is
// available), so we use crypto.randomUUID slice.
// ---------------------------------------------------------------------------
export function newOrderId(): string {
  const uuid = crypto.randomUUID().replace(/-/g, '');
  return `ord_${uuid.slice(0, 20)}`;
}
