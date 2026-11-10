import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart";
import { site } from "@/data/site";
import type { Product } from "@/lib/types";
import { discountPercent, formatMXN } from "@/lib/format";

/**
 * Estrellas de valoracion.
 *
 * Devuelve null mientras site.showSupplierRatings sea false, porque los datos
 * actuales vienen del proveedor y no de clientes de la tienda. Ver el
 * comentario en src/data/site.ts.
 */
export function Stars({ rating, reviews }: { rating: number; reviews: number }) {
  if (!site.showSupplierRatings) return null;

  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted">
      <span className="text-accent" aria-hidden="true">
        {"★".repeat(rounded)}
        <span className="text-line-2">{"★".repeat(5 - rounded)}</span>
      </span>
      <span>
        {rating.toFixed(1)} ({reviews})
      </span>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product.price, product.compareAt);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:border-line-2">
      <Link
        href={`/producto/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-ink-2"
      >
        <Image
          src={product.image}
          alt={product.shortName}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />

        {product.badge && (
          <span className="absolute left-3 top-3 rounded-md bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {product.badge}
          </span>
        )}

        {off !== null && (
          <span className="absolute right-3 top-3 rounded-md bg-ink/85 px-2 py-1 text-[11px] font-bold text-success backdrop-blur">
            −{off}%
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/producto/${product.slug}`}>
          <h3 className="text-sm font-semibold leading-snug transition group-hover:text-accent">
            {product.shortName}
          </h3>
        </Link>

        {site.showSupplierRatings && (
          <div className="mt-2">
            <Stars rating={product.rating} reviews={product.reviews} />
          </div>
        )}

        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
          {product.summary}
        </p>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-lg font-bold">{formatMXN(product.price)}</span>
          {product.compareAt && (
            <span className="text-sm text-muted-2 line-through">
              {formatMXN(product.compareAt)}
            </span>
          )}
        </div>

        <div className="mt-4 pt-1">
          <AddToCartButton
            slug={product.slug}
            label="Agregar"
            className="w-full rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:bg-accent hover:text-white"
          />
        </div>
      </div>
    </article>
  );
}
