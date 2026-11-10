import type { Metadata } from "next";
import Link from "next/link";

import { getAllGuides } from "@/data/guides";

export const metadata: Metadata = {
  title: "Guias de accesorios para moto",
  description:
    "Guias practicas para elegir accesorios de moto: soportes sin vibracion, alforjas vs mochila, cubre moto, punos universales y mantenimiento de cadena.",
  alternates: { canonical: "/guias" },
};

export default function GuidesPage() {
  const guides = getAllGuides();

  return (
    <>
      <div className="border-b border-line bg-ink-2">
        <div className="container-page py-14">
          <nav className="text-xs text-muted-2">
            <Link href="/" className="transition hover:text-accent">
              Inicio
            </Link>
            <span className="mx-2">/</span>
            <span className="text-muted">Guias</span>
          </nav>

          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
            Guias para decidir mejor
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Escribimos lo que sabemos sobre moto de uso diario. Si un producto no te
            conviene, te lo decimos aqui antes de que lo compres.
          </p>
        </div>
      </div>

      <div className="container-page py-14">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guias/${guide.slug}`}
              className="group flex flex-col rounded-xl border border-line bg-surface p-6 transition hover:border-accent"
            >
              <span className="text-xs text-muted-2">
                {guide.readingMinutes} min de lectura
              </span>

              <h2 className="mt-3 text-base font-semibold leading-snug transition group-hover:text-accent">
                {guide.title}
              </h2>

              <p className="mt-3 flex-1 text-xs leading-relaxed text-muted">
                {guide.excerpt}
              </p>

              <span className="mt-5 text-xs font-medium text-accent">
                Leer la guia →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
