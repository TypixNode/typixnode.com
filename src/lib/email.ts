// Transactional email via Resend (https://resend.com). Pure fetch — Workers-safe.
// If RESEND_API_KEY is missing/empty, all sends are silently skipped so the
// checkout flow still works before email is configured.

interface SendArgs {
  apiKey?: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  /** Optional Reply-To. Customer emails set this to a monitored inbox
   *  (support@…) so replies to a no-reply From still reach a human. */
  replyTo?: string;
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
        ...(args.replyTo ? { reply_to: args.replyTo } : {}),
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

// ---------------------------------------------------------------------------
// Shared branded shell — keeps every email visually consistent with the site's
// teal/emerald aurora palette. `unsubscribeUrl` (when given) renders the legal
// footer required for bulk/marketing mail.
// ---------------------------------------------------------------------------
function shell(opts: { body: string; preheader?: string; unsubscribeUrl?: string }): string {
  const pre = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preheader}</div>`
    : '';
  const foot = opts.unsubscribeUrl
    ? `<p style="color:#9aa8a2;font-size:12px;line-height:1.6;margin:18px 0 0;text-align:center">
         You're receiving this because you subscribed at
         <a href="https://typixnode.com" style="color:#0a8f6e">typixnode.com</a>.<br/>
         <a href="${opts.unsubscribeUrl}" style="color:#9aa8a2;text-decoration:underline">Unsubscribe</a>
         &nbsp;·&nbsp; TypixNode · Compact Open Hardware
       </p>`
    : `<p style="color:#9aa8a2;font-size:12px;margin:18px 0 0;text-align:center">TypixNode · Compact Open Hardware</p>`;
  return `${pre}
  <div style="background:#eef3f1;padding:28px 16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
    <div style="max-width:480px;margin:0 auto">
      <div style="text-align:center;margin-bottom:18px">
        <span style="font-family:Georgia,serif;font-weight:800;font-size:20px;letter-spacing:.02em;color:#0a8f6e">TypixNode</span>
      </div>
      <div style="background:#ffffff;border:1px solid #e2ece8;border-radius:16px;padding:26px 24px;color:#0c1a16">
        ${opts.body}
      </div>
      ${foot}
    </div>
  </div>`;
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#0a8f6e;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 26px;border-radius:999px">${label}</a>`;

/** Double opt-in confirmation email (sent right after someone subscribes). */
export function subscribeConfirmHtml(opts: { confirmUrl: string; name?: string | null }): string {
  const hi = opts.name ? `Hi ${opts.name}, ` : '';
  return shell({
    preheader: 'Confirm your subscription to the TypixNode mailing list.',
    body: `
      <h2 style="margin:0 0 8px;font-size:20px">Confirm your subscription</h2>
      <p style="color:#4a5f58;margin:0 0 18px;font-size:14px">
        ${hi}thanks for your interest in TypixNode. Tap the button below to confirm your
        email and start receiving product news, restock alerts and behind-the-scenes updates.
      </p>
      <div style="text-align:center;margin:22px 0">${btn(opts.confirmUrl, 'Confirm subscription')}</div>
      <p style="color:#9aa8a2;font-size:12px;margin:0">
        If the button doesn't work, copy this link:<br/>
        <a href="${opts.confirmUrl}" style="color:#0a8f6e;word-break:break-all">${opts.confirmUrl}</a>
      </p>
      <p style="color:#9aa8a2;font-size:12px;margin:14px 0 0">
        Didn't request this? You can safely ignore this email — no list is created until you confirm.
      </p>`,
  });
}

/** Welcome email (sent once the subscription is confirmed). */
export function welcomeHtml(opts: { unsubscribeUrl: string; name?: string | null }): string {
  const hi = opts.name ? `${opts.name}, you're` : "You're";
  return shell({
    preheader: "You're on the list — welcome to TypixNode.",
    unsubscribeUrl: opts.unsubscribeUrl,
    body: `
      <h2 style="margin:0 0 8px;font-size:20px">${hi} on the list 🎉</h2>
      <p style="color:#4a5f58;margin:0 0 18px;font-size:14px">
        Welcome aboard. We build compact open hardware in small batches — a CNC-aluminum
        Linux computer, a card-sized keyboard, and a palm-sized Macintosh. You'll be first to
        hear about new products, restocks and open-source drops.
      </p>
      <div style="text-align:center;margin:22px 0">${btn('https://typixnode.com/products', 'Explore products')}</div>`,
  });
}

/** Sent when an ALREADY-subscribed address submits the form again — gives the
 *  owner their unsubscribe link (which we can't safely show on a public page). */
export function alreadySubscribedHtml(opts: { unsubscribeUrl: string; name?: string | null }): string {
  const hi = opts.name ? `Hi ${opts.name}, ` : '';
  return shell({
    preheader: "You're already subscribed to TypixNode.",
    unsubscribeUrl: opts.unsubscribeUrl,
    body: `
      <h2 style="margin:0 0 8px;font-size:20px">You're already subscribed ✅</h2>
      <p style="color:#4a5f58;margin:0 0 18px;font-size:14px">
        ${hi}good news — your email is already on the TypixNode mailing list, so there's
        nothing more to do. If you'd rather not receive our emails, you can unsubscribe below.
      </p>
      <div style="text-align:center;margin:22px 0">${btn(opts.unsubscribeUrl, 'Unsubscribe')}</div>
      <p style="color:#9aa8a2;font-size:12px;margin:0">
        Or copy this link:<br/>
        <a href="${opts.unsubscribeUrl}" style="color:#0a8f6e;word-break:break-all">${opts.unsubscribeUrl}</a>
      </p>`,
  });
}

/** Sent when someone requests an unsubscribe link from the website form. */
export function unsubscribeLinkHtml(opts: { unsubscribeUrl: string; name?: string | null }): string {
  const hi = opts.name ? `Hi ${opts.name}, ` : '';
  return shell({
    preheader: 'Your TypixNode unsubscribe link.',
    unsubscribeUrl: opts.unsubscribeUrl,
    body: `
      <h2 style="margin:0 0 8px;font-size:20px">Unsubscribe from TypixNode</h2>
      <p style="color:#4a5f58;margin:0 0 18px;font-size:14px">
        ${hi}you asked to stop receiving our emails. Click the button below to confirm and
        we'll remove you from the mailing list right away.
      </p>
      <div style="text-align:center;margin:22px 0">${btn(opts.unsubscribeUrl, 'Confirm unsubscribe')}</div>
      <p style="color:#9aa8a2;font-size:12px;margin:0">
        Or copy this link:<br/>
        <a href="${opts.unsubscribeUrl}" style="color:#0a8f6e;word-break:break-all">${opts.unsubscribeUrl}</a>
      </p>
      <p style="color:#9aa8a2;font-size:12px;margin:14px 0 0">
        Didn't request this? You can safely ignore this email — nothing changes unless you click.
      </p>`,
  });
}

/** Admin heads-up when someone joins (or confirms) the mailing list. */
export function adminSubscriberHtml(opts: {
  email: string;
  name?: string | null;
  status: string;
  source?: string | null;
  total?: number;
}): string {
  return shell({
    preheader: `New subscriber: ${opts.email}`,
    body: `
      <h2 style="margin:0 0 8px;font-size:18px">New mailing-list subscriber</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#0c1a16">
        <tr><td style="padding:6px 0;color:#4a5f58">Email</td><td style="padding:6px 0;text-align:right"><b>${opts.email}</b></td></tr>
        ${opts.name ? `<tr><td style="padding:6px 0;color:#4a5f58">Name</td><td style="padding:6px 0;text-align:right">${opts.name}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#4a5f58">Status</td><td style="padding:6px 0;text-align:right">${opts.status}</td></tr>
        ${opts.source ? `<tr><td style="padding:6px 0;color:#4a5f58">Source</td><td style="padding:6px 0;text-align:right">${opts.source}</td></tr>` : ''}
        ${typeof opts.total === 'number' ? `<tr style="border-top:1px solid #eee"><td style="padding:8px 0;color:#4a5f58">Active subscribers</td><td style="padding:8px 0;text-align:right"><b>${opts.total}</b></td></tr>` : ''}
      </table>`,
  });
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
