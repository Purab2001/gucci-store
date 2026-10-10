import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProductAction } from "@/lib/admin-actions";
import { getAdminCategoryOptions } from "@/lib/admin-products";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "New product — Admin",
  description: "Create a catalogue product.",
};

// Admin-only and live — blocks on the server instead of prerendering.
export const instant = false;

export default async function AdminProductNewPage() {
  // Layout already gates /admin/*; re-check here so this read is
  // itself authorized (defense in depth).
  await requireAdmin("/admin/products/new");
  const categories = await getAdminCategoryOptions();

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Link
        href="/admin/products"
        className="link-nav inline-flex w-fit items-center gap-2"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to products
      </Link>
      <section
        aria-labelledby="admin-product-new-heading"
        className="surface-card px-7 py-8 sm:px-9"
      >
        <p className="eyebrow text-brass">Catalogue</p>
        <h2 id="admin-product-new-heading" className="heading-sub mt-3">
          New product
        </h2>
        <p className="body-luxe mt-3 max-w-md text-sm">
          Price is entered in dollars and stored as integer cents.
        </p>
        <div className="mt-6">
          {categories.length === 0 ? (
            <p className="body-luxe text-sm">
              Create a category first — every product needs a family.{" "}
              <Link href="/admin/categories" className="link-luxe text-ink">
                Open categories
              </Link>
            </p>
          ) : (
            <ProductForm
              mode="create"
              categories={categories}
              formAction={createProductAction}
              initial={{
                name: "",
                slug: "",
                description: "",
                material: "",
                categoryId: "",
                priceDollars: "",
                imageUrl: "",
                tag: "",
                stockQuantity: "0",
                isFeatured: false,
                isActive: true,
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
}
