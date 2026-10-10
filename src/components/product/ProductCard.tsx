import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { stockState } from "@/lib/stock";
import type { Product } from "@/types";

export function ProductCard({
  product,
  index,
}: {
  product: Product;
  index?: number;
}) {
  // Derived from quantity only — same stockState() the detail page and
  // admin list use. In-stock pieces stay badge-free (imagery first).
  const stock = stockState(product.stockQuantity);
  const showStockBadge = stock.status !== "in";
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col bg-canvas"
      aria-label={
        showStockBadge ? `${product.name}, ${stock.label}` : product.name
      }
    >
      <div className="img-frame">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] ${stock.status === "out" ? "opacity-60" : ""}`}
        />
        {product.tag ? (
          <span className="eyebrow absolute top-3 left-3 border border-line bg-canvas px-2.5 py-1.5 text-ink">
            {product.tag}
          </span>
        ) : null}
        {showStockBadge ? (
          <span
            className={`eyebrow absolute top-3 right-3 border px-2.5 py-1.5 ${
              stock.status === "out"
                ? "border-ink bg-ink text-ivory"
                : "border-line bg-canvas text-heritage"
            }`}
          >
            {stock.label}
          </span>
        ) : null}
      </div>
      <div className="product-card-body">
        <p className="eyebrow text-smoke">
          {typeof index === "number"
            ? `N.${String(index + 1).padStart(2, "0")} — ${product.category}`
            : product.category}
        </p>
        <h3 className="product-card-name text-ink decoration-1 underline-offset-4 group-hover:underline">
          {product.name}
        </h3>
        <p className="product-card-price">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
