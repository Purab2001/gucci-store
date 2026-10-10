"use client";

import { useActionState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import type { AdminCategoryFormState } from "@/lib/admin-actions";

const INITIAL_STATE: AdminCategoryFormState = {
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

type FormAction = (
  prevState: AdminCategoryFormState,
  formData: FormData,
) => Promise<AdminCategoryFormState>;

function CategoryFields({
  initial,
  errors,
  idPrefix,
}: {
  initial: { name: string; slug: string; blurb: string; imageUrl: string };
  errors: Record<string, string>;
  idPrefix: string;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-name`} className="eyebrow text-smoke">
            Name
          </label>
          <input
            id={`${idPrefix}-name`}
            name="name"
            type="text"
            required
            maxLength={80}
            placeholder="Handbags"
            defaultValue={initial.name}
            aria-invalid={Boolean(errors.name)}
            className={`${inputBase} ${errors.name ? inputError : inputIdle}`}
          />
          <FieldError message={errors.name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-slug`} className="eyebrow text-smoke">
            Slug
          </label>
          <input
            id={`${idPrefix}-slug`}
            name="slug"
            type="text"
            maxLength={100}
            placeholder="Auto from name if left blank"
            defaultValue={initial.slug}
            aria-invalid={Boolean(errors.slug)}
            className={`${inputBase} ${errors.slug ? inputError : inputIdle}`}
          />
          <FieldError message={errors.slug} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-blurb`} className="eyebrow text-smoke">
          Blurb <span className="font-normal normal-case">(optional)</span>
        </label>
        <input
          id={`${idPrefix}-blurb`}
          name="blurb"
          type="text"
          maxLength={500}
          placeholder="Structured silhouettes in grained leather"
          defaultValue={initial.blurb}
          aria-invalid={Boolean(errors.blurb)}
          className={`${inputBase} ${errors.blurb ? inputError : inputIdle}`}
        />
        <FieldError message={errors.blurb} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-image`} className="eyebrow text-smoke">
          Image URL{" "}
          <span className="font-normal normal-case">
            (optional — collections strip only shows families with an image)
          </span>
        </label>
        <input
          id={`${idPrefix}-image`}
          name="imageUrl"
          type="url"
          maxLength={2048}
          placeholder="https://images.unsplash.com/…"
          defaultValue={initial.imageUrl}
          aria-invalid={Boolean(errors.imageUrl)}
          className={`${inputBase} ${errors.imageUrl ? inputError : inputIdle}`}
        />
        <FieldError message={errors.imageUrl} />
      </div>
    </>
  );
}

/** Inline create-family form at the top of the categories console. */
export function CreateCategoryForm({ formAction }: { formAction: FormAction }) {
  const [state, action, isPending] = useActionState(
    formAction,
    INITIAL_STATE,
  );
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
      <CategoryFields
        initial={{ name: "", slug: "", blurb: "", imageUrl: "" }}
        errors={state.fieldErrors}
        idPrefix="category-new"
      />
      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary w-full sm:w-auto"
      >
        {isPending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Creating…
          </>
        ) : (
          "Create category"
        )}
      </button>
    </form>
  );
}

/** Per-row rename form inside the category list. */
export function RenameCategoryForm({
  categoryId,
  categoryName,
  initial,
  formAction,
}: {
  categoryId: string;
  categoryName: string;
  initial: { name: string; slug: string; blurb: string; imageUrl: string };
  formAction: (
    prevState: AdminCategoryFormState,
    formData: FormData,
  ) => Promise<AdminCategoryFormState>;
}) {
  const [state, action, isPending] = useActionState(
    formAction,
    INITIAL_STATE,
  );
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.message && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-heritage/30 bg-ivory px-4 py-3 text-sm leading-relaxed text-heritage"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{state.message}</p>
        </div>
      )}
      <CategoryFields
        initial={initial}
        errors={state.fieldErrors}
        idPrefix={`category-${categoryId}`}
      />
      <button
        type="submit"
        disabled={isPending}
        className="link-luxe self-start text-xs text-ink disabled:opacity-45"
        aria-label={`Save ${categoryName}`}
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
