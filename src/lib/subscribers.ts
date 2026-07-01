// Newsletter subscriber persistence (Cloudflare D1).
// Schema: /migrations/0008_subscribers.sql. Double opt-in: subscribe -> pending,
// confirm -> active, unsubscribe -> unsubscribed. A single unguessable `token`
// is the capability secret for BOTH the confirm and unsubscribe links.

export type SubStatus = 'pending' | 'active' | 'unsubscribed' | 'bounced';

export interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  lang: string;
  status: SubStatus;
  token: string;
  source: string | null;
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
}

function newId(prefix: string): string {
  return prefix + '_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
}

/** 256-bit unguessable capability token (confirm + unsubscribe links). */
function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

/** RFC-5322-lite email check — good enough to reject obvious garbage. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type SubscribeResult =
  | { kind: 'created'; subscriber: Subscriber }        // brand new -> send confirm
  | { kind: 'reconfirm'; subscriber: Subscriber }      // existed but pending/unsub -> resend confirm
  | { kind: 'already_active'; subscriber: Subscriber }; // nothing to do

/**
 * Upsert a subscriber for the given email.
 * - New email            -> row created (pending), returns 'created'.
 * - Already active        -> returns 'already_active' (idempotent, no email).
 * - Pending/unsubscribed  -> reset to pending with a FRESH token, returns
 *                            'reconfirm' (re-opt-in flow; a stale unsubscribe
 *                            link can't be used to silently re-activate).
 */
export async function upsertSubscriber(
  db: D1Database,
  opts: { email: string; name?: string | null; lang?: string; source?: string | null; ip?: string | null; userAgent?: string | null }
): Promise<SubscribeResult> {
  const email = normalizeEmail(opts.email);
  const nowIso = new Date().toISOString();

  const existing = (await db
    .prepare(`SELECT * FROM subscribers WHERE email = ?`)
    .bind(email)
    .first()) as Subscriber | null;

  if (existing && existing.status === 'active') {
    return { kind: 'already_active', subscriber: existing };
  }

  if (existing) {
    const token = newToken();
    await db
      .prepare(
        `UPDATE subscribers
           SET status = 'pending', token = ?, name = COALESCE(?, name),
               lang = ?, source = COALESCE(?, source), unsubscribed_at = NULL
         WHERE id = ?`
      )
      .bind(token, opts.name ?? null, opts.lang ?? existing.lang ?? 'en', opts.source ?? null, existing.id)
      .run();
    return { kind: 'reconfirm', subscriber: { ...existing, status: 'pending', token, name: opts.name ?? existing.name } };
  }

  const sub: Subscriber = {
    id: newId('sub'),
    email,
    name: opts.name ?? null,
    lang: opts.lang ?? 'en',
    status: 'pending',
    token: newToken(),
    source: opts.source ?? null,
    created_at: nowIso,
    confirmed_at: null,
    unsubscribed_at: null,
  };
  await db
    .prepare(
      `INSERT INTO subscribers
         (id, email, name, lang, status, token, source, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`
    )
    .bind(sub.id, sub.email, sub.name, sub.lang, sub.token, sub.source, opts.ip ?? null, opts.userAgent ?? null, nowIso)
    .run();
  return { kind: 'created', subscriber: sub };
}

export async function getByToken(db: D1Database, token: string): Promise<Subscriber | null> {
  if (!token) return null;
  return (await db
    .prepare(`SELECT * FROM subscribers WHERE token = ?`)
    .bind(token)
    .first()) as Subscriber | null;
}

/** Confirm (double opt-in) by token. Idempotent. Returns the subscriber or null. */
export async function confirmByToken(db: D1Database, token: string): Promise<Subscriber | null> {
  const sub = await getByToken(db, token);
  if (!sub) return null;
  if (sub.status === 'active') return sub;
  const nowIso = new Date().toISOString();
  await db
    .prepare(`UPDATE subscribers SET status = 'active', confirmed_at = ? WHERE id = ?`)
    .bind(nowIso, sub.id)
    .run();
  return { ...sub, status: 'active', confirmed_at: nowIso };
}

/** Unsubscribe by token. Idempotent. Returns the subscriber or null. */
export async function unsubscribeByToken(db: D1Database, token: string): Promise<Subscriber | null> {
  const sub = await getByToken(db, token);
  if (!sub) return null;
  if (sub.status === 'unsubscribed') return sub;
  const nowIso = new Date().toISOString();
  await db
    .prepare(`UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE id = ?`)
    .bind(nowIso, sub.id)
    .run();
  return { ...sub, status: 'unsubscribed', unsubscribed_at: nowIso };
}

export async function countActive(db: D1Database): Promise<number> {
  const row = (await db
    .prepare(`SELECT COUNT(*) AS n FROM subscribers WHERE status = 'active'`)
    .first()) as { n: number } | null;
  return row?.n ?? 0;
}

/** Best-effort audit-log write. Never throws (logging must not break a request). */
export async function logEmail(
  db: D1Database | undefined,
  kind: string,
  toEmail: string,
  subject: string,
  status: 'sent' | 'skipped' | 'failed',
  error?: string
): Promise<void> {
  if (!db) return;
  try {
    await db
      .prepare(
        `INSERT INTO email_log (id, kind, to_email, subject, status, error, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(newId('eml'), kind, toEmail, subject, status, error ?? null, new Date().toISOString())
      .run();
  } catch (e) {
    console.error('[subscribers] email_log write failed', e);
  }
}
