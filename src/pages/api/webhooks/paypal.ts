// POST /api/webhooks/paypal — PayPal webhook receiver (reliability backstop).
// The synchronous /api/paypal/capture path already marks orders paid; this
// webhook catches the case where the buyer approves payment but the browser
// never reaches onApprove (closed tab, network drop). Idempotent: markPaidByRef
// is a no-op if the order is already paid.
import type { APIRoute } from 'astro';
import { verifyWebhookSignature, paypalConfigured } from '../../../lib/paypal';
import { markPaidByRef } from '../../../lib/orders';
import { sendEmail, orderConfirmationHtml } from '../../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env as Env;
  if (!paypalConfigured(env) || !env?.PAYPAL_WEBHOOK_ID) {
    return new Response('PayPal webhook not configured', { status: 500 });
  }

  const rawBody = await request.text();
  const ok = await verifyWebhookSignature(env, request.headers, rawBody);
  if (!ok) {
    console.error('[paypal webhook] signature verification failed');
    return new Response('signature verification failed', { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('bad json', { status: 400 });
  }

  // We care about completed captures. The order id (our provider_ref) is in
  // the capture's supplementary_data or the parent order link; PayPal includes
  // it differently per event, so resolve defensively.
  const type = event?.event_type as string;
  if (type === 'PAYMENT.CAPTURE.COMPLETED' || type === 'CHECKOUT.ORDER.APPROVED') {
    const res = event?.resource ?? {};
    // For PAYMENT.CAPTURE.COMPLETED the PayPal order id is in
    // supplementary_data.related_ids.order_id; for CHECKOUT.ORDER.APPROVED it's resource.id.
    const orderRef: string | undefined =
      res?.supplementary_data?.related_ids?.order_id ?? res?.id;
    const txn: string | undefined = res?.id;
    const email: string | null = res?.payer?.email_address ?? null;

    if (orderRef && env.DB) {
      try {
        const order = await markPaidByRef(env.DB, orderRef, txn ?? null, email);
        // Send confirmation only if this webhook is the one that flipped it to
        // paid AND we have an email (avoid duplicate emails vs the capture path
        // is acceptable — Resend dedupe is out of scope; keep best-effort).
        if (order && order.status === 'paid' && email) {
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
            subject: `Your TypixNode order ${order.id}`,
            html: orderConfirmationHtml({
              orderId: String(order.id), items,
              amountTotal: Number(order.amount_total), currency: String(order.currency),
            }),
          });
        }
      } catch (e: any) {
        console.error('[paypal webhook] handling error', e?.message || e);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
