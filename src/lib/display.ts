// Presentation helpers shared by /orders and /success.
// Pre-sale ETA is centralized here so every surface stays consistent.

export type Locale = 'en' | 'zh' | 'ja';

/** Pre-sale lead time, shown everywhere a product/order is displayed. */
export const PRESALE_ETA: Record<Locale, string> = {
  en: 'ships in 2 weeks – 2 months',
  zh: '预计 2 周 – 2 个月内发货',
  ja: '発送まで 2週間〜2か月',
};

export const SUPPORT_EMAIL = 'support@typixnode.com';

/** The order lifecycle we display. `status` is payment state; `shipping_status`
 *  is fulfillment. We collapse them into one timeline for the UI. */
export type Step = 'placed' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'canceled';

export function currentStep(order: { status?: unknown; shipping_status?: unknown }): Step {
  const s = String(order.status ?? '').toLowerCase();
  const ship = String(order.shipping_status ?? '').toLowerCase();
  if (s === 'canceled' || s === 'cancelled' || s === 'refunded') return 'canceled';
  if (ship === 'delivered') return 'delivered';
  if (ship === 'shipped') return 'shipped';
  if (s === 'paid' || s === 'fulfilled') return ship === 'preparing' ? 'preparing' : 'paid';
  return 'placed';
}

/** i18n key for a step label (resolved client-side by site.js). */
export function stepKey(step: Step): string {
  return 'order.step.' + step;
}

export function fmtMoney(cents: number, currency: string): string {
  const n = (Number(cents) || 0) / 100;
  return `${currency.toUpperCase()} $${n.toFixed(2)}`;
}

export function fmtDate(iso: unknown): string {
  if (!iso) return '';
  const d = new Date(String(iso));
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export interface OrderItem { name: string; qty: number; unitPriceUsd: number }
export function parseItems(itemsJson: unknown): OrderItem[] {
  try {
    const arr = JSON.parse(String(itemsJson));
    if (!Array.isArray(arr)) return [];
    return arr.map((l: any) => ({ name: String(l.name ?? ''), qty: Number(l.qty ?? 1), unitPriceUsd: Number(l.unitPriceUsd ?? 0) }));
  } catch {
    return [];
  }
}
