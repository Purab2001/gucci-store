import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { updateProductAction } from "@/lib/admin-actions";
import {
  getAdminCategoryOptions,
  getAdminProductBySlug,
} from "@/lib/admin-products";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Edit product — Admin",
  description: "Edit a catalogue product.",
};

// Admin-only and live — blocks on the server instead of prerendering.
export const instant = false;

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Layout already gates /admin/*; re-check here so this read is
  // itself authorized (defense in depth). Slug is the public catalogue
  // identifier, matching the storefront routes.
  await requireAdmin(`/admin/products/${slug}/edit`);

  const [row, categories] = await Promise.all([
    getAdminProductBySlug(slug),
    getAdminCategoryOptions(),
  ]);
  // Unknown slugs 404 the same way for every admin — never leaks
  // whether a slug exists beyond the console.
  if (!row) notFound();

  const action = updateProductAction.bind(null, row.slug);

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
        aria-labelledby="admin-product-edit-heading"
        className="surface-card px-7 py-8 sm:px-9"
      >
        <p className="eyebrow text-brass">Catalogue</p>
        <h2 id="admin-product-edit-heading" className="heading-sub mt-3">
          Edit — {row.name}
        </h2>
        <p className="body-luxe mt-3 max-w-md text-sm">
          Category, price, availability and details save to the same row
          the storefront reads live. Receipts keep their own snapshots.
        </p>
        <div className="mt-6">
          <ProductForm
            mode="edit"
            categories={categories}
            formAction={action}
            initial={{
              name: row.name,
              slug: row.slug,
              description: row.description ?? "",
              material: row.material ?? "",
              categoryId: row.categoryId,
              priceDollars: (row.priceCents / 100).toFixed(2),
              imageUrl: row.imageUrl,
              tag: row.tag ?? "",
              stockQuantity: String(row.stockQuantity),
              isFeatured: row.isFeatured,
              isActive: row.isActive,
            }}
          />
        </div>
      </section>
    </div>
  );
}
