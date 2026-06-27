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
