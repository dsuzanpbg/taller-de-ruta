import type { Metadata } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { collections } from "@/data/collections";
import { getAllProducts } from "@/data/products";

export const metadata: Metadata = {
  title: "Catalogo completo de accesorios para moto",
  description:
    "Los 14 accesorios para moto que vendemos: soportes de celular, alforjas, cubre moto, punos, candados, mantenimiento y stickers. Envio a todo Mexico.",
  alternates: { canonical: "/tienda" },
};

const roleLabels: Record<string, string> = {
  hero: "Mas pedido",
  catalogo: "Catalogo",
  upsell: "Complemento",
};

export default function TiendaPage() {
  const products = getAllProducts();

  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Catalogo de accesorios para moto",
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.name,
      url: `/producto/${product.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd) }}
      />

      <div className="border-b border-line bg-ink-2">
        <div className="container-page py-14">
          <nav className="text-xs text-muted-2">
            <Link href="/" className="transition hover:text-accent">
              Inicio
            </Link>
            <span className="mx-2">/</span>
            <span className="text-muted">Catalogo</span>
          </nav>

          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
            Catalogo completo
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            {products.length} accesorios para moto diaria, organizados por categoria.
            Todo lo que vendemos resiste uso urbano constante: nada de productos que se
            rompen al tercer dia.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {collections.map((collection) => (
              <Link
                key={collection.slug}
                href={`/coleccion/${collection.slug}`}
                className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent"
              >
                {collection.emoji} {collection.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container-page py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div key={product.slug} className="flex flex-col">
              <ProductCard product={product} />
              <p className="mt-2 px-1 text-[11px] text-muted-2">
                {roleLabels[product.role]} · {product.shippingNote}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
