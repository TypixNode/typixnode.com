// POST /api/orders/claim  { orderId, email }
// Attach an order to the logged-in account after proving ownership (the order
// id must exist AND the email must match the one on the order).
import type { APIRoute } from 'astro';
import { getSessionUserId } from '../../../lib/auth';
import { claimOrder } from '../../../lib/users';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const env = (locals as any).runtime?.env as Env;
  const json = (d: unknown, s = 200) =>
    new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  const userId = await getSessionUserId(env, cookies);
  if (!userId) return json({ error: 'Not signed in.' }, 401);
  if (!env?.DB) return json({ error: 'Database unavailable.' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }
  const orderId = String(body?.orderId || '').trim();
  const email = String(body?.email || '').trim();
  if (!orderId || !email) return json({ error: 'Order id and email are required.' }, 400);

  const ok = await claimOrder(env.DB, userId, orderId, email);
  if (!ok) return json({ error: 'No order matches that id and email.' }, 404);
  return json({ ok: true });
};
