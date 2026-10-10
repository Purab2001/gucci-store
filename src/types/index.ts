// Shared storefront types.
// Product is the mapped UI shape: price is dollars (priceCents / 100 in mapProduct),
// category is the display name resolved via join. DB rows live in src/db/schema.ts.

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  category: string;
  categorySlug: string;
  tag?: string | null;
  stockQuantity: number;
  description?: string | null;
  material?: string | null;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  blurb: string;
  image: string;
}
