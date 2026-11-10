import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { getAllGuides, getGuide } from "@/data/guides";
import { getProduct } from "@/data/products";
import { site } from "@/data/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) return { title: "Guia no encontrada" };

  return {
    title: guide.title,
    description: guide.description,
    keywords: [guide.keyword],
    alternates: { canonical: `/guias/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: `/guias/${guide.slug}`,
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) notFound();

  const relatedProducts = guide.relatedProducts
    .map((productSlug) => getProduct(productSlug))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  const otherGuides = getAllGuides()
    .filter((item) => item.slug !== guide.slug)
    .slice(0, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.updated,
    dateModified: guide.updated,
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    mainEntityOfPage: `/guias/${guide.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="container-page py-14">
        <nav className="text-xs text-muted-2">
          <Link href="/" className="transition hover:text-accent">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <Link href="/guias" className="transition hover:text-accent">
            Guias
          </Link>
        </nav>

        <header className="mt-8 max-w-3xl">
          <span className="text-xs text-muted-2">
            {guide.readingMinutes} min de lectura · Actualizado el {guide.updated}
          </span>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">{guide.excerpt}</p>
        </header>

        <div className="prose-store mt-12 max-w-3xl">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t border-line pt-12">
            <h2 className="text-xl font-bold tracking-tight">
              Productos relacionados con esta guia
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-16 border-t border-line pt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Sigue leyendo
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {otherGuides.map((item) => (
              <Link
                key={item.slug}
                href={`/guias/${item.slug}`}
                className="group rounded-xl border border-line bg-surface p-5 transition hover:border-accent"
              >
                <h3 className="text-sm font-semibold leading-snug transition group-hover:text-accent">
                  {item.title}
                </h3>
                <span className="mt-3 block text-xs text-muted-2">
                  {item.readingMinutes} min
                </span>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </>
  );
}
