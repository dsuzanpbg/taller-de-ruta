import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Pago en revision",
  robots: { index: false, follow: false },
};

export default function CheckoutPendingPage() {
  return (
    <div className="container-page py-24">
      <div className="mx-auto max-w-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-2xl text-accent">
          ⏱
        </div>

        <h1 className="mt-6 text-3xl font-black tracking-tight">
          Tu pago esta en revision
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          Mercado Pago esta procesando tu pago. Esto pasa con pagos en efectivo, con
          transferencias o cuando el banco necesita verificar la operacion.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          <strong className="text-cream">Tu pedido esta reservado.</strong> En cuanto el
          pago se confirme, te avisamos por correo y comenzamos el despacho. Si el pago
          no se completa, no se te cobra nada.
        </p>

        <div className="mt-8 rounded-xl border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold">Si pagaste en efectivo</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Recuerda completar el pago en el punto que elegiste. Los pagos en efectivo
            suelen tardar unas horas en confirmarse despues de que pagas.
          </p>
        </div>

        <p className="mt-8 text-sm text-muted">
          ¿Dudas sobre tu pedido?{" "}
          <Link href="/contacto" className="font-medium text-accent underline underline-offset-4">
            Escribenos
          </Link>{" "}
          o mandanos un mensaje por{" "}
          <a
            href={site.whatsappLink}
            className="font-medium text-accent underline underline-offset-4"
          >
            WhatsApp
          </a>
          .
        </p>

        <Link
          href="/tienda"
          className="mt-8 inline-flex rounded-lg border border-line px-6 py-3 text-sm font-semibold transition hover:border-line-2 hover:bg-surface"
        >
          Volver al catalogo
        </Link>
      </div>
    </div>
  );
}
