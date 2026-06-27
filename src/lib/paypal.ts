// PayPal REST API (Orders v2) via pure fetch — Workers-safe, no SDK.
// Sandbox vs live is chosen by PAYPAL_ENV ('sandbox' | 'live').

function apiBase(env: Env): string {
  return (env.PAYPAL_ENV || 'sandbox') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export function paypalConfigured(env: Env): boolean {
  return Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_SECRET);
}

async function accessToken(env: Env): Promise<string> {
  const creds = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`);
  const res = await fetch(`${apiBase(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`paypal token ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface PayPalOrderItem {
  name: string;
  qty: number;
  unitAmount: number; // cents
}

/** Create a PayPal order; returns { id }. amountCents = full total. */
export async function createPayPalOrder(
  env: Env,
  amountCents: number,
  items: PayPalOrderItem[],
  referenceId: string
): Promise<{ id: string }> {
  const token = await accessToken(env);
  const value = (amountCents / 100).toFixed(2);
  const itemTotal = (
    items.reduce((n, i) => n + i.unitAmount * i.qty, 0) / 100
  ).toFixed(2);

  const res = await fetch(`${apiBase(env)}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: referenceId,
          amount: {
            currency_code: 'USD',
            value,
            breakdown: {
              item_total: { currency_code: 'USD', value: itemTotal },
              shipping: { currency_code: 'USD', value: '0.00' },
            },
          },
          items: items.map((i) => ({
            name: i.name.slice(0, 127),
            quantity: String(i.qty),
            unit_amount: { currency_code: 'USD', value: (i.unitAmount / 100).toFixed(2) },
          })),
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`paypal create ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return { id: data.id };
}

/**
 * Verify a PayPal webhook signature via PayPal's verify-webhook-signature API.
 * Returns true only when PayPal confirms the event is authentic. Requires
 * PAYPAL_WEBHOOK_ID (from the webhook you registered in the PayPal dashboard).
 */
export async function verifyWebhookSignature(
  env: Env,
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  if (!env.PAYPAL_WEBHOOK_ID) return false;
  const token = await accessToken(env);
  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return false;
  }
  const res = await fetch(`${apiBase(env)}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: env.PAYPAL_WEBHOOK_ID,
      webhook_event: event,
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === 'SUCCESS';
}

/** Capture an approved PayPal order. Returns the capture result. */
export async function capturePayPalOrder(env: Env, orderId: string): Promise<any> {
  const token = await accessToken(env);
  const res = await fetch(`${apiBase(env)}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`paypal capture ${res.status}: ${JSON.stringify(data)}`);
  return data;
}
