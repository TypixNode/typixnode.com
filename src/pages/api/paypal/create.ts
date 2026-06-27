// POST /api/paypal/create — create a PayPal order for the cart.
// Body: { items: [{id, qty}], locale? } -> { id }
import type { APIRoute } from 'astro';
import { resolveCart, subtotalCents, newOrderId, type Locale } from '../../../lib/catalog';
import { createOrder } from '../../../lib/orders';
import { createPayPalOrder, paypalConfigured } from '../../../lib/paypal';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env as Env;
  const json = (d: unknown, s = 200) =>
    new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  if (!paypalConfigured(env)) {
    return json({ error: 'PayPal not configured.' }, 500);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  const locale: Locale = ['en', 'zh', 'ja'].includes(body?.locale) ? body.locale : 'en';
  const lines = resolveCart(body?.items, locale);
  if (lines.length === 0) return json({ error: 'Empty cart.' }, 400);

  const orderId = newOrderId();
  const total = subtotalCents(lines);

  try {
    const pp = await createPayPalOrder(
      env,
      total,
      lines.map((l) => ({ name: l.name, qty: l.qty, unitAmount: l.unitAmount })),
      orderId
    );

    if (env.DB) {
      await createOrder(env.DB, {
        id: orderId,
        provider: 'paypal',
        providerRef: pp.id, // PayPal order id
        amountTotal: total,
        currency: 'usd',
        status: 'pending',
        locale,
        items: lines,
      });
    }

    return json({ id: pp.id });
  } catch (e: any) {
    console.error('[paypal/create]', e?.message || e);
    return json({ error: 'Failed to create PayPal order.' }, 500);
  }
};
