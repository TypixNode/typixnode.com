// POST /api/paypal/capture — capture an approved PayPal order.
// Body: { orderID } -> { status, orderId }
import type { APIRoute } from 'astro';
import { capturePayPalOrder, paypalConfigured } from '../../../lib/paypal';
import { markPaidByRef } from '../../../lib/orders';
import { sendEmail, orderConfirmationHtml } from '../../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env as Env;
  const json = (d: unknown, s = 200) =>
    new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  if (!paypalConfigured(env)) return json({ error: 'PayPal not configured.' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }
  const ppOrderId = String(body?.orderID || '');
  if (!ppOrderId) return json({ error: 'Missing orderID.' }, 400);

  try {
    const result = await capturePayPalOrder(env, ppOrderId);
    const completed = result?.status === 'COMPLETED';
    const payer = result?.payer;
    const email = payer?.email_address ?? null;
    const name = payer?.name ? `${payer.name.given_name ?? ''} ${payer.name.surname ?? ''}`.trim() : null;
    const shipping = result?.purchase_units?.[0]?.shipping ?? null;

    let order: Record<string, unknown> | null = null;
    if (completed && env.DB) {
      order = await markPaidByRef(env.DB, ppOrderId, ppOrderId, email, name, shipping);
    }

    if (completed && order && email) {
      let items: Array<{ name: string; qty: number; unitPriceUsd: number }> = [];
      try {
        items = JSON.parse(String(order.items)).map((l: any) => ({
          name: l.name, qty: l.qty, unitPriceUsd: l.unitPriceUsd,
        }));
      } catch {}
      await sendEmail({
        apiKey: env.RESEND_API_KEY,
        from: env.FROM_EMAIL || 'TypixNode <onboarding@resend.dev>',
        to: email,
        replyTo: 'support@typixnode.com',
        subject: `Your TypixNode order ${order.id}`,
        html: orderConfirmationHtml({
          orderId: String(order.id), items,
          amountTotal: Number(order.amount_total), currency: String(order.currency),
        }),
      });
    }

    return json({ status: result?.status, orderId: order?.id ?? null });
  } catch (e: any) {
    console.error('[paypal/capture]', e?.message || e);
    return json({ error: 'Failed to capture PayPal order.' }, 500);
  }
};
