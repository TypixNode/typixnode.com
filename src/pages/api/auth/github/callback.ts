// GET /api/auth/github/callback?code=...&state=...
// Verify state, exchange the code for a token, fetch the GitHub profile + all
// verified emails, upsert the account, optionally bind a just-placed order,
// set the session cookie, and redirect back.
import type { APIRoute } from 'astro';
import {
  githubConfigured,
  readOAuthState,
  clearOAuthState,
  setSession,
} from '../../../../lib/auth';
import { upsertOAuthUser, bindOrderById, type OAuthIdentity } from '../../../../lib/users';

export const prerender = false;

const UA = 'typixnode.com';

export const GET: APIRoute = async ({ request, locals, cookies, redirect }) => {
  const env = (locals as any).runtime?.env as Env;
  if (!githubConfigured(env)) return new Response('GitHub login not configured.', { status: 503 });

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // CSRF: the signed token in the URL `state` must equal the one we set in the
  // cookie (and the cookie must verify). Capture before clearing.
  const cookieToken = cookies.get('tnx_oauth_state')?.value;
  const saved = await readOAuthState<{ ret: string; bind: string; nonce: string }>(env, cookies);
  clearOAuthState(cookies);

  if (!code || !state || !saved || !cookieToken || state !== cookieToken) {
    return redirect('/orders?error=auth', 302);
  }

  try {
    const origin = env.PUBLIC_SITE_URL || url.origin;
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${origin}/api/auth/github/callback`,
      }),
    });
    const tokenJson: any = await tokenRes.json();
    const accessToken = tokenJson?.access_token;
    if (!accessToken) return redirect('/orders?error=token', 302);

    const ghHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': UA,
    };
    const [profileRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers: ghHeaders }),
      fetch('https://api.github.com/user/emails', { headers: ghHeaders }),
    ]);
    const profile: any = await profileRes.json();
    const emails: any[] = emailsRes.ok ? await emailsRes.json() : [];

    const verifiedEmails = emails.filter((e) => e?.verified && e?.email).map((e) => String(e.email));
    const primaryEmail =
      emails.find((e) => e?.primary && e?.verified)?.email ?? verifiedEmails[0] ?? profile?.email ?? null;

    if (!profile?.id) return redirect('/orders?error=profile', 302);

    const identity: OAuthIdentity = {
      provider: 'github',
      providerUserId: String(profile.id),
      username: profile.login ?? null,
      providerEmail: primaryEmail,
      name: profile.name ?? profile.login ?? null,
      avatarUrl: profile.avatar_url ?? null,
      verifiedEmails,
    };

    const user = await upsertOAuthUser(env.DB, identity);

    // Bind a just-placed order (success page passed its internal order id).
    if (saved.bind) {
      try { await bindOrderById(env.DB, user.id, saved.bind); } catch {}
    }

    await setSession(env, cookies, user.id);

    let ret = saved.ret || '/orders';
    if (!ret.startsWith('/')) ret = '/orders';
    return redirect(ret, 302);
  } catch (e: any) {
    console.error('[auth/github/callback]', e?.message || e);
    return redirect('/orders?error=auth', 302);
  }
};
