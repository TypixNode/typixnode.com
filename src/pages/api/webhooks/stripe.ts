// POST /api/webhooks/stripe — Stripe webhook receiver.
// Verifies the signature, and on `checkout.session.completed` marks the order
// paid in D1 and sends a confirmation email (if Resend is configured).
// Future payment providers get sibling routes: /api/webhooks/paypal, etc.
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { markPaidByRef } from '../../../lib/orders';
import { sendEmail, orderConfirmationHtml } from '../../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env as Env;
  if (!env?.STRIPE_SECRET_KEY || !env?.STRIPE_WEBHOOK_SECRET) {
    return new Response('Stripe webhook not configured', { status: 500 });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: '2025-02-24.acacia' as any,
  });

  const sig = request.headers.get('stripe-signature') || '';
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    // Workers needs the async variant (no synchronous crypto).
    event = await stripe.webhooks.constructEventAsync(
      payload,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (e: any) {
    console.error('[webhook] signature verification failed', e?.message);
    return new Response(`Webhook signature verification failed`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      const order = env.DB
        ? await markPaidByRef(
            env.DB,
            session.id,
            (session.payment_intent as string) ?? null,
            session.customer_details?.email ?? null,
            session.customer_details?.name ?? null,
            session.shipping_details ?? session.customer_details?.address ?? null
          )
        : null;

      // Confirmation email (best-effort).
      const email = session.customer_details?.email;
      if (email && order) {
        let items: Array<{ name: string; qty: number; unitPriceUsd: number }> = [];
        try {
          items = JSON.parse(String(order.items)).map((l: any) => ({
            name: l.name,
            qty: l.qty,
            unitPriceUsd: l.unitPriceUsd,
          }));
        } catch {}
        await sendEmail({
          apiKey: env.RESEND_API_KEY,
          from: env.FROM_EMAIL || 'TypixNode <onboarding@resend.dev>',
          to: email,
          replyTo: 'support@typixnode.com',
          subject: `Your TypixNode order ${order.id}`,
          html: orderConfirmationHtml({
            orderId: String(order.id),
            items,
            amountTotal: Number(order.amount_total),
            currency: String(order.currency),
          }),
        });
        // Admin notification (best-effort).
        if (env.ADMIN_EMAIL) {
          await sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.FROM_EMAIL || 'TypixNode <onboarding@resend.dev>',
            to: env.ADMIN_EMAIL,
            subject: `New order ${order.id} — ${email}`,
            html: orderConfirmationHtml({
              orderId: String(order.id),
              items,
              amountTotal: Number(order.amount_total),
              currency: String(order.currency),
            }),
          });
        }
      }
    } catch (e: any) {
      console.error('[webhook] handling error', e?.message || e);
      // Still return 200 so Stripe doesn't retry forever on our DB hiccups;
      // payment itself succeeded.
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
