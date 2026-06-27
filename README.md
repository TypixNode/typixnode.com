# typixnode.com

Official website **and store** for **TypixNode** — a compact CNC aluminum cyberdeck
and its companion keyboards.

Live at: [typixnode.com](https://typixnode.com)

## Products

| Slug | Product | Notes |
|---|---|---|
| `typixnode-cyberdeck` | **TypixNode Cyberdeck** | CNC aluminum slate, Raspberry Pi CM4/CM5 |
| `typixnode-keyboard` | **TypixNode BLE Keyboard** | nRF52840 · ZMK · BLE + USB, 6-axis air-mouse |
| `typixnode-diy-suite` | **TypixNode DIY Suite** | Solder-it-yourself silicone-dome + snap-dome kit |

## Tech Stack

- [Astro](https://astro.build/) — static marketing pages + on-demand API routes
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) — hosting + SSR for `/api/*`
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — order storage
- [Stripe Checkout](https://stripe.com/) — credit-card payments (hosted, PCI-minimal)
- [Resend](https://resend.com/) — transactional email

## Architecture

Marketing/store pages are **prerendered static**. Only the e-commerce API routes
opt into server rendering (`export const prerender = false`) and run on the Worker.

```
Browser (cart in localStorage, slug + qty only)
   │  POST /api/checkout  { items:[{slug,qty}], locale }
   ▼
Worker /api/checkout ──► recomputes prices from src/lib/products.ts (authoritative)
   │                     creates Stripe Checkout Session
   │                     INSERT pending order into D1
   ▼
Stripe hosted checkout  ──(payment)──►  success_url ?order=ord_xxx
   │
   │  webhook: checkout.session.completed (HMAC-SHA256 verified)
   ▼
Worker /api/stripe-webhook ──► mark order paid in D1 (idempotent)
                              ──► Resend: customer confirmation + admin notification
```

**Pricing is never trusted from the client.** The browser only stores slugs and
quantities; `/api/checkout` rebuilds every line item from the server catalog in
`src/lib/products.ts` (prices are integer USD cents).

### Key files

```
src/lib/products.ts          # authoritative catalog (i18n names, prices, images, specs)
src/lib/stripe.ts            # fetch-based Stripe client + webhook signature verify (Web Crypto)
src/lib/email.ts             # Resend confirmation + admin emails
src/lib/db.ts                # D1 order helpers
src/scripts/cart.ts          # localStorage cart
src/scripts/checkout.ts      # POST /api/checkout → redirect to Stripe
src/pages/api/checkout.ts          # create Checkout Session (SSR)
src/pages/api/stripe-webhook.ts    # payment webhook (SSR)
src/pages/[lang]/store/...         # store grid + product detail
src/pages/[lang]/cart.astro        # cart
src/pages/[lang]/checkout/...      # success / cancel
migrations/0001_init.sql           # orders table
```

## Development

```bash
npm install
cp .dev.vars.example .dev.vars   # fill in Stripe / Resend keys (gitignored)
npm run dev                      # http://localhost:4321
npm run build                    # output → dist/ (incl. dist/_worker.js)
```

Without keys, store/cart/product pages still work; checkout returns
`"Payments are not configured."` until `STRIPE_SECRET_KEY` is set.

## Store setup (one-time)

### 1. Create the D1 database

```bash
npx wrangler d1 create typixnode-orders
# copy the returned database_id into wrangler.jsonc (database_id field)
npx wrangler d1 migrations apply typixnode-orders            # local
npx wrangler d1 migrations apply typixnode-orders --remote   # production
```

### 2. Configure secrets

Local dev → `.dev.vars` (see `.dev.vars.example`). Production:

```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
```

Plain (non-secret) vars `FROM_EMAIL`, `ADMIN_EMAIL`, `PUBLIC_SITE_URL` can live in
`.dev.vars` for dev and in `wrangler.jsonc` `"vars"` (or as secrets) for production.

### 3. Stripe webhook

Point a webhook endpoint at `https://typixnode.com/api/stripe-webhook` and subscribe
to `checkout.session.completed`. Use the endpoint's signing secret as
`STRIPE_WEBHOOK_SECRET`. Locally:

```bash
stripe listen --forward-to localhost:4321/api/stripe-webhook
```

### 4. Resend

Verify your sending domain in Resend and set `FROM_EMAIL` to an address on it,
e.g. `TypixNode <orders@typixnode.com>`.

### Adjusting prices / products

Everything is driven by `src/lib/products.ts` — edit `priceCents` (USD cents),
copy, images, or specs there and rebuild. The store grid, product pages, cart, and
Stripe line items all derive from it.

## Deployment

Pushes to `main` deploy via Cloudflare Workers (connected to this GitHub repo).
The build emits `dist/` (static assets) and `dist/_worker.js` (SSR for `/api/*`),
wired up by `wrangler.jsonc`.

## License

Website source code is [MIT licensed](./LICENSE).

Product images and the TypixNode trademark are copyright Haohua Li. The "TypixNode"
name and logo may not be used without permission.
