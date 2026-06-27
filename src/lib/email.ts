// Transactional email via Resend (https://resend.com). Pure fetch — Workers-safe.
// If RESEND_API_KEY is missing/empty, all sends are silently skipped so the
// checkout flow still works before email is configured.

interface SendArgs {
  apiKey?: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(args: SendArgs): Promise<boolean> {
  if (!args.apiKey) {
    console.log('[email] RESEND_API_KEY not set — skipping send to', args.to);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: args.from,
        to: args.to,
        subject: args.subject,
        html: args.html,
      }),
    });
    if (!res.ok) {
      console.error('[email] Resend error', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('[email] send failed', e);
    return false;
  }
}

export function orderConfirmationHtml(opts: {
  orderId: string;
  items: Array<{ name: string; qty: number; unitPriceUsd: number }>;
  amountTotal: number; // cents
  currency: string;
}): string {
  const rows = opts.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.name} × ${i.qty}</td>` +
        `<td style="padding:6px 0;text-align:right">$${i.unitPriceUsd * i.qty}</td></tr>`
    )
    .join('');
  const total = (opts.amountTotal / 100).toFixed(2);
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#111">
    <h2 style="margin:0 0 4px">Thanks for your order 🎉</h2>
    <p style="color:#666;margin:0 0 16px">Order <b>${opts.orderId}</b> is confirmed.</p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee">
      ${rows}
      <tr style="border-top:1px solid #eee">
        <td style="padding:8px 0"><b>Total</b></td>
        <td style="padding:8px 0;text-align:right"><b>${opts.currency.toUpperCase()} $${total}</b></td>
      </tr>
    </table>
    <div style="margin-top:16px;padding:12px 14px;background:#f4f8f6;border:1px solid #e2ece8;border-radius:10px;color:#2c443c;font-size:13px">
      <b>This is a pre-order.</b> Every TypixNode device is milled and assembled in small batches.
      Estimated dispatch is <b>2 weeks – 2 months</b> from your order. We'll email you tracking the
      moment it ships, and you can request a <b>full refund any time before it ships</b>.
    </div>
    <p style="color:#666;font-size:13px;margin-top:14px">
      Track your order at <a href="https://typixnode.com/orders" style="color:#0a8f6e">typixnode.com/orders</a>.
      Questions? Email <a href="mailto:support@typixnode.com" style="color:#0a8f6e">support@typixnode.com</a>. — TypixNode
    </p>
  </div>`;
}
