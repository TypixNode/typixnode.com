// GET /api/auth/github/login?return=/orders[&bind=<provider_ref>]
// Kick off GitHub OAuth. Stores a signed `state` (with the post-login return
// path and optional order-bind ref) in a short-lived cookie, then redirects to
// GitHub's consent screen.
import type { APIRoute } from 'astro';
import { githubConfigured, setOAuthState } from '../../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, cookies, redirect }) => {
  const env = (locals as any).runtime?.env as Env;
  if (!githubConfigured(env)) {
    return new Response('GitHub login is not configured yet.', { status: 503 });
  }

  const origin = env.PUBLIC_SITE_URL || new URL(request.url).origin;
  const url = new URL(request.url);
  let ret = url.searchParams.get('return') || '/orders';
  if (!ret.startsWith('/')) ret = '/orders'; // same-site relative only
  const bind = url.searchParams.get('bind') || '';

  const state = await setOAuthState(env, cookies, { ret, bind });

  const auth = new URL('https://github.com/login/oauth/authorize');
  auth.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  auth.searchParams.set('redirect_uri', `${origin}/api/auth/github/callback`);
  auth.searchParams.set('scope', 'read:user user:email');
  auth.searchParams.set('state', state);
  auth.searchParams.set('allow_signup', 'true');

  return redirect(auth.toString(), 302);
};
