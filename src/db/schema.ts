import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Catalogue: categories + products (+ stock as a column).
// Bag: carts + cart_items (signed-in only, one cart per user; guests keep a
// localStorage bag resolved against live prices — nothing to merge on sign-in).
// Orders: orders + order_items (one row per checkout attempt, signed-in only)
// + stripe_events (webhook idempotency ledger). Stripe-hosted Checkout —
// only the signed webhook writes paid/failed/expired state.

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  blurb: text("blurb"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  material: text("material"),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  // Money is integer cents. Only mapProduct() divides by 100.
  priceCents: integer("price_cents").notNull(),
  // Single packshot for v1. Galleries later = new product_images table.
  imageUrl: text("image_url").notNull(),
  tag: text("tag"),
  // Stock is a quantity, never a stored status. UI states derive in stock.ts.
  stockQuantity: integer("stock_quantity").notNull().default(0),
  // Replaces the hardcoded featuredProducts list on the homepage.
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const categoryRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export type CategoryRow = typeof categories.$inferSelect;
export type ProductRow = typeof products.$inferSelect;

// ---------------------------------------------------------------------------
// Better Auth tables (generated via `npx auth generate`, merged here so this
// file stays the single schema source). Do not rename/drop these columns.
// `user.role` ("user" | "admin") is the v1 authorization flag via
// `user.additionalFields` in src/lib/auth.ts.
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role").default("user").notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export type UserRow = typeof user.$inferSelect;

// ---------------------------------------------------------------------------
// Bag (signed-in only). One cart per user (unique user_id), so there is
// nothing to merge on sign-in — the guest bag lives in localStorage
// client-side. cart_items stores no price —
// amounts are always read live from products.price_cents.
// ---------------------------------------------------------------------------

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("cart_items_cart_id_idx").on(table.cartId),
    // One line per product per cart. Unique (not plain index) so concurrent
    // double-clicks / two tabs upsert the same row instead of inserting
    // duplicates. Requires a migration (see drizzle/).
    uniqueIndex("cart_items_cart_product_idx").on(
      table.cartId,
      table.productId,
    ),
  ],
);

export const cartsRelations = relations(carts, ({ many, one }) => ({
  items: many(cartItems),
  user: one(user, {
    fields: [carts.userId],
    references: [user.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export type CartRow = typeof carts.$inferSelect;
export type CartItemRow = typeof cartItems.$inferSelect;

// ---------------------------------------------------------------------------
// Orders (Stripe-hosted Checkout, sign-in only).
// One row per checkout attempt, owned by the signed-in customer
// (user_id FK, like carts). Status starts 'pending'; only a Stripe-signed
// webhook may later move it to 'paid' / 'expired' / 'failed' / 'canceled' —
// never the success page and never the browser. order_items snapshots the
// display columns + unit price at session-creation time so receipts survive
// later catalogue edits; the bag keeps reading live products.price_cents.
// stripe_events is the webhook idempotency ledger (one row per evt_...).
// ---------------------------------------------------------------------------

/** Lifecycle of an order row. Only the webhook leaves 'pending'. */
export type OrderStatus = "pending" | "paid" | "expired" | "failed" | "canceled";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Plain text (like user.role): the webhook owns the transitions.
    status: text("status").notNull().default("pending"),
    // Snapshot of the bag subtotal at session-creation time, in whole cents.
    subtotalCents: integer("subtotal_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    // Webhook lookup key: cs_... Unique so a retried delivery resolves to
    // the same row instead of creating a duplicate order.
    stripeSessionId: text("stripe_session_id").notNull().unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeCustomerId: text("stripe_customer_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    // Restrict (not cascade): catalogue rows with order history cannot be
    // deleted — deactivate via is_active instead so receipts stay intact.
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    // Snapshots at session-creation time (never re-read for receipts).
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    productImageUrl: text("product_image_url").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    // One line per product per order, mirroring cart_items.
    uniqueIndex("order_items_order_product_idx").on(
      table.orderId,
      table.productId,
    ),
  ],
);

export const stripeEvents = pgTable("stripe_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  // evt_... Unique so concurrent/redelivered webhooks insert once.
  eventId: text("event_id").notNull().unique(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type StripeEventRow = typeof stripeEvents.$inferSelect;
