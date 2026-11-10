import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart";
import { ProductCard, Stars } from "@/components/product-card";
import { getCollection } from "@/data/collections";
import { getProduct, getProductSlugs, getRelatedProducts } from "@/data/products";
import { site } from "@/data/site";
import { discountPercent, formatMXN } from "@/lib/format";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) return { title: "Producto no encontrado" };

  return {
    title: product.name,
    description: product.summary,
    keywords: product.keywords,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.summary,
      url: `/producto/${product.slug}`,
      images: [{ url: product.image, alt: product.shortName }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) notFound();

  const collection = getCollection(product.collection);
  const related = getRelatedProducts(product.slug, 4);
  const off = discountPercent(product.price, product.compareAt);

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    image: [product.image],
    sku: product.slug,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      price: product.price,
      availability: product.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `/producto/${product.slug}`,
      seller: { "@type": "Organization", name: site.name },
    },
  };

  // aggregateRating solo se emite con resenas reales de clientes propios.
  // Emitirlo con datos del proveedor es enganoso y arriesga penalizacion.
  if (site.showSupplierRatings) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews,
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="container-page py-10">
        <nav className="text-xs text-muted-2">
          <Link href="/" className="transition hover:text-accent">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <Link href="/tienda" className="transition hover:text-accent">
            Catalogo
          </Link>
          {collection && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={`/coleccion/${collection.slug}`}
                className="transition hover:text-accent"
              >
                {collection.name}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          {/* ---------- Imagen ---------- */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-ink-2">
              <Image
                src={product.image}
                alt={product.shortName}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />

              {product.badge && (
                <span className="absolute left-4 top-4 rounded-md bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                  {product.badge}
                </span>
              )}
            </div>

            <p className="mt-3 text-center text-xs text-muted-2">
              Imagen ilustrativa del producto. Las fotos definitivas se publican antes
              del lanzamiento.
            </p>
          </div>

          {/* ---------- Compra ---------- */}
          <div>
            {collection && (
              <Link
                href={`/coleccion/${collection.slug}`}
                className="text-xs font-medium text-accent transition hover:text-accent-hover"
              >
                {collection.name}
              </Link>
            )}

            <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
              {product.name}
            </h1>

            {site.showSupplierRatings && (
              <div className="mt-3">
                <Stars rating={product.rating} reviews={product.reviews} />
              </div>
            )}

            <p className="mt-4 text-sm leading-relaxed text-muted">{product.summary}</p>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-black">{formatMXN(product.price)}</span>
              {product.compareAt && (
                <>
                  <span className="text-lg text-muted-2 line-through">
                    {formatMXN(product.compareAt)}
                  </span>
                  {off !== null && (
                    <span className="rounded-md bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
                      Ahorras {off}%
                    </span>
                  )}
                </>
              )}
            </div>

            <p className="mt-2 text-xs text-muted-2">
              Precio en pesos mexicanos. Envio gratis desde {formatMXN(site.freeShippingFrom)}.
            </p>

            <div className="mt-7">
              <AddToCartButton
                slug={product.slug}
                showQtyPicker
                label="Agregar al carrito"
                className="flex-1 rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
              />
            </div>

            <div className="mt-8 space-y-3 rounded-xl border border-line bg-surface p-5">
              {[
                {
                  label: "Entrega estimada",
                  value: `${site.deliveryMin} a ${site.deliveryMax} dias habiles`,
                },
                { label: "Envio", value: product.shippingNote },
                { label: "Devoluciones", value: "30 dias con fotos del defecto" },
                { label: "Pago", value: "Tarjeta de credito o debito via Mercado Pago" },
              ].map((row) => (
                <div key={row.label} className="flex gap-4 text-xs">
                  <span className="w-28 shrink-0 font-semibold text-muted">
                    {row.label}
                  </span>
                  <span className="text-muted-2">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-line bg-ink-2 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Lo que incluye
              </h2>
              <ul className="mt-3.5 space-y-2.5">
                {product.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-muted">
                    <span className="mt-0.5 shrink-0 text-accent" aria-hidden="true">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ---------- Descripcion y especificaciones ---------- */}
        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <section>
            <h2 className="text-xl font-bold tracking-tight">Descripcion</h2>
            <div className="mt-5 space-y-4">
              {product.description.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-sm leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold tracking-tight">Especificaciones</h2>
            <dl className="mt-5 divide-y divide-line border-y border-line">
              {product.specs.map((spec) => (
                <div key={spec.label} className="flex gap-6 py-3.5 text-sm">
                  <dt className="w-36 shrink-0 text-muted">{spec.label}</dt>
                  <dd className="text-cream">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* ---------- Preguntas frecuentes ---------- */}
        <section className="mt-16 max-w-3xl">
          <h2 className="text-xl font-bold tracking-tight">Preguntas frecuentes</h2>
          <div className="mt-5 divide-y divide-line border-y border-line">
            {product.faq.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold marker:content-none">
                  {item.q}
                  <span className="shrink-0 text-muted transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------- Relacionados ---------- */}
        {related.length > 0 && (
          <section className="mt-20 border-t border-line pt-14">
            <h2 className="text-xl font-bold tracking-tight">Tambien te puede servir</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.slug} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
