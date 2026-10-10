import "dotenv/config";

import { db } from "../src/db";
import { cartItems, carts, categories, orderItems, orders, products, stripeEvents } from "../src/db/schema";

function img(id: string, w = 1200): string {
  return `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;
}

const CATEGORY_SEED = [
  {
    name: "Handbags",
    slug: "handbags",
    blurb: "Structured silhouettes in grained leather",
    imageUrl: img("photo-1548036328-c9fa89d128fa", 1000),
  },
  {
    name: "Footwear",
    slug: "footwear",
    blurb: "Sculpted heels and polished loafers",
    imageUrl: img("photo-1543163521-1bf539c55dd2", 1000),
  },
  {
    name: "Eyewear",
    slug: "eyewear",
    blurb: "Silk, gold accents and dark acetate",
    imageUrl: img("photo-1511499767150-a48a237f0083", 1000),
  },
  { name: "Watches", slug: "watches", blurb: null, imageUrl: null },
  {
    name: "Ready-to-Wear",
    slug: "ready-to-wear",
    blurb: null,
    imageUrl: null,
  },
] as const;

const COPY: Record<string, { description: string; material: string }> = {
  Handbags: {
    description:
      "Grained calf leather with hand-painted edges and a soft cotton-twill lining. Carried by the top handle or worn over the shoulder — structured, balanced, quiet.",
    material: "Grained calf leather, twill lining",
  },
  Footwear: {
    description:
      "Cut on a sculpted last with a polished sole and cushioned insole. A sharp profile with a soft step — made for long days in the city.",
    material: "Polished calf leather, leather sole",
  },
  Watches: {
    description:
      "A restrained dial with polished hands and a brushed case. Quiet on the wrist, precise in the movement — an everyday heirloom.",
    material: "Brushed steel, gold accents",
  },
  Eyewear: {
    description:
      "Dark acetate, hand-polished, with nylon lenses for full sun protection. A soft square profile that suits most faces.",
    material: "Hand-polished acetate, nylon lenses",
  },
  "Ready-to-Wear": {
    description:
      "Cut with restraint and finished by hand — natural fibres, soft shoulders, clean seams. Worn with ease, kept for decades.",
    material: "Natural fibres, tailored finish",
  },
};

type SeedProduct = {
  name: string;
  slug: string;
  category: string;
  priceCents: number;
  imageUrl: string;
  tag: string | null;
  stockQuantity: number;
  isFeatured: boolean;
};

// Mirrors the previous sample catalogue: 8 featured + 8 more = 16.
// Stock mixes in (>3), low (1-3) and out (0) to exercise all badges.
const PRODUCT_SEED: SeedProduct[] = [
  { name: "Structured Leather Tote", slug: "structured-leather-tote", category: "Handbags", priceCents: 248000, imageUrl: img("photo-1584917865442-de89df76afd3", 900), tag: "Icon", stockQuantity: 12, isFeatured: true },
  { name: "Chain Shoulder Bag", slug: "chain-shoulder-bag", category: "Handbags", priceCents: 198000, imageUrl: img("photo-1591561954557-26941169b49e", 900), tag: null, stockQuantity: 2, isFeatured: true },
  { name: "Sculpted Leather Heel", slug: "sculpted-leather-heel", category: "Footwear", priceCents: 89000, imageUrl: img("photo-1543163521-1bf539c55dd2", 900), tag: "New", stockQuantity: 9, isFeatured: true },
  { name: "Court Sneaker in Ivory", slug: "court-sneaker-ivory", category: "Footwear", priceCents: 75000, imageUrl: img("photo-1560343090-f0409e92791a", 900), tag: null, stockQuantity: 0, isFeatured: true },
  { name: "Gold Tone Dress Watch", slug: "gold-tone-dress-watch", category: "Watches", priceCents: 165000, imageUrl: img("photo-1523170335258-f5ed11844a49", 900), tag: "Icon", stockQuantity: 6, isFeatured: true },
  { name: "Dark Acetate Sunglass", slug: "dark-acetate-sunglass", category: "Eyewear", priceCents: 42000, imageUrl: img("photo-1511499767150-a48a237f0083", 900), tag: null, stockQuantity: 1, isFeatured: true },
  { name: "Tailored Wool Blazer", slug: "tailored-wool-blazer", category: "Ready-to-Wear", priceCents: 189000, imageUrl: img("photo-1594938298603-c8148c4dae35", 900), tag: "New", stockQuantity: 7, isFeatured: true },
  { name: "Grained Leather Backpack", slug: "grained-leather-backpack", category: "Handbags", priceCents: 132000, imageUrl: img("photo-1553062407-98eeb64c6a62", 900), tag: null, stockQuantity: 10, isFeatured: true },
  { name: "Polished Leather Loafer", slug: "polished-leather-loafer", category: "Footwear", priceCents: 82000, imageUrl: img("photo-1549298916-b41d501d3772", 900), tag: null, stockQuantity: 0, isFeatured: false },
  { name: "Field Jacket in Canvas", slug: "field-jacket-canvas", category: "Ready-to-Wear", priceCents: 145000, imageUrl: img("photo-1591047139829-d91aecb6caea", 900), tag: "New", stockQuantity: 6, isFeatured: false },
  { name: "Soft Leather Jacket", slug: "soft-leather-jacket", category: "Ready-to-Wear", priceCents: 210000, imageUrl: img("photo-1551028719-00167b16eac5", 900), tag: null, stockQuantity: 4, isFeatured: false },
  { name: "Minimal Steel Watch", slug: "minimal-steel-watch", category: "Watches", priceCents: 118000, imageUrl: img("photo-1524805444758-089113d48a6d", 900), tag: null, stockQuantity: 2, isFeatured: false },
  { name: "Round Gold Sunglass", slug: "round-gold-sunglass", category: "Eyewear", priceCents: 38500, imageUrl: img("photo-1572635196237-14b3f281503f", 900), tag: "New", stockQuantity: 9, isFeatured: false },
  { name: "Blush Leather Handbag", slug: "blush-leather-handbag", category: "Handbags", priceCents: 174000, imageUrl: img("photo-1566150905458-1bf1fc113f0d", 900), tag: null, stockQuantity: 7, isFeatured: false },
  { name: "Canvas Travel Backpack", slug: "canvas-travel-backpack", category: "Handbags", priceCents: 98000, imageUrl: img("photo-1491637639811-60e2756cc1c7", 900), tag: null, stockQuantity: 12, isFeatured: false },
  { name: "Double-Faced Wool Coat", slug: "double-faced-wool-coat", category: "Ready-to-Wear", priceCents: 229000, imageUrl: img("photo-1539109136881-3be0616acf4b", 900), tag: "Icon", stockQuantity: 5, isFeatured: false },
];

async function main() {
  // Idempotent: clear in FK order (webhook ledger -> order lines -> orders ->
  // bag lines -> carts -> products -> categories) so re-seeding never orphans
  // rows or trips the order_items -> products restrict FK.
  await db.delete(stripeEvents);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(cartItems);
  await db.delete(carts);
  await db.delete(products);
  await db.delete(categories);

  const insertedCategories = await db
    .insert(categories)
    .values(
      CATEGORY_SEED.map((c) => ({
        name: c.name,
        slug: c.slug,
        blurb: c.blurb,
        imageUrl: c.imageUrl,
      })),
    )
    .returning({ id: categories.id, slug: categories.slug });

  const idBySlug = new Map<string, string>(
    insertedCategories.map((c) => [c.slug, c.id]),
  );
  const slugByName = new Map<string, string>(
    CATEGORY_SEED.map((c) => [c.name, c.slug]),
  );

  // Backdate createdAt from a fixed base so ordering is reproducible.
  const base = new Date("2026-09-01T12:00:00.000Z").getTime();

  await db.insert(products).values(
    PRODUCT_SEED.map((p, i) => {
      const categorySlug = slugByName.get(p.category)!;
      const categoryId = idBySlug.get(categorySlug)!;
      const copy = COPY[p.category]!;
      return {
        name: p.name,
        slug: p.slug,
        description: copy.description,
        material: copy.material,
        categoryId,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl,
        tag: p.tag,
        stockQuantity: p.stockQuantity,
        isFeatured: p.isFeatured,
        isActive: true,
        createdAt: new Date(base - i * 24 * 60 * 60 * 1000),
      };
    }),
  );

  console.log(
    `Seeded ${CATEGORY_SEED.length} categories, ${PRODUCT_SEED.length} products.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
