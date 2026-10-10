# Gucci Store

A minimal luxury storefront built with **Next.js 16 (App Router) + React 19 + Tailwind CSS v4**, backed by **Neon Postgres (Drizzle ORM)**, authenticated with **Better Auth** (email/password), and paid through **Stripe-hosted Checkout** with webhook fulfilment.

## What it does

- **Storefront** — home, shop (search/filter/sort), new arrivals, collections, product detail pages. Catalogue routes are static/prerenderable with hourly-cached reads.
- **Bag** — signed-in shoppers get a database-backed bag; guests get a `localStorage` bag resolved against live prices/stock. Prices are never trusted from the browser.
- **Checkout** — Stripe-hosted, sign-in only. Amounts are rebuilt server-side from the live catalogue; only the signed Stripe webhook moves orders to `paid`.
- **Account** — profile, session info, order history scoped to the signed-in customer.
- **Atelier console (`/admin`)** — products (create/edit, inline stock, retire/reactivate), categories (create/rename with live piece counts), and read-only order inspection.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run db:migrate     # apply migrations (or db:push for dev-only schema sync)
npm run db:seed        # seed catalogue + local-dev admin login
npm run dev            # http://localhost:3000
```

### Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | **Pooled** Neon connection string (required everywhere, including the app) |
| `BETTER_AUTH_SECRET` | 32+ char secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | App origin for auth callbacks (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Same origin, used for Stripe redirect URLs |
| `STRIPE_SECRET_KEY` | Restricted key (`rk_…`) for Checkout Sessions, reads, refunds |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) from `stripe listen` or the Dashboard |

`BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must both point at the app's origin or auth callbacks break.

## Demo logins (local development only)

`npm run db:seed` creates the catalogue and pins this atelier login (re-seeding restores it, and never touches shopper accounts):

- **Email:** `admin@gucci.store`
- **Password:** `Atelier1921!`

Sign in, then open [/admin](http://localhost:3000/admin). Shoppers can self-register at [/sign-up](http://localhost:3000/sign-up) — everyone starts as `user`.

> These credentials are committed for local development convenience only. Never seed them into a shared/production database, and rotate the password if the seed ever runs outside `localhost`.

### Making another user an admin

`user.role` (`user` | `admin`) is the authorization flag. Promote via SQL:

```sql
update "user" set role = 'admin' where email = 'someone@example.com';
```

Every admin page *and* every admin server action re-checks the role (`requireAdmin()`); the `/admin` cookie check in `src/proxy.ts` is an optimistic redirect only. Non-admins get a 404 on admin routes by design.

## Useful commands

```bash
npm run dev          # Next dev server
npm run build        # Production build — also the only full typecheck
npm run lint         # ESLint

npm run db:generate  # Emit SQL migrations from src/db/schema.ts into ./drizzle
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema straight to the DB (no migration file) — dev only
npm run db:studio    # Drizzle Studio
npm run db:seed      # Re-seed catalogue + admin login (clears catalogue, bags, orders first)
```

No test runner is configured yet.

## How it fits together

### Data & conventions (`src/db/schema.ts` is the source of truth)

- **Money is integer cents** (`price_cents`). Only `mapProduct()` divides by 100. Catalogue UI uses `formatPrice` (dollars); bag/checkout/receipts use `formatCents` so the rendered number always matches the underlying cents.
- **Stock is a quantity** (`stock_quantity`), never a stored state. `in` / `low` / `out` UI states derive in `src/lib/stock.ts` (low ≤ 3).
- Public identifiers are **`slug`s**; `cart_items` holds one line per product per cart; `order_items.product_id` is `ON DELETE RESTRICT`, so retire products via `is_active` instead of deleting them.
- The Neon driver is stateless HTTP — no interactive transactions. Writes that must stay consistent use guarded single-row updates (`stock >= qty`, `status = 'pending'` claims, partial unique index for one live checkout per customer) rather than transactions.
- Catalogue reads (`src/lib/products.ts`) use `"use cache"` + hourly lifetimes; admin mutations bust them with `updateTag("catalogue")` + path revalidation. Never read the session in a catalogue page or the root layout.

### Auth (`src/lib/auth.ts`, `src/lib/session.ts`)

- Better Auth + Drizzle adapter, email/password (min 8 chars), 7-day sessions with daily refresh, `nextCookies()` so Server Actions can set session cookies.
- Client components use `src/lib/auth-client.ts`; server code calls `auth.api.*` with `headers()`.
- Rate limiting is on with tight windows on sign-in/sign-up. Email verification is off in v1 (no verification/reset emails).

### Bag & checkout

- Signed-in bag lives in `carts`/`cart_items` (one cart per user, nothing to merge). Quantities are capped at live stock on every write.
- `createCheckoutSessionAction` rebuilds totals from a fresh bag read, revalidates availability/stock, supersedes older `pending` attempts (verifying + expiring their Stripe sessions, failing closed), then writes a `pending` order with snapshotted lines.
- **Only the signed webhook** (`/api/stripe/webhook`, idempotency via `stripe_events`) transitions orders: `paid` (revalidates amount, currency, and stock; refunds + fails on mismatch/shortage; decrements stock guarded; clears the bag) or `failed`/`expired` (bag kept). The success page is read-only and polls via `router.refresh()` until the webhook lands.
- Test webhooks locally with `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

### Admin console

| Area | Can do |
|---|---|
| Products | Create/edit (server-validated: slug, category, dollar→cent price, allowlisted image host, stock 0–999,999), inline stock saves, retire/reactivate (retiring hides from the storefront, keeps receipts intact) |
| Categories | Create/rename with live total + active piece counts; only families with an image show in the homepage Collections strip |
| Orders | Inspect every attempt (lines, customer, Stripe ids, totals) — read-only; status is webhook-owned |

## Project layout

```
src/app/            # Routes: storefront, /bag, /account, /admin, /checkout, API (auth, Stripe webhook)
src/components/     # bag, shop, product, checkout, admin, auth, layout, account
src/lib/            # products, cart(+actions/types), checkout-actions, orders,
                    # admin-actions, admin-products, admin-orders, auth(+client),
                    # session, stock, format, images, stripe
src/db/             # schema.ts (single source of truth) + Neon client
scripts/seed.ts     # Idempotent catalogue + admin seed
drizzle/            # Versioned SQL migrations
```

See `AGENTS.md` for contributor conventions (commands, schema rules, static-shell requirements).
