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
}

// Prices are hardcoded for now (a D1-backed admin will replace this later).
// TypixDeck pricing: $119 bare body (no battery, no compute module). The CM4 /
// CM5 bundles = bare + the module's street price (no-eMMC "Lite", Wireless,
// 4GB RAM default) and ship WITH a free battery. Reference street prices
// (excl. tax/duties, Jun 2026): CM4 4GB Lite ≈ $95 -> 119+95 = 214;
// CM5 4GB Lite ≈ $105 -> 119+105 = 224. We standardise on no-eMMC modules.
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
  'typixdeck-cm4': {
    id: 'typixdeck-cm4',
    usd: 214,
    name: {
      en: 'TypixDeck · CM4 4GB (+ battery)',
      zh: 'TypixDeck · CM4 4GB（含电池）',
      ja: 'TypixDeck · CM4 4GB（バッテリー付）',
    },
    img: '/assets/cyberdeck.png',
  },
  'typixdeck-cm5': {
    id: 'typixdeck-cm5',
    usd: 224,
    name: {
      en: 'TypixDeck · CM5 4GB (+ battery)',
      zh: 'TypixDeck · CM5 4GB（含电池）',
      ja: 'TypixDeck · CM5 4GB（バッテリー付）',
    },
    img: '/assets/cyberdeck.png',
  },
  // CM0 version: bare body ($119) + the pre-soldered CM0→CM4 adapter ($40) = $159.
  'typixdeck-cm0': {
    id: 'typixdeck-cm0',
    usd: 159,
    name: {
      en: 'TypixDeck · CM0 (soldered adapter)',
      zh: 'TypixDeck · CM0（含贴片转接板）',
      ja: 'TypixDeck · CM0（実装済アダプタ付）',
    },
    img: '/assets/cm0-adapter.png',
  },
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
// Legacy fixed SKUs (typixdeck-cm0/cm4/cm5, cm0-*, etc.) remain in PRODUCTS
// for backward compatibility with old carts/orders.
// ---------------------------------------------------------------------------
export const TYPIXDECK_BASE_USD = 119;

interface OptionValue {
  delta: number; // USD added to the base
  label: { en: string; zh: string; ja: string };
  note?: { en: string; zh: string; ja: string }; // advisory text (not a hard block)
}
interface OptionGroup {
  label: { en: string; zh: string; ja: string };
  values: Record<string, OptionValue>;
  default: string;
}

export const TYPIXDECK_OPTIONS: Record<string, OptionGroup> = {
  compute: {
    label: { en: 'Compute', zh: '核心', ja: 'コンピュート' },
    default: 'body',
    values: {
      body: { delta: 0, label: { en: 'Body only', zh: '仅机身', ja: '本体のみ' } },
      cm0: { delta: 40, label: { en: 'CM0 (soldered CM0→CM4 adapter)', zh: 'CM0（含贴片转接板）', ja: 'CM0（実装済アダプタ）' } },
      cm4: { delta: 95, label: { en: 'CM4 · 4GB · Wi-Fi · no eMMC', zh: 'CM4 · 4GB · WiFi · 无 eMMC', ja: 'CM4 · 4GB · Wi-Fi · eMMC なし' } },
      cm5: { delta: 105, label: { en: 'CM5 · 4GB · Wi-Fi · no eMMC', zh: 'CM5 · 4GB · WiFi · 无 eMMC', ja: 'CM5 · 4GB · Wi-Fi · eMMC なし' } },
    },
  },
  storage: {
    label: { en: 'Storage', zh: '存储', ja: 'ストレージ' },
    default: 'none',
    values: {
      none: { delta: 0, label: { en: 'No TF card', zh: '不含 TF 卡', ja: 'TF カードなし' } },
      tf64: { delta: 19, label: { en: 'SanDisk 64GB · Raspberry Pi OS preloaded', zh: 'SanDisk 64GB · 预装树莓派 OS', ja: 'SanDisk 64GB · Raspberry Pi OS プリインストール' } },
      ssd128: {
        delta: 25,
        label: { en: 'M.2 SSD 128GB · Toshiba 2230 · OS preloaded', zh: 'M.2 SSD 128GB · 东芝 2230 · 预装系统', ja: 'M.2 SSD 128GB · 東芝 2230 · OS プリインストール' },
        note: { en: 'CM4 / CM5 only — CM0 uses eMMC or a TF card', zh: '仅 CM4 / CM5 可用 — CM0 只能用 eMMC 或 TF 卡', ja: 'CM4 / CM5 のみ — CM0 は eMMC か TF カード' },
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
 * Price a configured `typixdeck` line. Validates each option against
 * TYPIXDECK_OPTIONS (unknown/missing -> the group default), sums the deltas
 * onto the base, and returns the resolved line with a configuration snapshot.
 */
function resolveTypixdeck(raw: ConfigSelection | undefined, qty: number, locale: Locale): ResolvedLine {
  const sel: ResolvedOption[] = [];
  let priceUsd = TYPIXDECK_BASE_USD;
  for (const groupKey of Object.keys(TYPIXDECK_OPTIONS)) {
    const group = TYPIXDECK_OPTIONS[groupKey];
    const chosen = raw?.[groupKey];
    const valueKey = chosen && group.values[chosen] ? chosen : group.default;
    const v = group.values[valueKey];
    priceUsd += v.delta;
    sel.push({ group: groupKey, value: valueKey, label: v.label[locale] ?? v.label.en, deltaUsd: v.delta });
  }
  // Name = "TypixDeck · <compute label> · <storage label>"
  const name = ['TypixDeck', ...sel.map((s) => s.label)].join(' · ');
  return { id: 'typixdeck', name, qty, unitPriceUsd: priceUsd, unitAmount: priceUsd * 100, options: sel };
}

/** Validate + price a raw client cart against the server catalogue. */
export function resolveCart(lines: unknown, locale: Locale = 'en'): ResolvedLine[] {
  if (!Array.isArray(lines)) return [];
  const out: ResolvedLine[] = [];
  for (const raw of lines) {
    if (!raw || typeof raw !== 'object') continue;
    const id = String((raw as any).id ?? '');
    const qty = Math.max(1, Math.min(99, Math.floor(Number((raw as any).qty ?? 0))));
    if (!Number.isFinite(qty) || qty < 1) continue;

    // Configured single-SKU product: price = base + option deltas (server-authoritative).
    if (id === 'typixdeck') {
      const opts = (raw as any).options;
      out.push(resolveTypixdeck(opts && typeof opts === 'object' ? opts : undefined, qty, locale));
      continue;
    }

    const p = PRODUCTS[id];
    if (!p) continue;
    out.push({
      id,
      name: p.name[locale] ?? p.name.en,
      qty,
      unitPriceUsd: p.usd,
      unitAmount: p.usd * 100,
    });
  }
  return out;
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
        `SELECT sku, name_en, name_zh, name_ja, usd, img FROM products WHERE active = 1 ORDER BY sort`
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
      };
    }
    _catalogCache = { at: now, map };
    return map;
  } catch {
    return PRODUCTS; // DB error -> never block checkout, use seed
  }
}

/** Like resolveCart but prices from a given catalogue map (DB-backed). */
export function resolveCartWith(
  catalog: Record<string, Product>,
  lines: unknown,
  locale: Locale = 'en'
): ResolvedLine[] {
  if (!Array.isArray(lines)) return [];
  const out: ResolvedLine[] = [];
  for (const raw of lines) {
    if (!raw || typeof raw !== 'object') continue;
    const id = String((raw as any).id ?? '');
    const qty = Math.max(1, Math.min(99, Math.floor(Number((raw as any).qty ?? 0))));
    const p = catalog[id];
    if (!p || !Number.isFinite(qty) || qty < 1) continue;
    out.push({
      id,
      name: p.name[locale] ?? p.name.en,
      qty,
      unitPriceUsd: p.usd,
      unitAmount: p.usd * 100,
    });
  }
  return out;
}

/** Convenience: load catalogue from D1 then resolve a client cart against it. */
export async function resolveCartDb(
  db: D1Database | undefined,
  lines: unknown,
  locale: Locale = 'en'
): Promise<ResolvedLine[]> {
  const catalog = await loadCatalog(db);
  return resolveCartWith(catalog, lines, locale);
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
