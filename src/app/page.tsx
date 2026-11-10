import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { collections } from "@/data/collections";
import { guides } from "@/data/guides";
import { getFeaturedProducts } from "@/data/products";
import { site } from "@/data/site";

const trustPoints = [
  {
    title: "Envio a todo Mexico",
    body: `Entre ${site.deliveryMin} y ${site.deliveryMax} dias habiles con guia rastreable.`,
  },
  {
    title: "Envio gratis desde $599",
    body: "En pedidos menores el envio es de $89 a cualquier estado.",
  },
  {
    title: "30 dias para devolucion",
    body: "Si el producto llega con defecto, lo reponemos o te devolvemos tu dinero.",
  },
  {
    title: "Atencion real por WhatsApp",
    body: "Te responde una persona, no un bot. Menos de 24 horas habiles.",
  },
];

const faqs = [
  {
    q: "¿Cuanto tarda mi pedido?",
    a: `Entre ${site.deliveryMin} y ${site.deliveryMax} dias habiles. Trabajamos con proveedores internacionales y te enviamos el numero de guia en cuanto se despacha, para que puedas seguir el envio en todo momento.`,
  },
  {
    q: "¿Por que el precio es mas bajo que en una tienda fisica?",
    a: "Porque no tenemos local ni inventario propio: compramos directo al proveedor cuando tu haces el pedido y te lo enviamos. Esa estructura nos deja vender mas barato. A cambio, el tiempo de entrega es mayor que el de una tienda con stock local, y preferimos decirtelo claro.",
  },
  {
    q: "¿Que pasa si mi producto llega danado o no funciona?",
    a: "Escribenos con fotos dentro de los 30 dias siguientes a la entrega. Reponemos el producto o te devolvemos el dinero. Sin discutir.",
  },
  {
    q: "¿Los productos son originales de alguna marca?",
    a: "No. Vendemos accesorios genericos de proveedores que seleccionamos por calidad y reputacion. No vendemos imitaciones ni productos con logos de marcas registradas.",
  },
  {
    q: "¿Venden cascos o refacciones de frenos?",
    a: "No, y es una decision deliberada. Los cascos y las piezas de freno son equipo de seguridad critico que requiere certificaciones y responsabilidad legal que no podemos asumir. Solo vendemos accesorios donde un fallo no pone en riesgo tu integridad.",
  },
  {
    q: "¿Puedo pagar con tarjeta?",
    a: "Si. El pago se procesa con Mercado Pago, con tarjeta de credito, debito o los medios disponibles en tu cuenta. Nunca vemos ni guardamos los datos de tu tarjeta.",
  },
];

export default function HomePage() {
  const featured = getFeaturedProducts();
  const latestGuides = guides.slice(0, 4);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-52 left-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
        />

        <div className="container-page relative py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Enviamos a todo Mexico
            </span>

            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Accesorios que aguantan
              <br />
              <span className="text-accent">el uso diario en moto</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Soportes de celular con antivibracion, bolsas impermeables, cubre moto y
              seguridad basica. Elegidos para quien usa la moto todos los dias, no para
              el domingo.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/tienda"
                className="rounded-lg bg-accent px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
              >
                Ver el catalogo
              </Link>
              <Link
                href="/coleccion/soportes-celular"
                className="rounded-lg border border-line px-7 py-3.5 text-sm font-semibold transition hover:border-line-2 hover:bg-surface"
              >
                Soportes de celular
              </Link>
            </div>

            <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
              <div>
                <dt className="text-2xl font-bold text-cream">
                  {site.deliveryMin}–{site.deliveryMax}
                </dt>
                <dd className="mt-1 text-xs text-muted">dias habiles de entrega</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-cream">30 dias</dt>
                <dd className="mt-1 text-xs text-muted">para devoluciones</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-cream">$0</dt>
                <dd className="mt-1 text-xs text-muted">envio desde $599</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ---------------- Confianza ---------------- */}
      <section className="border-b border-line bg-ink-2">
        <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point) => (
            <div key={point.title}>
              <h2 className="text-sm font-semibold text-cream">{point.title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{point.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Destacados ---------------- */}
      <section className="container-page py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Lo que mas se pide
            </h2>
            <p className="mt-2 text-sm text-muted">
              Los productos con mejor margen de calidad por lo que cuestan.
            </p>
          </div>
          <Link
            href="/tienda"
            className="text-sm font-medium text-accent transition hover:text-accent-hover"
          >
            Ver los 14 productos →
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 6).map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      {/* ---------------- Colecciones ---------------- */}
      <section className="border-y border-line bg-ink-2 py-20">
        <div className="container-page">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Compra por categoria
          </h2>
          <p className="mt-2 text-sm text-muted">
            Siete categorias para que encuentres rapido lo que necesitas.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.slug}
                href={`/coleccion/${collection.slug}`}
                className="group rounded-xl border border-line bg-surface p-6 transition hover:border-accent"
              >
                <span className="text-2xl" aria-hidden="true">
                  {collection.emoji}
                </span>
                <h3 className="mt-3 text-base font-semibold transition group-hover:text-accent">
                  {collection.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                  {collection.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Angulo repartidor ---------------- */}
      <section className="container-page py-20">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-12">
              <span className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                Para repartidores
              </span>

              <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
                Si vives sobre la moto, el equipo tiene que aguantar
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-muted">
                Un turno completo son ocho horas de vibracion, sol y baches. Los
                accesorios que vendemos estan elegidos con ese uso en mente: que el
                telefono no se mueva, que el cable no se desconecte y que la carga no se
                caiga.
              </p>

              <ul className="mt-7 space-y-3.5">
                {[
                  "Soporte con amortiguacion y sujetador de cable incluido",
                  "Red elastica para el casco y la carga del dia",
                  "Candado de disco con cable recordatorio para no arrancar con el puesto",
                  "Cubre moto con hebilla antiviento si duerme en la calle",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-muted">
                    <span className="mt-0.5 text-accent" aria-hidden="true">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/guias/accesorios-para-repartidor-en-moto"
                className="mt-9 inline-flex rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
              >
                Ver el kit completo para repartidor
              </Link>
            </div>

            <div className="relative min-h-64 border-t border-line bg-ink-2 lg:border-l lg:border-t-0">
              <div className="flex h-full flex-col justify-center gap-5 p-8 sm:p-12">
                {[
                  {
                    stat: "1 de cada 3",
                    label:
                      "repartidores reporta que su cable de carga se desconecta en el trayecto",
                  },
                  {
                    stat: "La vibracion",
                    label:
                      "es la causa principal de que un soporte barato se afloje o gire solo",
                  },
                  {
                    stat: "El cable recordatorio",
                    label:
                      "evita el error mas caro: arrancar con el candado de disco puesto",
                  },
                ].map((item) => (
                  <div key={item.stat} className="rounded-xl border border-line bg-surface p-5">
                    <p className="text-base font-bold text-accent">{item.stat}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Guias ---------------- */}
      <section className="border-y border-line bg-ink-2 py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Guias para decidir mejor
              </h2>
              <p className="mt-2 text-sm text-muted">
                Escribimos lo que sabemos. Si un producto no te conviene, te lo decimos.
              </p>
            </div>
            <Link
              href="/guias"
              className="text-sm font-medium text-accent transition hover:text-accent-hover"
            >
              Ver todas las guias →
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {latestGuides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guias/${guide.slug}`}
                className="group rounded-xl border border-line bg-surface p-6 transition hover:border-accent"
              >
                <span className="text-xs text-muted-2">
                  {guide.readingMinutes} min de lectura
                </span>
                <h3 className="mt-2.5 text-base font-semibold leading-snug transition group-hover:text-accent">
                  {guide.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                  {guide.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Preguntas frecuentes
          </h2>
          <p className="mt-2 text-sm text-muted">
            Lo que nos preguntan antes de comprar, respondido sin rodeos.
          </p>

          <div className="mt-10 divide-y divide-line border-y border-line">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold marker:content-none">
                  {faq.q}
                  <span className="shrink-0 text-muted transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{faq.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-line bg-surface p-6 text-center">
            <p className="text-sm text-muted">
              ¿Tienes otra duda?{" "}
              <Link
                href="/contacto"
                className="font-medium text-accent underline underline-offset-4"
              >
                Escribenos
              </Link>{" "}
              y te respondemos en menos de 24 horas habiles.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
