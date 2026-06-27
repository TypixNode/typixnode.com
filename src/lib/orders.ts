// D1 order persistence. Schema: /migrations/0001_init.sql + 0002_provider_columns.sql.
// Provider-agnostic: provider ('stripe'|'paypal'|'alipay'), provider_ref
// (the provider's order/session id), provider_txn (the transaction/payment id).
import type { ResolvedLine } from './catalog';

export type Provider = 'stripe' | 'paypal' | 'alipay';

export interface OrderInput {
  id: string;
  provider: Provider;
  providerRef?: string | null; // stripe session id / paypal order id / alipay trade no
  providerTxn?: string | null; // payment intent / capture id
  email?: string | null;
  customerName?: string | null;
  amountTotal: number; // cents
  currency: string; // e.g. 'usd'
  status?: string; // pending | paid | fulfilled | canceled
  locale: string;
  items: ResolvedLine[];
  shipping?: unknown;
}

/** Insert a new (pending) order. Idempotent on provider_ref (UNIQUE). */
export async function createOrder(db: D1Database, o: OrderInput): Promise<void> {
  const nowIso = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO orders
        (id, provider, provider_ref, provider_txn, email, customer_name,
         amount_total, currency, status, locale, items, shipping, created_at, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
       ON CONFLICT(provider_ref) DO NOTHING`
    )
    .bind(
      o.id,
      o.provider,
      o.providerRef ?? null,
      o.providerTxn ?? null,
      o.email ?? null,
      o.customerName ?? null,
      o.amountTotal,
      o.currency,
      o.status ?? 'pending',
      o.locale,
      JSON.stringify(o.items),
      o.shipping ? JSON.stringify(o.shipping) : null,
      nowIso
    )
    .run();
}

/**
 * Mark an order paid by its provider_ref. Idempotent: only flips rows not yet
 * paid, so it's safe to call from both the synchronous capture path and an
 * async webhook (whichever lands first wins; the second is a no-op update).
 * Returns the current row (or null).
 */
export async function markPaidByRef(
  db: D1Database,
  providerRef: string,
  providerTxn?: string | null,
  email?: string | null,
  customerName?: string | null,
  shipping?: unknown
): Promise<Record<string, unknown> | null> {
  const paidAt = new Date().toISOString();
  await db
    .prepare(
      `UPDATE orders
         SET status = 'paid',
             paid_at = ?,
             provider_txn = COALESCE(?, provider_txn),
             email = COALESCE(?, email),
             customer_name = COALESCE(?, customer_name),
             shipping = COALESCE(?, shipping)
       WHERE provider_ref = ? AND status != 'paid'`
    )
    .bind(
      paidAt,
      providerTxn ?? null,
      email ?? null,
      customerName ?? null,
      shipping ? JSON.stringify(shipping) : null,
      providerRef
    )
    .run();

  const row = await db
    .prepare(`SELECT * FROM orders WHERE provider_ref = ?`)
    .bind(providerRef)
    .first();
  return (row as Record<string, unknown>) ?? null;
}

export async function getOrderByRef(
  db: D1Database,
  providerRef: string
): Promise<Record<string, unknown> | null> {
  const row = await db
    .prepare(`SELECT * FROM orders WHERE provider_ref = ?`)
    .bind(providerRef)
    .first();
  return (row as Record<string, unknown>) ?? null;
}
