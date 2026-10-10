import type { Metadata } from "next";
import {
  CreateCategoryForm,
  RenameCategoryForm,
} from "@/components/admin/CategoryForms";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/lib/admin-actions";
import { getAdminCategoriesWithCounts } from "@/lib/admin-orders";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Categories — Admin",
  description: "Manage catalogue categories.",
};

// Admin-only and live — blocks on the server instead of prerendering.
export const instant = false;

export default async function AdminCategoriesPage() {
  // Layout already gates /admin/*; re-check here so this read is
  // itself authorized (defense in depth).
  await requireAdmin("/admin/categories");
  const rows = await getAdminCategoriesWithCounts();

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section
        aria-labelledby="admin-categories-heading"
        className="surface-card px-7 py-8 sm:px-9"
      >
        <p className="eyebrow text-brass">Catalogue</p>
        <h2 id="admin-categories-heading" className="heading-sub mt-3">
          Categories · {rows.length}
        </h2>
        <p className="body-luxe mt-3 max-w-md text-sm">
          Families the storefront filters and collections use. Only families
          with an image appear in the homepage collections strip; counts are
          counted live from products.
        </p>
        <div className="mt-6 border-t border-line pt-6">
          <h3 className="eyebrow text-smoke">New family</h3>
          <div className="mt-4">
            <CreateCategoryForm formAction={createCategoryAction} />
          </div>
        </div>
      </section>

      {rows.length > 0 && (
        <section
          aria-label="Category list"
          className="surface-card overflow-x-auto"
        >
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="eyebrow px-5 py-4 text-smoke">
                  Family
                </th>
                <th scope="col" className="eyebrow px-5 py-4 text-smoke">
                  Pieces
                </th>
                <th scope="col" className="eyebrow px-5 py-4 text-smoke">
                  Rename
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => {
                const save = updateCategoryAction.bind(null, row.id);
                return (
                  <tr key={row.id}>
                    <td className="px-5 py-4 align-top">
                      <p className="font-medium text-ink">{row.name}</p>
                      <p className="mt-0.5 text-xs text-stone">{row.slug}</p>
                      {!row.imageUrl && (
                        <p className="mt-1 text-xs text-stone">
                          No image — hidden from the collections strip.
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top whitespace-nowrap text-smoke">
                      {row.activeProductCount} active · {row.productCount}{" "}
                      total
                    </td>
                    <td className="px-5 py-4">
                      <RenameCategoryForm
                        categoryId={row.id}
                        categoryName={row.name}
                        initial={{
                          name: row.name,
                          slug: row.slug,
                          blurb: row.blurb ?? "",
                          imageUrl: row.imageUrl ?? "",
                        }}
                        formAction={save}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
