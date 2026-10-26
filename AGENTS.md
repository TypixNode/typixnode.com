# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single-package Astro 5 + Cloudflare Workers app (npm, `package-lock.json`).
There is no lint or test script; CI only runs `npm ci` + `npm run build`
(see `.github/workflows/deploy.yml`). Standard dev commands live in `package.json`
`scripts` and the `README.md` "Development" section — refer to those.

### Running the app locally

- Dev server: `npm run dev` → http://localhost:4321 (Astro dev + in-process
  Cloudflare/Miniflare via `platformProxy`). No separate database process is
  needed; Cloudflare D1 is emulated locally under `.wrangler/state` (gitignored).
- Before the store/API routes work, the **local D1 schema must be applied**:
  `npm run cf:migrate:local` (i.e. `wrangler d1 migrations apply typixnode-orders --local`).
  This is idempotent and only re-applies missing migrations. Re-run it if the
  local `.wrangler/state` is empty/reset (e.g. `/api/products` returns errors or
  the store grid is empty). This is intentionally NOT in the startup update
  script (it is a stateful migration step, not a dependency refresh).
- Local secrets/vars go in `.dev.vars` (gitignored; copy from `.dev.vars.example`).
  The store, cart, product pages, i18n, currency, and 3D viewer all work with **no**
  real credentials. Only a completed checkout needs Stripe/PayPal keys; without them
  checkout shows "Online payment is being set up / Payments are not configured" —
  this is expected, not a bug. `SESSION_SECRET` (>=16 chars) is only needed for the
  GitHub-OAuth accounts feature.

### Build / other

- Build: `npm run build` (emits `dist/` + `dist/_worker.js`).
- `npm run preview` runs the built worker under `wrangler dev` (port 8787).
- Sub-projects are independent and not needed for storefront work:
  `backup-worker/` (D1→R2 cron worker) and `tools/step2glb/` (offline Python 3.12
  CAD→glb asset tool).
