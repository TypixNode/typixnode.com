// POST /api/subscribe  { email, name?, lang? }
// Adds an email to the newsletter (double opt-in): creates a `pending` row and
// sends a confirmation email. Also fires a best-effort admin notification.
// Always returns a friendly result; never leaks whether an email already exists
// beyond the coarse `status` (privacy + anti-enumeration).
import type { APIRoute } from 'astro';
import { upsertSubscriber, isValidEmail, normalizeEmail, logEmail } from '../../lib/subscribers';
import { sendEmail, subscribeConfirmHtml, adminSubscriberHtml } from '../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env as Env;
  const lang = (locals as any).lang ?? 'en';
  const json = (d: unknown, s = 200) =>
    new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  if (!env?.DB) return json({ ok: false, status: 'error', message: 'Subscriptions are unavailable right now.' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, status: 'invalid', message: 'Invalid request.' }, 400);
  }

  const email = normalizeEmail(String(body?.email || ''));
  const name = String(body?.name || '').trim().slice(0, 120) || null;
  if (!isValidEmail(email)) {
    return json({ ok: false, status: 'invalid', message: 'Please enter a valid email address.' }, 400);
  }

  const ip = request.headers.get('cf-connecting-ip');
  const ua = request.headers.get('user-agent');
  const from = env.FROM_EMAIL || 'TypixNode <onboarding@resend.dev>';
  const site = env.PUBLIC_SITE_URL || 'https://typixnode.com';

  try {
    const result = await upsertSubscriber(env.DB, {
      email,
      name,
      lang: String(body?.lang || lang || 'en'),
      source: String(body?.source || 'footer'),
      ip,
      userAgent: ua,
    });

    if (result.kind === 'already_active') {
      return json({ ok: true, status: 'already', message: "You're already subscribed — thanks!" });
    }

    // Send the double opt-in confirmation email.
    const sub = result.subscriber;
    const confirmUrl = `${site}/subscribe/confirm?token=${sub.token}`;
    const subject = 'Confirm your TypixNode subscription';
    const sent = await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from,
      to: sub.email,
      subject,
      html: subscribeConfirmHtml({ confirmUrl, name: sub.name }),
    });
    await logEmail(env.DB, 'subscribe_confirm', sub.email, subject, sent ? 'sent' : 'skipped');

    // Admin heads-up (best-effort — never blocks the user).
    if (env.ADMIN_EMAIL) {
      const adminSubject = `New subscriber — ${sub.email}`;
      const adminSent = await sendEmail({
        apiKey: env.RESEND_API_KEY,
        from,
        to: env.ADMIN_EMAIL,
        subject: adminSubject,
        html: adminSubscriberHtml({ email: sub.email, name: sub.name, status: 'pending', source: sub.source }),
      });
      await logEmail(env.DB, 'admin_subscribe', env.ADMIN_EMAIL, adminSubject, adminSent ? 'sent' : 'skipped');
    }

    return json({
      ok: true,
      status: 'pending',
      message: "Almost there — check your inbox to confirm your subscription.",
    });
  } catch (e: any) {
    console.error('[subscribe] error', e?.message || e);
    return json({ ok: false, status: 'error', message: 'Something went wrong. Please try again.' }, 500);
  }
};
