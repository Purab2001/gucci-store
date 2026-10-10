import "server-only";

import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { orders, type OrderStatus } from "@/db/schema";

export interface OrderStatusState {
  status: OrderStatus;
  label: string;
  note: string;
  dotClass: string;
}

/**
 * Short public order reference. Derived from the order id prefix — never a
 * Stripe secret. Shared by the checkout receipt and the account history so
 * the same order reads identically everywhere.
 */
export function orderReference(orderId: string): string {
  return `GS-${orderId.slice(0, 8).toUpperCase()}`;
}

/**
 * Derive the UI payment state from the order status, mirroring the
 * stockState() pattern. Status is stored as plain text on the order row;
 * only the signed webhook owns the transitions.
 */
export function orderStatusState(status: string): OrderStatusState {
  switch (status as OrderStatus) {
    case "paid":
      return {
        status: "paid",
        label: "Paid",
        note: "Payment received",
        dotClass: "bg-forest",
      };
    case "expired":
      return {
        status: "expired",
        label: "Expired",
        note: "Checkout expired — your bag was kept",
        dotClass: "bg-stone",
      };
    case "failed":
      return {
        status: "failed",
        label: "Payment failed",
        note: "Payment did not complete — your bag was kept",
        dotClass: "bg-stone",
      };
    case "canceled":
      return {
        status: "canceled",
        label: "Canceled",
        note: "This order was canceled",
        dotClass: "bg-stone",
      };
    case "pending":
    default:
      return {
        status: "pending",
        label: "Confirming payment",
        note: "Payment is being confirmed",
        dotClass: "bg-heritage",
      };
  }
}

/**
 * Customer order history, newest first, with snapshotted
 * lines (for unit counts). Callers pass the session user id — history
 * never reads across accounts. System-superseded `canceled` attempts are
 * excluded: they were never a customer decision and only clutter the
 * history (they remain visible in the admin console for audit).
 */
export async function getOrdersByUserId(userId: string) {
  return db.query.orders.findMany({
    // Relational query: keep `with` inline (hoisting breaks inference).
    where: and(eq(orders.userId, userId), ne(orders.status, "canceled")),
    orderBy: desc(orders.createdAt),
    with: { items: true },
  });
}

/**
 * One order scoped to its owner. Returns null when the id is unknown or
 * belongs to another customer — callers render a 404 either way so the
 * page never leaks whether an order exists.
 */
export async function getOrderByIdForUser(orderId: string, userId: string) {
  const order = await db.query.orders.findFirst({
    // Relational query: keep `with` inline (hoisting breaks inference).
    // Owner scoped in SQL: another customer's row never leaves the database.
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    with: { items: true },
  });
  if (!order) return null;
  return order;
}
