// POST /api/custom-order  { email, requirements, options?: {compute,storage}, lang? }
// A custom-build enquiry from the TypixDeck configurator's "Custom / other"
// option. Emails support (Reply-To = customer) and sends the customer an
// acknowledgement. Never trusts client prices — this is a quote request, not
// a checkout. Always returns a friendly result.
import type { APIRoute } from 'astro';
import { isValidEmail, normalizeEmail, logEmail } from '../../lib/subscribers';
import { sendEmail, customOrderAdminHtml, customOrderAckHtml } from '../../lib/email';
import { loadOptions, type Locale } from '../../lib/catalog';

export const prerender = false;

const SUPPORT = 'support@typixnode.com';

/** Catalog labels only ship en/zh/ja; map the 10 UI langs onto those. */
function toLocale(lang: string): Locale {
  if (lang === 'zh' || lang === 'zh-Hant') return 'zh';
  if (lang === 'ja') return 'ja';
  return 'en';
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env as Env;
  const lang = String((locals as any).lang ?? 'en');
  const json = (d: unknown, s = 200) =>
    new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, status: 'invalid', message: 'Invalid request.' }, 400);
  }

  const email = normalizeEmail(String(body?.email || ''));
  const requirements = String(body?.requirements || '').trim().slice(0, 4000);
  if (!isValidEmail(email)) {
    return json({ ok: false, status: 'invalid', message: 'Please enter a valid email address.' }, 400);
  }

  // Resolve the chosen configuration into human labels (server-side, so the
  // email is trustworthy and localized regardless of what the client sent).
  const reqLang = String(body?.lang || lang || 'en');
  const locale = toLocale(reqLang);
  const config: Array<{ group: string; value: string }> = [];
  try {
    const options = await loadOptions(env?.DB);
    const groups = options['typixdeck'] || {};
    const chosen = (body?.options && typeof body.options === 'object' ? body.options : {}) as Record<string, string>;
    for (const gk of Object.keys(groups)) {
      const g = groups[gk];
      const vk = g.values[chosen[gk]] ? chosen[gk] : g.default;
      const v = g.values[vk];
      if (!v) continue;
      config.push({ group: g.label[locale] ?? g.label.en, value: v.label[locale] ?? v.label.en });
    }
  } catch {
    /* best-effort: fall through with whatever config we gathered */
  }

  const from = env?.FROM_EMAIL || 'TypixNode <onboarding@resend.dev>';
  const supportTo = env?.ADMIN_EMAIL || SUPPORT;

  try {
    // 1) Notify support, Reply-To the customer so a reply reaches them directly.
    const adminSubject = `Custom TypixDeck enquiry — ${email}`;
    const adminSent = await sendEmail({
      apiKey: env?.RESEND_API_KEY,
      from,
      to: supportTo,
      replyTo: email,
      subject: adminSubject,
      html: customOrderAdminHtml({ email, requirements, config, lang: reqLang }),
    });
    if (env?.DB) await logEmail(env.DB, 'custom_order_admin', supportTo, adminSubject, adminSent ? 'sent' : 'skipped');

    // 2) Acknowledge the customer, Reply-To support so they can follow up.
    const ackSubject = "We've received your custom TypixDeck request";
    const ackSent = await sendEmail({
      apiKey: env?.RESEND_API_KEY,
      from,
      to: email,
      replyTo: SUPPORT,
      subject: ackSubject,
      html: customOrderAckHtml({ requirements, config }),
    });
    if (env?.DB) await logEmail(env.DB, 'custom_order_ack', email, ackSubject, ackSent ? 'sent' : 'skipped');

    return json({ ok: true, status: 'sent', message: "Thanks — we've received your request and will reply by email." });
  } catch (e: any) {
    console.error('[custom-order] error', e?.message || e);
    return json({ ok: false, status: 'error', message: 'Something went wrong. Please try again.' }, 500);
  }
};
