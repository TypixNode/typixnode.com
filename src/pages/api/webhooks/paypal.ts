// POST /api/webhooks/paypal — PayPal webhook receiver (reliability backstop).
// The synchronous /api/paypal/capture path already marks orders paid; this
// webhook catches the case where the buyer approves payment but the browser
// never reaches onApprove (closed tab, network drop). Idempotent: markPaidByRef
// is a no-op if the order is already paid.
import type { APIRoute } from 'astro';
import { verifyWebhookSignature, paypalConfigured, capturePayPalOrder } from '../../../lib/paypal';
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

  const type = event?.event_type as string;
  const res = event?.resource ?? {};
  const payerEmail: string | null = res?.payer?.email_address ?? null;

  try {
    if (type === 'PAYMENT.CAPTURE.COMPLETED') {
      // Funds were actually captured — this is the only event that proves
      // payment, so it's the only one that may flip an order to "paid".
      // The PayPal *order* id (our provider_ref) lives in related_ids.
      const orderRef: string | undefined = res?.supplementary_data?.related_ids?.order_id;
      const txn: string | undefined = res?.id;
      if (orderRef && env.DB) {
        await markPaidAndNotify(env, orderRef, txn ?? null, payerEmail);
      }
    } else if (type === 'CHECKOUT.ORDER.APPROVED') {
      // The buyer approved, but NO money has moved yet. Never mark paid here.
      // This is the backstop for when the browser never reached onApprove:
      // capture the order now, and only mark paid once the capture COMPLETES.
      const orderRef: string | undefined = res?.id;
      if (orderRef) {
        const cap = await capturePayPalOrder(env, orderRef);
        const capture = cap?.purchase_units?.[0]?.payments?.captures?.[0];
        const email: string | null = cap?.payer?.email_address ?? payerEmail;
        if (capture?.status === 'COMPLETED' && env.DB) {
          await markPaidAndNotify(env, orderRef, capture?.id ?? null, email);
        }
      }
    }
  } catch (e: any) {
    // e.g. ORDER_ALREADY_CAPTURED — the sync capture path or a prior webhook
    // already handled it. markPaidByRef is idempotent, so this is safe to drop.
    console.error('[paypal webhook] handling error', e?.message || e);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

/** Mark an order paid by its PayPal order id and send the confirmation email
 *  once (only when this call is the one that flipped it to paid). Idempotent. */
async function markPaidAndNotify(
  env: Env,
  orderRef: string,
  txn: string | null,
  email: string | null
): Promise<void> {
  const order = await markPaidByRef(env.DB, orderRef, txn, email);
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
}
