function img(id: string, w = 1200): string {
  return `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;
}

// Static chrome only — no catalogue data.
// Products, categories and stock live in PostgreSQL (src/db/schema.ts)
// and are read via src/lib/products.ts.

export const heroImage = img("photo-1490481651871-ab68de25d43d", 2000);

export const editorialImage = img("photo-1445205170230-053b83016050", 1400);

export const atelierImage = img("photo-1441986300917-64674bd600d8", 2000);

export const editorialTiles = [
  {
    id: "tile-atelier",
    eyebrow: "Craft",
    title: "Cut and finished by hand",
    copy: "A quiet study in proportion, stitching and polish — built to be carried for decades.",
    image: img("photo-1434389677669-e08b4cac3105", 1200),
  },
  {
    id: "tile-street",
    eyebrow: "Style",
    title: "Worn in the city",
    copy: "Soft tailoring against sharp accessories. Editorial looks styled for everyday movement.",
    image: img("photo-1483985988355-763728e1935b", 1200),
  },
];
