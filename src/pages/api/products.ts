// GET /api/products — public price list for the storefront front-end.
// site.js fetches this on load so cart prices come from D1 (dashboard-editable)
// instead of a hard-coded table. Falls back to the seed catalogue if DB empty.
import type { APIRoute } from 'astro';
import { loadCatalog, loadOptions } from '../../lib/catalog';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const env = (locals as any).runtime?.env as Env;
  const [catalog, options] = await Promise.all([loadCatalog(env?.DB), loadOptions(env?.DB)]);
  // products: { sku: { img, usd, name:{en,zh,ja} } }
  const products: Record<string, { img: string; usd: number; name: Record<string, string> }> = {};
  for (const [sku, p] of Object.entries(catalog)) {
    products[sku] = { img: p.img, usd: p.usd, name: p.name };
  }
  // options: { sku: { group: { label, required, default, values:[{key,delta,label,note}] } } }
  // Configurable-product surcharges, so the storefront shows DB-driven prices.
  const opts: Record<string, any> = {};
  for (const [sku, groups] of Object.entries(options)) {
    opts[sku] = {};
    for (const [gk, g] of Object.entries(groups)) {
      opts[sku][gk] = {
        label: g.label,
        required: g.required,
        default: g.default,
        values: Object.entries(g.values).map(([key, v]) => ({
          key,
          delta: v.delta,
          label: v.label,
          note: v.note ?? null,
        })),
      };
    }
  }
  const out = { products, options: opts };
  return new Response(JSON.stringify(out), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Cache at the edge for a minute; dashboard edits propagate within ~1min.
      'Cache-Control': 'public, max-age=60',
    },
  });
};
