"use client";

import { useActionState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import type {
  AdminProductFormState,
} from "@/lib/admin-actions";
import type { AdminCategoryOption } from "@/lib/admin-products";

export interface ProductFormInitial {
  name: string;
  slug: string;
  description: string;
  material: string;
  categoryId: string;
  priceDollars: string;
  imageUrl: string;
  tag: string;
  stockQuantity: string;
  isFeatured: boolean;
  isActive: boolean;
}

const INITIAL_STATE: AdminProductFormState = {
  ok: false,
  message: "",
  fieldErrors: {},
};

const inputBase =
  "h-12 w-full border bg-canvas px-4 text-sm text-ink placeholder:text-stone focus:outline-none transition-colors";
const inputIdle = "border-line focus:border-ink";
const inputError = "border-heritage focus:border-heritage";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs leading-relaxed text-heritage">{message}</p>
  );
}

/**
 * Shared create/edit form. Dollars in, cents in the DB — conversion and
 * all validation happen server-side in admin-actions.ts; this form only
 * mirrors the errors back under each field.
 */
export function ProductForm({
  mode,
  categories,
  initial,
  formAction,
}: {
  mode: "create" | "edit";
  categories: AdminCategoryOption[];
  initial: ProductFormInitial;
  formAction: (
    prevState: AdminProductFormState,
    formData: FormData,
  ) => Promise<AdminProductFormState>;
}) {
  const [state, action, isPending] = useActionState(formAction, INITIAL_STATE);
  const errors = state.fieldErrors;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.message && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-heritage/30 bg-ivory px-4 py-3 text-sm leading-relaxed text-heritage"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{state.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-name" className="eyebrow text-smoke">
            Name
          </label>
          <input
            id="product-name"
            name="name"
            type="text"
            required
            maxLength={120}
            placeholder="Structured Leather Tote"
            defaultValue={initial.name}
            aria-invalid={Boolean(errors.name)}
            className={`${inputBase} ${errors.name ? inputError : inputIdle}`}
          />
          <FieldError message={errors.name} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-slug" className="eyebrow text-smoke">
            Slug
          </label>
          <input
            id="product-slug"
            name="slug"
            type="text"
            maxLength={100}
            placeholder={
              mode === "create"
                ? "Auto from name if left blank"
                : "structured-leather-tote"
            }
            defaultValue={initial.slug}
            aria-invalid={Boolean(errors.slug)}
            aria-describedby="product-slug-hint"
            className={`${inputBase} ${errors.slug ? inputError : inputIdle}`}
          />
          <p id="product-slug-hint" className="text-xs leading-relaxed text-stone">
            Public URL identifier. Lowercase letters, numbers, hyphens.
          </p>
          <FieldError message={errors.slug} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-category" className="eyebrow text-smoke">
            Category
          </label>
          <select
            id="product-category"
            name="categoryId"
            required
            defaultValue={initial.categoryId}
            aria-invalid={Boolean(errors.categoryId)}
            className={`${inputBase} ${errors.categoryId ? inputError : inputIdle}`}
          >
            <option value="">Choose a family…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.categoryId} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-price" className="eyebrow text-smoke">
            Price (USD)
          </label>
          <input
            id="product-price"
            name="priceDollars"
            type="text"
            required
            inputMode="decimal"
            placeholder="1290.00"
            defaultValue={initial.priceDollars}
            aria-invalid={Boolean(errors.priceDollars)}
            className={`${inputBase} ${errors.priceDollars ? inputError : inputIdle}`}
          />
          <FieldError message={errors.priceDollars} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="product-image" className="eyebrow text-smoke">
          Image URL
        </label>
        <input
          id="product-image"
          name="imageUrl"
          type="url"
          required
          maxLength={2048}
          placeholder="https://…"
          defaultValue={initial.imageUrl}
          aria-invalid={Boolean(errors.imageUrl)}
          className={`${inputBase} ${errors.imageUrl ? inputError : inputIdle}`}
        />
        <FieldError message={errors.imageUrl} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-tag" className="eyebrow text-smoke">
            Tag <span className="font-normal normal-case">(optional)</span>
          </label>
          <input
            id="product-tag"
            name="tag"
            type="text"
            maxLength={32}
            placeholder="Icon, New…"
            defaultValue={initial.tag}
            aria-invalid={Boolean(errors.tag)}
            className={`${inputBase} ${errors.tag ? inputError : inputIdle}`}
          />
          <FieldError message={errors.tag} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-stock" className="eyebrow text-smoke">
            Stock quantity
          </label>
          <input
            id="product-stock"
            name="stockQuantity"
            type="number"
            required
            min={0}
            max={999999}
            step={1}
            defaultValue={initial.stockQuantity}
            aria-invalid={Boolean(errors.stockQuantity)}
            className={`${inputBase} ${errors.stockQuantity ? inputError : inputIdle}`}
          />
          <FieldError message={errors.stockQuantity} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="product-description" className="eyebrow text-smoke">
          Description <span className="font-normal normal-case">(optional)</span>
        </label>
        <textarea
          id="product-description"
          name="description"
          rows={4}
          maxLength={5000}
          placeholder="Cut, cloth, finish — a sentence or two."
          defaultValue={initial.description}
          aria-invalid={Boolean(errors.description)}
          className={`min-h-28 w-full border bg-canvas px-4 py-3 text-sm text-ink placeholder:text-stone focus:outline-none transition-colors ${errors.description ? inputError : inputIdle}`}
        />
        <FieldError message={errors.description} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="product-material" className="eyebrow text-smoke">
          Material <span className="font-normal normal-case">(optional)</span>
        </label>
        <input
          id="product-material"
          name="material"
          type="text"
          maxLength={500}
          placeholder="Grained calf leather…"
          defaultValue={initial.material}
          aria-invalid={Boolean(errors.material)}
          className={`${inputBase} ${errors.material ? inputError : inputIdle}`}
        />
        <FieldError message={errors.material} />
      </div>

      <fieldset className="flex flex-col gap-3 border border-line bg-ivory px-4 py-4">
        <legend className="eyebrow px-1 text-smoke">Availability</legend>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={initial.isActive}
            className="mt-1 size-4 shrink-0 accent-[#1a1a18]"
          />
          <span>
            Active — visible on the storefront
            <span className="block text-xs text-stone">
              Uncheck to retire the piece. Retired pieces stay in order
              history instead of being deleted.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={initial.isFeatured}
            className="mt-1 size-4 shrink-0 accent-[#1a1a18]"
          />
          <span>
            Featured — shown on the homepage
            <span className="block text-xs text-stone">
              Homepage renders active featured pieces, newest first.
            </span>
          </span>
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary w-full sm:w-auto"
      >
        {isPending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : mode === "create" ? (
          "Create product"
        ) : (
          "Save changes"
        )}
      </button>
    </form>
  );
}
