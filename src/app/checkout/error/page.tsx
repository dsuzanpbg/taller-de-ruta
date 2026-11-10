import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "No se completo el pago",
  robots: { index: false, follow: false },
};

export default function CheckoutErrorPage() {
  return (
    <div className="container-page py-24">
      <div className="mx-auto max-w-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-2xl text-red-400">
          !
        </div>

        <h1 className="mt-6 text-3xl font-black tracking-tight">
          No se completo el pago
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          Tu pedido no se cobro y no se genero ninguna compra. Puede haber sido un
          rechazo del banco, un dato incorrecto de la tarjeta o que cerraste la ventana
          antes de terminar.
        </p>

        <div className="mt-8 rounded-xl border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold">Que puedes hacer</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex gap-3">
              <span className="text-accent">·</span>
              <span>
                Tu carrito sigue guardado. Puedes intentar el pago de nuevo con otra
                tarjeta o metodo.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent">·</span>
              <span>
                Verifica que el nombre y la direccion coincidan con los datos de tu
                tarjeta.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent">·</span>
              <span>
                Si el problema continua, escribenos por WhatsApp y cerramos el pedido
                contigo directamente.
              </span>
            </li>
          </ul>

          <a
            href={site.whatsappLink}
            className="mt-5 inline-block text-sm font-semibold text-accent underline underline-offset-4"
          >
            Escribir por WhatsApp
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/carrito"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Intentar de nuevo
          </Link>
          <Link
            href="/tienda"
            className="rounded-lg border border-line px-6 py-3 text-sm font-semibold transition hover:border-line-2 hover:bg-surface"
          >
            Volver al catalogo
          </Link>
        </div>
      </div>
    </div>
  );
}
