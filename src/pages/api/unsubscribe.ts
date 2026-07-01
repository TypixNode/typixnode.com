// POST /api/unsubscribe  { email }
// Website "unsubscribe" entry point. We never unsubscribe by email alone (the
// token is a capability secret and anyone could unsubscribe anyone), so instead
// we email the owner their unsubscribe link. Response is always generic
// (anti-enumeration): it never reveals whether the email is on the list.
import type { APIRoute } from 'astro';
import { getByEmail, isValidEmail, normalizeEmail, logEmail } from '../../lib/subscribers';
import { sendEmail, unsubscribeLinkHtml } from '../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env as Env;
  const json = (d: unknown, s = 200) =>
    new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  if (!env?.DB) return json({ ok: false, status: 'error', message: 'Unavailable right now.' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, status: 'invalid', message: 'Invalid request.' }, 400);
  }

  const email = normalizeEmail(String(body?.email || ''));
  if (!isValidEmail(email)) {
    return json({ ok: false, status: 'invalid', message: 'Please enter a valid email address.' }, 400);
  }

  const site = env.PUBLIC_SITE_URL || 'https://typixnode.com';
  const from = env.FROM_EMAIL || 'TypixNode <onboarding@resend.dev>';

  try {
    const sub = await getByEmail(env.DB, email);
    // Only email a link if the address exists and isn't already unsubscribed.
    if (sub && sub.status !== 'unsubscribed') {
      const unsubUrl = `${site}/unsubscribe?token=${sub.token}`;
      const subject = 'Your TypixNode unsubscribe link';
      const sent = await sendEmail({
        apiKey: env.RESEND_API_KEY,
        from,
        to: sub.email,
        replyTo: 'support@typixnode.com',
        subject,
        html: unsubscribeLinkHtml({ unsubscribeUrl: unsubUrl, name: sub.name }),
      });
      await logEmail(env.DB, 'unsubscribe_link', sub.email, subject, sent ? 'sent' : 'skipped');
    }
    // Always the same generic response.
    return json({
      ok: true,
      status: 'sent',
      message: "If that email is subscribed, we've sent an unsubscribe link. Check your inbox.",
    });
  } catch (e: any) {
    console.error('[unsubscribe] error', e?.message || e);
    return json({ ok: false, status: 'error', message: 'Something went wrong. Please try again.' }, 500);
  }
};
