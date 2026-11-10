import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-28">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-6xl font-black text-accent">404</p>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          Esta pagina no existe
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          El enlace puede estar mal escrito o el producto ya no esta disponible. Prueba
          desde el catalogo completo.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/tienda"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Ver el catalogo
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-line px-6 py-3 text-sm font-semibold transition hover:border-line-2 hover:bg-surface"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
