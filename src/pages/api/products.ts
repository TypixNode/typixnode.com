// GET /api/products — public price list for the storefront front-end.
// site.js fetches this on load so cart prices come from D1 (dashboard-editable)
// instead of a hard-coded table. Falls back to the seed catalogue if DB empty.
import type { APIRoute } from 'astro';
import { loadCatalog } from '../../lib/catalog';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const env = (locals as any).runtime?.env as Env;
  const catalog = await loadCatalog(env?.DB);
  // Shape mirrors site.js's PRODUCTS: { sku: { img, usd, name:{en,zh,ja} } }
  const out: Record<string, { img: string; usd: number; name: Record<string, string> }> = {};
  for (const [sku, p] of Object.entries(catalog)) {
    out[sku] = { img: p.img, usd: p.usd, name: p.name };
  }
  return new Response(JSON.stringify(out), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Cache at the edge for a minute; dashboard edits propagate within ~1min.
      'Cache-Control': 'public, max-age=60',
    },
  });
};
