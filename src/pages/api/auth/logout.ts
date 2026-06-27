// POST /api/auth/logout — clear the session cookie and return home.
import type { APIRoute } from 'astro';
import { clearSession } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  clearSession(cookies);
  return redirect('/orders', 302);
};

export const GET = POST;
