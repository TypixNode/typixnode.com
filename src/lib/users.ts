// Account + order-ownership logic on top of D1.
// See migrations/0004 for the schema and the email-mismatch design rationale.
//
// Identity = users + oauth_accounts (provider-agnostic) + user_emails (the
// orders<->users join key). Adding Google/Apple later only means calling
// upsertOAuthUser with a different `provider` — no schema or query changes.

export interface DbUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
  primary_email: string | null;
}

/** Normalized result of any OAuth provider's profile fetch. */
export interface OAuthIdentity {
  provider: 'github' | 'google' | 'apple';
  providerUserId: string;
  username: string | null;
  /** Provider account email (informational — NOT used as the orders join key). */
  providerEmail: string | null;
  name: string | null;
  avatarUrl: string | null;
  /** All VERIFIED emails the provider asserts for this user. */
  verifiedEmails: string[];
}

function newId(prefix: string): string {
  return prefix + '_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
}
const norm = (e: string) => e.trim().toLowerCase();

/**
 * Find-or-create the account for an OAuth identity, record the provider link,
 * store the provider's verified emails, then auto-link matching orders.
 */
export async function upsertOAuthUser(db: D1Database, idn: OAuthIdentity): Promise<DbUser> {
  const now = new Date().toISOString();

  const account = (await db
    .prepare('SELECT id, user_id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?')
    .bind(idn.provider, idn.providerUserId)
    .first()) as { id: string; user_id: string } | null;

  let userId: string;
  if (account) {
    userId = account.user_id;
    await db
      .prepare(
        `UPDATE users SET name=COALESCE(?,name), avatar_url=COALESCE(?,avatar_url),
           primary_email=COALESCE(?,primary_email), last_login_at=? WHERE id=?`
      )
      .bind(idn.name, idn.avatarUrl, idn.providerEmail, now, userId)
      .run();
    await db
      .prepare(
        `UPDATE oauth_accounts SET provider_username=?, provider_email=?, updated_at=? WHERE id=?`
      )
      .bind(idn.username, idn.providerEmail, now, account.id)
      .run();
  } else {
    userId = newId('usr');
    await db
      .prepare(
        `INSERT INTO users (id, name, avatar_url, primary_email, email_verified, created_at, last_login_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(userId, idn.name, idn.avatarUrl, idn.providerEmail, idn.providerEmail ? 1 : 0, now, now)
      .run();
    await db
      .prepare(
        `INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, provider_username, provider_email, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(newId('oac'), userId, idn.provider, idn.providerUserId, idn.username, idn.providerEmail, now, now)
      .run();
  }

  // Record provider-verified emails (idempotent). Email PK => an address owned
  // by ANOTHER account is left alone (never steal an email).
  for (const raw of idn.verifiedEmails) {
    const email = norm(raw);
    if (!email) continue;
    await db
      .prepare(
        `INSERT INTO user_emails (email, user_id, verified, source, created_at)
         VALUES (?, ?, 1, ?, ?)
         ON CONFLICT(email) DO UPDATE SET verified=1
           WHERE user_emails.user_id = excluded.user_id`
      )
      .bind(email, userId, 'oauth:' + idn.provider, now)
      .run();
  }

  await autoLinkOrders(db, userId);
  return { id: userId, name: idn.name, avatar_url: idn.avatarUrl, primary_email: idn.providerEmail };
}

/** Link unclaimed orders whose email is one of the user's VERIFIED emails. */
export async function autoLinkOrders(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare(
      `UPDATE orders SET user_id = ?
       WHERE user_id IS NULL
         AND lower(email) IN (SELECT email FROM user_emails WHERE user_id = ? AND verified = 1)`
    )
    .bind(userId, userId)
    .run();
}

export async function getUserById(db: D1Database, id: string): Promise<DbUser | null> {
  return (await db
    .prepare('SELECT id, name, avatar_url, primary_email FROM users WHERE id = ?')
    .bind(id)
    .first()) as DbUser | null;
}

/** All orders for a user: linked by user_id OR matching a verified email. */
export async function listOrdersForUser(db: D1Database, userId: string): Promise<Record<string, unknown>[]> {
  const res = await db
    .prepare(
      `SELECT * FROM orders
       WHERE user_id = ?
          OR lower(email) IN (SELECT email FROM user_emails WHERE user_id = ? AND verified = 1)
       ORDER BY created_at DESC`
    )
    .bind(userId, userId)
    .all();
  return (res.results as Record<string, unknown>[]) ?? [];
}

/** Read one order by id, only if the email matches (proof for no-login lookup). */
export async function getOrderByIdEmail(
  db: D1Database,
  orderId: string,
  email: string
): Promise<Record<string, unknown> | null> {
  const row = await db
    .prepare('SELECT * FROM orders WHERE id = ? AND lower(email) = ?')
    .bind(orderId, norm(email))
    .first();
  return (row as Record<string, unknown>) ?? null;
}

/** Attach an order to a user after ownership is proven (id + matching email),
 *  and remember the checkout email so future orders to it auto-link. */
export async function claimOrder(
  db: D1Database,
  userId: string,
  orderId: string,
  email: string
): Promise<boolean> {
  const order = await getOrderByIdEmail(db, orderId, email);
  if (!order) return false;
  await db.prepare('UPDATE orders SET user_id = ? WHERE id = ?').bind(userId, orderId).run();
  await rememberEmail(db, userId, email, 'order');
  return true;
}

/** Bind a just-placed order to an account using only the order id, used by the
 *  success page and the post-checkout "save to my account" flow.
 *
 *  Hardened against IDOR (audit HIGH): the order id is a bearer token that
 *  leaks into URLs/emails, so it is NOT sufficient proof to take over an order
 *  that already belongs to someone. We therefore:
 *    - only bind an order that is still UNCLAIMED (user_id IS NULL), enforced
 *      atomically in the UPDATE so a known order id can never re-home an
 *      order away from its existing owner; and
 *    - do NOT mark the order's checkout email as a verified account email
 *      (that was the cross-account escalation: a verified email auto-links all
 *      of a victim's other orders). Emails become verified only via OAuth
 *      (provider-verified) or the id+email-proven claimOrder path.
 *  Returns true only if THIS call actually bound a previously-unclaimed order. */
export async function bindOrderById(db: D1Database, userId: string, orderId: string): Promise<boolean> {
  const res = await db
    .prepare('UPDATE orders SET user_id = ? WHERE id = ? AND user_id IS NULL')
    .bind(userId, orderId)
    .run();
  return ((res as any)?.meta?.changes ?? 0) > 0;
}

async function rememberEmail(db: D1Database, userId: string, email: string, source: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO user_emails (email, user_id, verified, source, created_at)
       VALUES (?, ?, 1, ?, ?)
       ON CONFLICT(email) DO NOTHING`
    )
    .bind(norm(email), userId, source, new Date().toISOString())
    .run();
}
