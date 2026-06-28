// Stateless, signed-cookie auth helpers (Workers-safe — Web Crypto only).
//
// Sessions and OAuth `state` are HMAC-signed tokens of the form
// `<base64url(payload)>.<base64url(hmac)>`. No server-side session store is
// needed; the signature is the proof. Keep payloads tiny.

import type { AstroCookies } from 'astro';

const SESSION_COOKIE = 'tnx_sess';
const STATE_COOKIE = 'tnx_oauth_state';
const SESSION_TTL_S = 60 * 60 * 24 * 30; // 30 days
const STATE_TTL_S = 60 * 10; // 10 minutes

/** HMAC key for session + OAuth-state cookies.
 *
 *  FAIL CLOSED: a dedicated SESSION_SECRET is REQUIRED. We never fall back to a
 *  payment secret (different rotation lifecycle + blast radius — reusing it
 *  would turn a leaked payment key into a session-forgery key) nor to any
 *  hard-coded default (a committed constant is publicly known → trivial
 *  account forgery). If SESSION_SECRET is missing/too weak we throw, so signing
 *  refuses to run and verification treats every token as invalid (logged-out)
 *  rather than silently signing with a guessable key.
 *
 *  Set it per environment with:  wrangler secret put SESSION_SECRET
 *  (e.g. `openssl rand -base64 32`). Locally, put it in .dev.vars. */
function signingKey(env: Env): string {
  const k = env.SESSION_SECRET;
  if (!k || k.length < 16) {
    throw new Error('SESSION_SECRET is not configured (or too weak); refusing to sign/verify sessions.');
  }
  return k;
}

/** True when accounts can operate: GitHub OAuth app + a real SESSION_SECRET. */
function sessionsEnabled(env: Env): boolean {
  return !!(env.SESSION_SECRET && env.SESSION_SECRET.length >= 16);
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
  const b = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

async function hmac(key: string, data: string): Promise<Uint8Array> {
  const ck = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', ck, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Sign an arbitrary JSON payload (with an embedded expiry). */
export async function signToken(env: Env, payload: Record<string, unknown>, ttlSeconds: number): Promise<string> {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const p = b64urlEncode(new TextEncoder().encode(JSON.stringify(body)));
  const sig = b64urlEncode(await hmac(signingKey(env), p));
  return `${p}.${sig}`;
}

/** Verify + parse a signed token. Returns the payload or null on ANY problem
 *  (no/weak key, malformed token, bad signature, expired, bad base64/JSON).
 *  Never throws — a missing SESSION_SECRET simply means "no valid sessions". */
export async function verifyToken<T = Record<string, unknown>>(env: Env, token: string | undefined | null): Promise<T | null> {
  if (!token || token.indexOf('.') < 0) return null;
  const [p, sig] = token.split('.');
  if (!p || !sig) return null;
  try {
    const expected = await hmac(signingKey(env), p); // throws if SESSION_SECRET missing
    // b64urlDecode(sig) is attacker-controlled — keep it inside the try so a
    // malformed signature returns null instead of throwing (no 500/DoS).
    if (!timingSafeEqual(b64urlDecode(sig), expected)) return null;
    const obj = JSON.parse(new TextDecoder().decode(b64urlDecode(p)));
    if (typeof obj.exp === 'number' && obj.exp < Math.floor(Date.now() / 1000)) return null;
    return obj as T;
  } catch {
    return null;
  }
}

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
});

export async function setSession(env: Env, cookies: AstroCookies, userId: string): Promise<void> {
  const token = await signToken(env, { uid: userId }, SESSION_TTL_S);
  cookies.set(SESSION_COOKIE, token, cookieOpts(SESSION_TTL_S));
}

export function clearSession(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

/** Returns the logged-in user's id (verified) or null. */
export async function getSessionUserId(env: Env, cookies: AstroCookies): Promise<string | null> {
  const tok = cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifyToken<{ uid: string }>(env, tok);
  return payload?.uid ?? null;
}

export async function setOAuthState(env: Env, cookies: AstroCookies, data: Record<string, unknown>): Promise<string> {
  const nonce = b64urlEncode(crypto.getRandomValues(new Uint8Array(16)));
  const token = await signToken(env, { ...data, nonce }, STATE_TTL_S);
  cookies.set(STATE_COOKIE, token, cookieOpts(STATE_TTL_S));
  return token;
}

export async function readOAuthState<T = Record<string, unknown>>(env: Env, cookies: AstroCookies): Promise<T | null> {
  const tok = cookies.get(STATE_COOKIE)?.value;
  return verifyToken<T>(env, tok);
}

export function clearOAuthState(cookies: AstroCookies): void {
  cookies.delete(STATE_COOKIE, { path: '/' });
}

/** Accounts/login are only offered when GitHub OAuth AND a real SESSION_SECRET
 *  are configured. Without a strong session secret we must not issue sessions,
 *  so we hide login entirely (fail closed) instead of signing with a weak key. */
export function githubConfigured(env: Env): boolean {
  return !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && sessionsEnabled(env));
}
