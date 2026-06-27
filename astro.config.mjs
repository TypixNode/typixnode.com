import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Marketing/product site served via SSR on Cloudflare Workers.
// Language, theme, currency and the cart drawer are handled client-side by
// /assets/js/site.js (en / zh / ja). SSR is retained so server-rendered
// routes (APIs, dynamic pages) can be added without re-architecting.
export default defineConfig({
  output: 'server',
  // CSRF origin-check stays ENABLED globally (Astro default). We do NOT downgrade
  // security site-wide. The only exception — payment webhooks, which are
  // server-to-server with no Origin header — is handled narrowly in
  // src/middleware.ts, and those routes verify provider signatures themselves.
  security: { checkOrigin: true },
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
});
