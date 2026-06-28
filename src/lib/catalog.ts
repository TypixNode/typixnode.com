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

export interface CartLine {
  id: string;
  qty: number;
}

export interface ResolvedLine {
  id: string;
  name: string;
  qty: number;
  unitPriceUsd: number; // whole dollars
  unitAmount: number; // cents (minor units) — what Stripe/PayPal expect
}

/** Validate + price a raw client cart against the server catalogue. */
export function resolveCart(lines: unknown, locale: Locale = 'en'): ResolvedLine[] {
  if (!Array.isArray(lines)) return [];
  const out: ResolvedLine[] = [];
  for (const raw of lines) {
    if (!raw || typeof raw !== 'object') continue;
    const id = String((raw as any).id ?? '');
    const qty = Math.max(1, Math.min(99, Math.floor(Number((raw as any).qty ?? 0))));
    const p = PRODUCTS[id];
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
