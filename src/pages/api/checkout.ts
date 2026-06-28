// POST /api/checkout — create a Stripe Checkout Session for the cart.
// Body: { items: [{id, qty}], locale?: 'en'|'zh'|'ja' }
// Returns: { url } to redirect the browser to Stripe's hosted checkout.
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { resolveCartDb, subtotalCents, newOrderId, type Locale } from '../../lib/catalog';
import { createOrder } from '../../lib/orders';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env as Env;
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  if (!env?.STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe not configured (STRIPE_SECRET_KEY missing).' }, 500);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const locale: Locale = ['en', 'zh', 'ja'].includes(body?.locale) ? body.locale : 'en';
  const lines = await resolveCartDb(env.DB, body?.items, locale);
  if (lines.length === 0) {
    return json({ error: 'Cart is empty or contains no valid items.' }, 400);
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: '2025-02-24.acacia' as any,
  });

  const origin = env.PUBLIC_SITE_URL || new URL(request.url).origin;
  const orderId = newOrderId();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lines.map((l) => ({
        quantity: l.qty,
        price_data: {
          currency: 'usd',
          unit_amount: l.unitAmount,
          product_data: {
            name: l.name,
            images: [`${origin}${PRODUCT_IMG(l.id)}`].filter(Boolean) as string[],
          },
        },
      })),
      // Collect shipping address worldwide; free shipping rate.
      shipping_address_collection: { allowed_countries: ALLOWED_COUNTRIES },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Free worldwide shipping',
          },
        },
      ],
      phone_number_collection: { enabled: true },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      client_reference_id: orderId,
      metadata: { orderId, locale },
    });

    // Persist a pending order keyed by the Stripe session id.
    if (env.DB) {
      await createOrder(env.DB, {
        id: orderId,
        provider: 'stripe',
        providerRef: session.id,
        amountTotal: subtotalCents(lines),
        currency: 'usd',
        status: 'pending',
        locale,
        items: lines,
      });
    }

    return json({ url: session.url });
  } catch (e: any) {
    console.error('[checkout] stripe error', e?.message || e);
    return json({ error: 'Failed to create checkout session.' }, 500);
  }
};

// --- helpers kept at bottom to keep the handler readable ---
import { PRODUCTS } from '../../lib/catalog';
function PRODUCT_IMG(id: string): string {
  return PRODUCTS[id]?.img ?? '';
}

// Stripe wants an explicit allowed-country list; this is the full worldwide set.
const ALLOWED_COUNTRIES = [
  'AC','AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CV','CW','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MK','ML','MM','MN','MO','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SZ','TA','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','US','UY','UZ','VA','VC','VE','VG','VN','VU','WF','WS','XK','YE','YT','ZA','ZM','ZW',
] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];
