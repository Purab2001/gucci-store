## Commands

```bash
npm run dev          # Next dev server (rewrites the agent-rules block in AGENTS.md)
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

Next.js 16 App Router + React 19, Tailwind v4 (PostCSS plugin only — no `tailwind.config`; theme lives in `src/app/globals.css`), TypeScript strict, `@/*` → `src/*`.

**Data layer.** `src/db/index.ts` creates a single `db` over Neon's HTTP driver (`drizzle-orm/neon-http`) and throws at import time if `DATABASE_URL` is missing. That driver is stateless HTTP — no interactive transactions, so batch via `db.batch()` rather than `db.transaction()`. `DATABASE_URL` must be the **pooled** Neon string.

**Schema.** `src/db/schema.ts` is the single schema file and the source of truth for `drizzle.config.ts`, the `db` client, and the Better Auth adapter. It holds the four Better Auth tables (`user`, `session`, `account`, `verification`) plus the catalogue (`categories`, `products`) and the bag (`carts`, `cart_items`); every further application table belongs in the same file. Renaming or dropping the Better Auth columns breaks auth. Conventions: camelCase TS keys mapped to snake_case columns; `uuid` primary keys with `defaultRandom()` on application tables, with `slug` as the unique public identifier every route and React key uses; declare each foreign key's `relations()` alongside the table. `cart_items` has a UNIQUE on (`cart_id`, `product_id`) — one line per product per cart.

**Catalogue.** Schema decisions the storefront depends on:

- **Money is integer cents** (`priceCents`). Only `mapProduct()` in `src/lib/products.ts` divides by 100; components receive dollars and never see the column.
- **Stock is a quantity** (`stockQuantity`), never a stored state. The three states the UI speaks in (`in`/`low`/`out`) are derived by `stockState()` in `src/lib/stock.ts`, which returns `label`/`note`/`dotClass`.
- **Homepage uses `isFeatured`** — `getFeaturedProducts()` filters `isFeatured + isActive` ordered by `createdAt` desc. `/new-arrivals` uses `getNewArrivals()` (`isActive` ordered by `createdAt` desc, limit 8).
- **Categories carry the homepage "Collections" strip**: the ones with an `imageUrl` are what it renders, and piece counts are counted from `products`, never stored.
- **v1 has a single packshot** (`products.imageUrl`). Galleries later = new `product_images` table.
- Pages never touch `db` directly: they call the query functions in `src/lib/products.ts`, which return the mapped `Product` type. `src/data/products.ts` is static chrome only (hero, atelier, editorial tiles) and holds no catalogue data.
- Drizzle relational queries: write the `with` block inline at each call site. Hoisting it into a shared `as const` config breaks result-shape inference.

**Migrations.** Versioned SQL committed under `drizzle/`, generated with `db:generate` and applied with `db:migrate`; `db:push` stays a dev-only escape hatch. Read the emitted SQL before applying it. `scripts/seed.ts` (run via `db:seed`, under `tsx` with `import "dotenv/config"`) is idempotent — it clears `cart_items` → `carts` → `products` → `categories` in that order, and backdates `createdAt` from a hardcoded base date so ordering is reproducible across runs.

**Auth.** `src/lib/auth.ts` is the server instance — Drizzle adapter over the same schema, email/password enabled, `nextCookies()` plugin so Server Actions can set session cookies. All client HTTP auth routes are served by the catch-all `src/app/api/auth/[...all]/route.ts`. `src/lib/auth-client.ts` is the React client, keyed off `NEXT_PUBLIC_APP_URL`; import it only in client components. Server code calls `auth.api.*` directly with `headers()` instead.

**Bag and checkout.** Signed-in shoppers keep the DB-backed bag — `carts` has a unique on `user_id`, so there is nothing to merge on sign-in. Guests get a client-side bag instead: `CartProvider` (`src/components/bag/CartProvider.tsx`) persists slug + quantity pairs to localStorage, and `getGuestBagPreviewAction` in `src/lib/cart-actions.ts` resolves them against live `products.priceCents`/stock. One context drives both the header `BagMenu` dropdown and the guest `/bag` view (`GuestBagView`); `/bag` is public and `src/proxy.ts` gates only `/account` and `/admin`. `src/lib/cart.ts` is the only module that touches `db` for carts, the way `src/lib/products.ts` owns the catalogue; its shapes live in `src/lib/cart-types.ts` so client components can import them without pulling a `server-only` module into the bundle. **Neither `cart_items` nor the guest store holds a price** — amounts are read live from `products.priceCents` at render, so the browser never supplies a number that touches money.

No checkout yet — v1 is bag-only. When checkout lands, it must rebuild amounts from a fresh `getBag()` read (never trust browser prices), and orders must be created by a webhook, never a success page.

**The header bag count has no number on the four catalogue routes.** `/`, `/new-arrivals`, `/collections/[slug]` and `/shop/[slug]` pass no `bag` slot to `SiteHeader` on purpose: any server read of `headers()` in that shell makes them dynamic and kills `generateStaticParams`. Do not "fix" the missing count with a server component; fetch it from a client component after hydration if it is ever wanted there.

**Money formatting.** `formatPrice` in `src/lib/format.ts` takes dollars and is **catalogue-only**. Anything derived from cents — bag, checkout, receipts — uses `formatCents`, so the rendered number always matches the underlying cents.

Env: copy `.env.example` → `.env`. `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must both point at the app's origin or auth callbacks break.

## Next.js 16 notes

Route params and `searchParams` are Promises and must be awaited. Layouts/pages use the globally generated `LayoutProps<"/route">` / `PageProps<"/route">` types (see `src/app/layout.tsx`) — these are emitted into `.next/types`, so a route's types only exist after a dev server or build has run. Read `node_modules/next/dist/docs/` before relying on remembered APIs.