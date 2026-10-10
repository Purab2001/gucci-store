"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, orderItems, orders, products } from "@/db/schema";
import { isAllowedImageUrl } from "@/lib/images";
import { requireAdmin } from "@/lib/session";

/**
 * Admin product mutations. Every action verifies the admin role first —
 * the layout/page gates and hidden links are display only and never
 * authorize. Amounts are validated server-side and stored as integer
 * cents; the browser never supplies cents directly.
 */

export interface AdminProductFormState {
  ok: boolean;
  message: string;
  fieldErrors: Record<string, string>;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_PRICE_CENTS = 10_000_000; // $100,000 — generous cap, still bounded.
const MAX_STOCK = 999_999;

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

interface ValidatedProduct {
  name: string;
  slug: string;
  description: string | null;
  material: string | null;
  categoryId: string;
  priceCents: number;
  imageUrl: string;
  tag: string | null;
  stockQuantity: number;
  isFeatured: boolean;
  isActive: boolean;
}

function fail(
  message: string,
  fieldErrors: Record<string, string> = {},
): AdminProductFormState {
  return { ok: false, message, fieldErrors };
}

/**
 * Shared stock validation: whole numbers 0–MAX_STOCK only.
 * Used by both the full product form and the dedicated stock editor
 * so the two can never drift apart.
 */
function parseStockQuantity(raw: string):
  | { ok: true; quantity: number }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: "Stock must be a whole number, 0 or more." };
  }
  const quantity = Number(trimmed);
  if (quantity < 0 || quantity > MAX_STOCK) {
    return {
      ok: false,
      error: `Stock must be 0–${MAX_STOCK.toLocaleString()}.`,
    };
  }
  return { ok: true, quantity };
}

/** Sync validation only (no DB). Category existence + slug uniqueness checked by callers. */
function validateProductForm(formData: FormData):
  | { ok: true; data: ValidatedProduct }
  | { ok: false; state: AdminProductFormState } {
  const name = (formData.get("name") ?? "").toString().trim();
  const rawSlug = (formData.get("slug") ?? "").toString().trim();
  const descriptionRaw = (formData.get("description") ?? "").toString().trim();
  const materialRaw = (formData.get("material") ?? "").toString().trim();
  const categoryId = (formData.get("categoryId") ?? "").toString().trim();
  const priceRaw = (formData.get("priceDollars") ?? "").toString().trim();
  const imageUrl = (formData.get("imageUrl") ?? "").toString().trim();
  const tagRaw = (formData.get("tag") ?? "").toString().trim();
  const stockRaw = (formData.get("stockQuantity") ?? "").toString().trim();
  const isFeatured = formData.get("isFeatured") === "on";
  const isActive = formData.get("isActive") === "on";

  const fieldErrors: Record<string, string> = {};

  if (name.length < 2 || name.length > 120) {
    fieldErrors.name = "Name must be 2–120 characters.";
  }

  const slug = rawSlug ? rawSlug.toLowerCase() : slugify(name);
  if (slug.length < 2 || slug.length > 100 || !SLUG_RE.test(slug)) {
    fieldErrors.slug =
      "Slug must be 2–100 chars: lowercase letters, numbers, hyphens.";
  }

  if (!categoryId) {
    fieldErrors.categoryId = "Choose a category.";
  }

  // Dollars in, cents in the DB. Strip common decorations, max 2dp.
  const normalizedPrice = priceRaw.replace(/[$,\s]/g, "");
  let priceCents = NaN;
  if (!/^\d+(\.\d{1,2})?$/.test(normalizedPrice)) {
    fieldErrors.priceDollars = "Enter a price like 1290.00.";
  } else {
    priceCents = Math.round(Number(normalizedPrice) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 1) {
      fieldErrors.priceDollars = "Price must be at least $0.01.";
    } else if (priceCents > MAX_PRICE_CENTS) {
      fieldErrors.priceDollars = "Price is above the $100,000 limit.";
    }
  }

  if (!imageUrl || imageUrl.length > 2048) {
    fieldErrors.imageUrl = "Image URL is required (max 2048 chars).";
  } else if (!isAllowedImageUrl(imageUrl)) {
    // Keep in sync with next.config.ts remotePatterns (ALLOWED_IMAGE_HOSTS):
    // any other host breaks next/image on the storefront and Stripe's
    // product-image fetch at checkout.
    fieldErrors.imageUrl =
      "Use an images.unsplash.com https URL so the storefront can render it.";
  }

  const parsedStock = parseStockQuantity(stockRaw);
  if (!parsedStock.ok) {
    fieldErrors.stockQuantity = parsedStock.error;
  }
  const stockQuantity = parsedStock.ok ? parsedStock.quantity : NaN;

  if (descriptionRaw.length > 5000) {
    fieldErrors.description = "Description must be under 5,000 characters.";
  }
  if (materialRaw.length > 500) {
    fieldErrors.material = "Material must be under 500 characters.";
  }
  if (tagRaw.length > 32) {
    fieldErrors.tag = "Tag must be under 32 characters.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      state: fail("Check the highlighted fields and try again.", fieldErrors),
    };
  }

  return {
    ok: true,
    data: {
      name,
      slug,
      description: descriptionRaw ? descriptionRaw : null,
      material: materialRaw ? materialRaw : null,
      categoryId,
      priceCents,
      imageUrl,
      tag: tagRaw ? tagRaw : null,
      stockQuantity,
      isFeatured,
      isActive,
    },
  };
}

function isUniqueViolation(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /duplicate|unique|23505/i.test(message);
}

/**
 * Refresh the admin list plus every static storefront route a product feeds:
 * home, shop, new arrivals, its detail page, and the collection pages whose
 * grids and piece counts derive from the same rows.
 */
function revalidateCatalogue(slugs: string[], categorySlugs: string[] = []) {
  // Tag invalidation busts the `"use cache"` catalogue reads immediately
  // (read-your-own-writes for the admin); path revalidation refreshes the
  // static route shells that render them.
  updateTag("catalogue");
  for (const slug of slugs) {
    updateTag(`product-${slug}`);
  }
  for (const categorySlug of new Set(categorySlugs)) {
    updateTag(`collection-${categorySlug}`);
  }
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/new-arrivals");
  for (const slug of slugs) {
    revalidatePath(`/shop/${slug}`);
    revalidatePath(`/admin/products/${slug}/edit`);
  }
  for (const categorySlug of new Set(categorySlugs)) {
    revalidatePath(`/collections/${categorySlug}`);
  }
}

export async function createProductAction(
  _prevState: AdminProductFormState,
  formData: FormData,
): Promise<AdminProductFormState> {
  await requireAdmin("/admin/products/new");

  const validated = validateProductForm(formData);
  if (!validated.ok) return validated.state;
  const data = validated.data;

  const category = await db.query.categories.findFirst({
    where: eq(categories.id, data.categoryId),
    columns: { id: true, slug: true },
  });
  if (!category) {
    return fail("Check the highlighted fields and try again.", {
      categoryId: "Choose a valid category.",
    });
  }

  const existing = await db.query.products.findFirst({
    where: eq(products.slug, data.slug),
    columns: { id: true },
  });
  if (existing) {
    return fail("Check the highlighted fields and try again.", {
      slug: "That slug is already used by another product.",
    });
  }

  try {
    await db.insert(products).values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      material: data.material,
      categoryId: data.categoryId,
      priceCents: data.priceCents,
      imageUrl: data.imageUrl,
      tag: data.tag,
      stockQuantity: data.stockQuantity,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return fail("Check the highlighted fields and try again.", {
        slug: "That slug is already used by another product.",
      });
    }
    console.error("Admin product create failed:", err);
    return fail("Could not create the product. Please try again.");
  }

  revalidateCatalogue([data.slug], [category.slug]);
  redirect("/admin/products");
}

export async function updateProductAction(
  slug: string,
  _prevState: AdminProductFormState,
  formData: FormData,
): Promise<AdminProductFormState> {
  await requireAdmin(`/admin/products/${slug}/edit`);

  const existing = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    // Relational query: keep `with` inline (hoisting breaks inference).
    // Category slug captured before the update so revalidation can cover
    // the previous family when a product moves.
    with: { category: { columns: { slug: true } } },
  });
  if (!existing) return fail("That product no longer exists.");

  const validated = validateProductForm(formData);
  if (!validated.ok) return validated.state;
  const data = validated.data;

  const category = await db.query.categories.findFirst({
    where: eq(categories.id, data.categoryId),
    columns: { id: true, slug: true },
  });
  if (!category) {
    return fail("Check the highlighted fields and try again.", {
      categoryId: "Choose a valid category.",
    });
  }

  if (data.slug !== existing.slug) {
    const clash = await db.query.products.findFirst({
      where: and(eq(products.slug, data.slug), ne(products.id, existing.id)),
      columns: { id: true },
    });
    if (clash) {
      return fail("Check the highlighted fields and try again.", {
        slug: "That slug is already used by another product.",
      });
    }
  }

  try {
    await db
      .update(products)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description,
        material: data.material,
        categoryId: data.categoryId,
        priceCents: data.priceCents,
        imageUrl: data.imageUrl,
        tag: data.tag,
        stockQuantity: data.stockQuantity,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
      })
      .where(eq(products.id, existing.id));
  } catch (err) {
    if (isUniqueViolation(err)) {
      return fail("Check the highlighted fields and try again.", {
        slug: "That slug is already used by another product.",
      });
    }
    console.error("Admin product update failed:", err);
    return fail("Could not save the product. Please try again.");
  }

  revalidateCatalogue(
    data.slug === existing.slug ? [data.slug] : [existing.slug, data.slug],
    data.categoryId === existing.categoryId
      ? [category.slug]
      : [category.slug, existing.category.slug],
  );
  redirect("/admin/products");
}

export interface AdminStockFormState {
  ok: boolean;
  message: string;
  fieldErrors: Record<string, string>;
  /** Quantity confirmed by the last successful save, for inline feedback. */
  savedQuantity: number | null;
}

/**
 * Dedicated stock-only update. Unlike updateProductAction (full-row
 * overwrite), this touches stockQuantity alone: re-reads the row, validates
 * the integer server-side, performs a single absolute SET, and stays on
 * the list with inline feedback instead of redirecting.
 */
export async function updateStockAction(
  productId: string,
  _prevState: AdminStockFormState,
  formData: FormData,
): Promise<AdminStockFormState> {
  await requireAdmin("/admin/products");

  const raw = (formData.get("stockQuantity") ?? "").toString();
  const parsed = parseStockQuantity(raw);
  if (!parsed.ok) {
    return {
      ok: false,
      message: "Check the stock value and try again.",
      fieldErrors: { stockQuantity: parsed.error },
      savedQuantity: null,
    };
  }

  const row = await db.query.products.findFirst({
    where: eq(products.id, productId),
    // Relational query: keep `with` inline (hoisting breaks inference).
    with: { category: { columns: { slug: true } } },
  });
  if (!row) {
    return {
      ok: false,
      message: "That product no longer exists.",
      fieldErrors: {},
      savedQuantity: null,
    };
  }

  try {
    await db
      .update(products)
      .set({ stockQuantity: parsed.quantity })
      .where(eq(products.id, row.id));
  } catch (err) {
    console.error("Admin stock update failed:", err);
    return {
      ok: false,
      message: "Could not save stock. Please try again.",
      fieldErrors: {},
      savedQuantity: null,
    };
  }

  revalidateCatalogue([row.slug], [row.category.slug]);

  // Warn-only when dropping below open demand: pending checkouts hold
  // snapshot quantities, and the checkout + webhook gates still enforce
  // live stock — the admin is informed, never blocked.
  let pendingUnits = 0;
  try {
    const demand = await db
      .select({ qty: sql<number>`coalesce(sum(${orderItems.quantity}), 0)` })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orderItems.productId, row.id),
          eq(orders.status, "pending"),
        ),
      );
    pendingUnits = Number(demand[0]?.qty ?? 0);
  } catch (err) {
    console.error("Admin pending-demand check failed:", err);
  }

  const warning =
    pendingUnits > parsed.quantity
      ? ` Note: ${pendingUnits} unit${pendingUnits === 1 ? "" : "s"} sit${pendingUnits === 1 ? "s" : ""} in pending checkouts — those sessions revalidate against live stock before payment.`
      : "";

  return {
    ok: true,
    message: `Stock saved at ${parsed.quantity}.${warning}`,
    fieldErrors: {},
    savedQuantity: parsed.quantity,
  };
}

export interface AdminAvailabilityFormState {
  ok: boolean;
  message: string;
  /** Value confirmed by the last successful save, for inline feedback. */
  savedActive: boolean | null;
}

const AVAILABILITY_INITIAL: AdminAvailabilityFormState = {
  ok: false,
  message: "",
  savedActive: null,
};

export async function setProductAvailabilityAction(
  productId: string,
  _prevState: AdminAvailabilityFormState,
  formData: FormData,
): Promise<AdminAvailabilityFormState> {
  await requireAdmin("/admin/products");

  const makeActive = formData.get("makeActive")?.toString() === "true";
  if (!productId) {
    return { ...AVAILABILITY_INITIAL, message: "Missing product." };
  }

  const row = await db.query.products.findFirst({
    where: eq(products.id, productId),
    // Relational query: keep `with` inline (hoisting breaks inference).
    with: { category: { columns: { slug: true } } },
  });
  if (!row) {
    return { ...AVAILABILITY_INITIAL, message: "That product no longer exists." };
  }

  try {
    await db
      .update(products)
      .set({ isActive: makeActive })
      .where(eq(products.id, row.id));
  } catch (err) {
    console.error("Admin availability update failed:", err);
    return { ...AVAILABILITY_INITIAL, message: "Could not save. Please try again." };
  }

  // Retiring keeps order history intact (order_items FK is restrict);
  // deactivation hides the piece from the storefront instead of deleting it.
  revalidateCatalogue([row.slug], [row.category.slug]);

  return {
    ok: true,
    message: makeActive ? "Active on the storefront." : "Retired from the storefront.",
    savedActive: makeActive,
  };
}

export interface AdminCategoryFormState {
  ok: boolean;
  message: string;
  fieldErrors: Record<string, string>;
}

const CATEGORY_FAIL = (
  message: string,
  fieldErrors: Record<string, string> = {},
): AdminCategoryFormState => ({ ok: false, message, fieldErrors });

interface ValidatedCategory {
  name: string;
  slug: string;
  blurb: string | null;
  imageUrl: string | null;
}

/** Sync validation only (no DB). Name/slug uniqueness checked by callers. */
function validateCategoryForm(formData: FormData):
  | { ok: true; data: ValidatedCategory }
  | { ok: false; state: AdminCategoryFormState } {
  const name = (formData.get("name") ?? "").toString().trim();
  const rawSlug = (formData.get("slug") ?? "").toString().trim();
  const blurbRaw = (formData.get("blurb") ?? "").toString().trim();
  const imageRaw = (formData.get("imageUrl") ?? "").toString().trim();

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2 || name.length > 80) {
    fieldErrors.name = "Name must be 2–80 characters.";
  }
  const slug = rawSlug ? rawSlug.toLowerCase() : slugify(name);
  if (slug.length < 2 || slug.length > 100 || !SLUG_RE.test(slug)) {
    fieldErrors.slug =
      "Slug must be 2–100 chars: lowercase letters, numbers, hyphens.";
  }
  if (blurbRaw.length > 500) {
    fieldErrors.blurb = "Blurb must be under 500 characters.";
  }
  let imageUrl: string | null = null;
  if (imageRaw) {
    if (imageRaw.length > 2048) {
      fieldErrors.imageUrl = "Image URL must be under 2048 characters.";
    } else if (!isAllowedImageUrl(imageRaw)) {
      fieldErrors.imageUrl =
        "Use an images.unsplash.com https URL so the storefront can render it.";
    } else {
      imageUrl = imageRaw;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      state: CATEGORY_FAIL(
        "Check the highlighted fields and try again.",
        fieldErrors,
      ),
    };
  }
  return {
    ok: true,
    data: {
      name,
      slug,
      blurb: blurbRaw ? blurbRaw : null,
      imageUrl,
    },
  };
}

function revalidateCategory(oldSlug: string | null, newSlug: string) {
  updateTag("catalogue");
  if (oldSlug && oldSlug !== newSlug) updateTag(`collection-${oldSlug}`);
  updateTag(`collection-${newSlug}`);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/collections/${newSlug}`);
  if (oldSlug && oldSlug !== newSlug) {
    revalidatePath(`/collections/${oldSlug}`);
  }
}

/**
 * Create a catalogue family. Every action verifies the admin role first.
 * Slugs stay unique so storefront collection routes never collide.
 */
export async function createCategoryAction(
  _prevState: AdminCategoryFormState,
  formData: FormData,
): Promise<AdminCategoryFormState> {
  await requireAdmin("/admin/categories");

  const validated = validateCategoryForm(formData);
  if (!validated.ok) return validated.state;
  const data = validated.data;

  const [nameClash, slugClash] = await Promise.all([
    db.query.categories.findFirst({
      where: eq(categories.name, data.name),
      columns: { id: true },
    }),
    db.query.categories.findFirst({
      where: eq(categories.slug, data.slug),
      columns: { id: true },
    }),
  ]);
  if (nameClash) {
    return CATEGORY_FAIL("Check the highlighted fields and try again.", {
      name: "That name is already used by another category.",
    });
  }
  if (slugClash) {
    return CATEGORY_FAIL("Check the highlighted fields and try again.", {
      slug: "That slug is already used by another category.",
    });
  }

  try {
    await db.insert(categories).values({
      name: data.name,
      slug: data.slug,
      blurb: data.blurb,
      imageUrl: data.imageUrl,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return CATEGORY_FAIL("That name or slug is already in use.");
    }
    console.error("Admin category create failed:", err);
    return CATEGORY_FAIL("Could not create the category. Please try again.");
  }

  revalidateCategory(null, data.slug);
  redirect("/admin/categories");
}

/**
 * Rename a catalogue family (name, slug, blurb, image). Products follow
 * automatically via their category_id FK; both the old and new collection
 * routes revalidate so no stale page survives a slug change.
 */
export async function updateCategoryAction(
  categoryId: string,
  _prevState: AdminCategoryFormState,
  formData: FormData,
): Promise<AdminCategoryFormState> {
  await requireAdmin("/admin/categories");

  const existing = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
    columns: { id: true, name: true, slug: true },
  });
  if (!existing) return CATEGORY_FAIL("That category no longer exists.");

  const validated = validateCategoryForm(formData);
  if (!validated.ok) return validated.state;
  const data = validated.data;

  if (data.name !== existing.name) {
    const clash = await db.query.categories.findFirst({
      where: and(eq(categories.name, data.name), ne(categories.id, existing.id)),
      columns: { id: true },
    });
    if (clash) {
      return CATEGORY_FAIL("Check the highlighted fields and try again.", {
        name: "That name is already used by another category.",
      });
    }
  }
  if (data.slug !== existing.slug) {
    const clash = await db.query.categories.findFirst({
      where: and(eq(categories.slug, data.slug), ne(categories.id, existing.id)),
      columns: { id: true },
    });
    if (clash) {
      return CATEGORY_FAIL("Check the highlighted fields and try again.", {
        slug: "That slug is already used by another category.",
      });
    }
  }

  try {
    await db
      .update(categories)
      .set({
        name: data.name,
        slug: data.slug,
        blurb: data.blurb,
        imageUrl: data.imageUrl,
      })
      .where(eq(categories.id, existing.id));
  } catch (err) {
    if (isUniqueViolation(err)) {
      return CATEGORY_FAIL("That name or slug is already in use.");
    }
    console.error("Admin category update failed:", err);
    return CATEGORY_FAIL("Could not save the category. Please try again.");
  }

  revalidateCategory(existing.slug, data.slug);
  redirect("/admin/categories");
}
