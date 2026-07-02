// GET /api/fx — USD-based exchange rates for DISPLAY ONLY.
// The storefront (site.js) and the admin dashboard fetch this to show localized
// prices / a CNY hint. It is NOT authoritative for money movement: checkout always
// charges USD and prices are recomputed server-side from D1 (see /api/checkout).
//
// Rates come from a free, key-less provider (open.er-api.com), cached at the edge
// for 6h. If the upstream is unavailable we fall back to the historical fixed rates
// so the UI never breaks.
import type { APIRoute } from 'astro';

export const prerender = false;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'JPY'] as const;

// Display-only fallback — matches the values previously hard-coded in site.js.
const FALLBACK: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, CNY: 7.2, JPY: 156 };

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const GET: APIRoute = async () => {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', {
      // Cache the upstream response at the Cloudflare edge for 6h.
      cf: { cacheTtl: 21600, cacheEverything: true },
    } as any);
    if (r.ok) {
      const j: any = await r.json();
      if (j && j.result === 'success' && j.rates) {
        const rates: Record<string, number> = { USD: 1 };
        for (const c of CURRENCIES) {
          if (typeof j.rates[c] === 'number' && j.rates[c] > 0) rates[c] = j.rates[c];
        }
        return new Response(
          JSON.stringify({ base: 'USD', rates, live: true, updated: j.time_last_update_unix ?? null }),
          { headers: { ...CORS, 'Cache-Control': 'public, max-age=21600' } }
        );
      }
    }
  } catch (e: any) {
    console.warn('[fx] upstream failed:', e?.message || e);
  }
  // Fallback — short cache so we retry the live source soon.
  return new Response(
    JSON.stringify({ base: 'USD', rates: FALLBACK, live: false, updated: null }),
    { headers: { ...CORS, 'Cache-Control': 'public, max-age=300' } }
  );
};

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
