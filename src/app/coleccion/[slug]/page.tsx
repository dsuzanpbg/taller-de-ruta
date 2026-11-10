import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { collections, getCollection } from "@/data/collections";
import { getProductsByCollection } from "@/data/products";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);

  if (!collection) return { title: "Categoria no encontrada" };

  return {
    title: collection.title,
    description: collection.description,
    keywords: collection.keywords,
    alternates: { canonical: `/coleccion/${collection.slug}` },
    openGraph: {
      title: collection.title,
      description: collection.description,
      url: `/coleccion/${collection.slug}`,
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const collection = getCollection(slug);

  if (!collection) notFound();

  const products = getProductsByCollection(slug);
  const others = collections.filter((item) => item.slug !== slug);

  return (
    <>
      <div className="border-b border-line bg-ink-2">
        <div className="container-page py-14">
          <nav className="text-xs text-muted-2">
            <Link href="/" className="transition hover:text-accent">
              Inicio
            </Link>
            <span className="mx-2">/</span>
            <Link href="/tienda" className="transition hover:text-accent">
              Catalogo
            </Link>
            <span className="mx-2">/</span>
            <span className="text-muted">{collection.name}</span>
          </nav>

          <span className="mt-5 block text-3xl" aria-hidden="true">
            {collection.emoji}
          </span>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {collection.title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            {collection.description}
          </p>
        </div>
      </div>

      <div className="container-page py-14">
        {products.length === 0 ? (
          <p className="text-sm text-muted">
            Todavia no hay productos en esta categoria.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}

        <div className="prose-store mt-16 max-w-3xl border-t border-line pt-12">
          {collection.seoText.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-14 border-t border-line pt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Otras categorias
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {others.map((item) => (
              <Link
                key={item.slug}
                href={`/coleccion/${item.slug}`}
                className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent"
              >
                {item.emoji} {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
