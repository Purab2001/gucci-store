## Commands

```bash
npm run dev          # Next dev server
npm run build        # Production build — also the only full typecheck (tsc has noEmit)
npm run lint         # ESLint (flat config, eslint-config-next core-web-vitals + TS)

npm run db:generate  # Emit SQL migrations from src/db/schema.ts into ./drizzle
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema straight to the DB (no migration file) — dev only
npm run db:studio    # Drizzle Studio
npm run db:seed      # Re-seed the catalogue from scripts/seed.ts (clears it first)
```

No test runner is configured yet.

## Architecture

Next.js 16 App Router + React 19, Tailwind v4 (no `tailwind.config`; theme lives in `@theme` in `src/app/globals.css`), TypeScript strict, `@/*` → `src/*`.

**Data layer.** `src/db/index.ts` creates a single `db` over Neon's HTTP driver (`drizzle-orm/neon-http`) and throws at import time if `DATABASE_URL` is missing. That driver is stateless HTTP — no interactive transactions, so batch via `db.batch()` rather than `db.transaction()`. `DATABASE_URL` must be the **pooled** Neon string.

**Schema.** `src/db/schema.ts` is the single schema file and the source of truth for `drizzle.config.ts`, the `db` client, and the Better Auth adapter. It holds the four Better Auth tables (`user`, `session`, `account`, `verification`) plus the catalogue (`categories`, `products`), the bag (`carts`, `cart_items`), and orders (`orders`, `order_items`, `stripe_events`); every further application table belongs in the same file. Renaming or dropping the Better Auth columns breaks auth. Conventions: camelCase TS keys mapped to snake_case columns; `uuid` primary keys with `defaultRandom()` on application tables, with `slug` as the unique public identifier every route and React key uses; declare each foreign key's `relations()` alongside the table. `cart_items` has a UNIQUE on (`cart_id`, `product_id`) — one line per product per cart.

**Catalogue.** Schema decisions the storefront depends on:

- **Money is integer cents** (`priceCents`). Only `mapProduct()` in `src/lib/products.ts` divides by 100; components receive dollars and never see the column.
- **Stock is a quantity** (`stockQuantity`), never a stored state. The three states the UI speaks in (`in`/`low`/`out`) are derived by `stockState()` in `src/lib/stock.ts`, which returns `label`/`note`/`dotClass`.
- **Homepage uses `isFeatured`** — `getFeaturedProducts()` filters `isFeatured + isActive` ordered by `createdAt` desc. `/new-arrivals` uses `getNewArrivals()` (`isActive` ordered by `createdAt` desc, limit 8).
- **Categories carry the homepage "Collections" strip**: the ones with an `imageUrl` are what it renders, and piece counts are counted from `products`, never stored.
- **v1 has a single packshot** (`products.imageUrl`). Galleries later = new `product_images` table.
- Pages never touch `db` directly: they call the query functions in `src/lib/products.ts`, which return the mapped `Product` type. `src/data/products.ts` is static chrome only (hero, atelier, editorial tiles) and holds no catalogue data.
- Drizzle relational queries: write the `with` block inline at each call site. Hoisting it into a shared `as const` config breaks result-shape inference.

**Migrations.** Versioned SQL committed under `drizzle/`, generated with `db:generate` and applied with `db:migrate`; `db:push` stays a dev-only escape hatch. Read the emitted SQL before applying it. `scripts/seed.ts` (run via `db:seed`, under `tsx` with `import "dotenv/config"`) is idempotent — it clears `order_items` → `orders` → `cart_items` → `carts` → `products` → `categories` in that order, and backdates `createdAt` from a hardcoded base date so ordering is reproducible across runs.

**Auth.** `src/lib/auth.ts` is the server instance — Drizzle adapter over the same schema, email/password enabled, `nextCookies()` plugin so Server Actions can set session cookies. All client HTTP auth routes are served by the catch-all `src/app/api/auth/[...all]/route.ts`. `src/lib/auth-client.ts` is the React client, keyed off `NEXT_PUBLIC_APP_URL`; import it only in client components. Server code calls `auth.api.*` directly with `headers()` instead. `user.role` (`user`|`admin`) comes from `additionalFields`; `requireAdmin()` in `src/lib/session.ts` redirects logged-out users and 404s non-admins. `src/proxy.ts` is an optimistic cookie-presence redirect only — real authorization always happens in `requireUser`/`requireAdmin`, never in the proxy.

**Bag and checkout.** Signed-in shoppers keep the DB-backed bag — `carts` has a unique on `user_id`, so there is nothing to merge on sign-in. Guests get a client-side bag instead: `CartProvider` (`src/components/bag/CartProvider.tsx`) persists slug + quantity pairs to localStorage, and `getGuestBagPreviewAction` in `src/lib/cart-actions.ts` resolves them against live `products.priceCents`/stock. One context drives both the header `BagMenu` dropdown and the guest `/bag` view (`GuestBagView`); `/bag` is public and `src/proxy.ts` gates only `/account` and `/admin`. `src/lib/cart.ts` is the only module that touches `db` for carts, the way `src/lib/products.ts` owns the catalogue; its shapes live in `src/lib/cart-types.ts` so client components can import them without pulling a `server-only` module into the bundle. **Neither `cart_items` nor the guest store holds a price** — amounts are read live from `products.priceCents` at render, so the browser never supplies a number that touches money.

Checkout is Stripe-hosted and sign-in only. `createCheckoutSessionAction` (`src/lib/checkout-actions.ts`) rebuilds amounts from a fresh `getBagByUserId` read (never browser prices), revalidates stock, supersedes prior `pending` attempts (verifies + expires their Stripe sessions, failing closed when a prior payment already landed), then creates the Checkout Session with `price_data` built from `products.priceCents` and writes a `pending` order + `order_items` snapshots (sequential inserts with cleanup — neon-http batches aren't transactional). Only the signed webhook (`src/app/api/stripe/webhook/route.ts`, idempotency via `stripe_events`) moves orders to `paid` (revalidating stock, decrementing guarded by `stock >= qty`, clearing the bag) or `failed`/`expired` (no stock change, bag kept); the success page (`/checkout/success`) is read-only and never writes order state. The webhook reads the raw body (`req.text()` — never `req.json()`, or signature verification breaks) and fulfils only when `payment_status === "paid"`; transient failures return 500 and release the ledger row so Stripe redelivers instead of acking a duplicate. `order_items.product_id` is `onDelete: restrict`, so retire products via `is_active` instead of deleting rows with order history.

**Static catalogue shell.** Catalogue routes stay static/prerenderable: every query in `src/lib/products.ts` uses `"use cache"` + `cacheLife("hours")`, detail routes (`shop/[slug]`, `collections/[slug]`) add `generateStaticParams` with `Suspense` fallbacks, and `next.config.ts` enables `cacheComponents`. The root `Header` is static too — session and bag count load only in client islands after hydration (`SessionNav` via `useSession`, `BagMenu` via `getBagCountAction`, guest preview via `CartProvider`). Never read the session (`headers()`) in a catalogue page or the root layout; per-user reads belong in `/bag`, `/account`, `/checkout/*`, or server actions.

**Money formatting.** `formatPrice` in `src/lib/format.ts` takes dollars and is **catalogue-only**. Anything derived from cents — bag, checkout, receipts — uses `formatCents`, so the rendered number always matches the underlying cents.

Env: copy `.env.example` → `.env`. `DATABASE_URL` must be the pooled Neon string; `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must both point at the app's origin or auth callbacks break; Stripe needs a restricted `STRIPE_SECRET_KEY` plus `STRIPE_WEBHOOK_SECRET`.

## Next.js 16 notes

Route params and `searchParams` are Promises and must be awaited. Layouts/pages use the globally generated `LayoutProps<"/route">` / `PageProps<"/route">` types (see `src/app/layout.tsx`) — these are emitted into `.next/types`, so a route's types only exist after a dev server or build has run. Read `node_modules/next/dist/docs/` before relying on remembered APIs.