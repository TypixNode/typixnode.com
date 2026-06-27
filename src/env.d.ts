/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type D1Database = import('@cloudflare/workers-types').D1Database;

interface Env {
  // D1 binding (orders database)
  DB: D1Database;
  // Static assets binding (added by the Cloudflare adapter)
  ASSETS: { fetch: typeof fetch };

  // --- Secrets (set via `wrangler secret put` or .dev.vars) ---
  /** Stripe secret API key, e.g. sk_live_... / sk_test_... */
  STRIPE_SECRET_KEY: string;
  /** Stripe webhook signing secret, e.g. whsec_... */
  STRIPE_WEBHOOK_SECRET: string;
  /** Resend API key, e.g. re_... */
  RESEND_API_KEY: string;

  // --- Plain vars ---
  /** From address for transactional email, e.g. "TypixNode <orders@typixnode.com>" */
  FROM_EMAIL: string;
  /** Where new-order admin notifications are sent. */
  ADMIN_EMAIL: string;
  /** Public site origin, e.g. https://typixnode.com (used for success/cancel URLs). */
  PUBLIC_SITE_URL: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
