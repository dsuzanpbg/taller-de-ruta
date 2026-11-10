import type { Metadata } from "next";
import Link from "next/link";

import { ClearCart } from "@/components/clear-cart";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Gracias por tu compra",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const paymentId = firstValue(params.payment_id);
  const reference = firstValue(params.external_reference);

  return (
    <div className="container-page py-24">
      <ClearCart />

      <div className="mx-auto max-w-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-2xl text-success">
          ✓
        </div>

        <h1 className="mt-6 text-3xl font-black tracking-tight">
          Gracias por tu compra
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          Tu pago fue aprobado. Te enviamos la confirmacion por correo y en las proximas
          horas habiles recibiras el numero de guia para seguir tu envio.
        </p>

        {(paymentId || reference) && (
          <dl className="mt-8 space-y-3 rounded-xl border border-line bg-surface p-6 text-sm">
            {reference && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Numero de orden</dt>
                <dd className="font-mono font-semibold">{reference}</dd>
              </div>
            )}
            {paymentId && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">ID de pago</dt>
                <dd className="font-mono">{paymentId}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-8 rounded-xl border border-line bg-ink-2 p-6">
          <h2 className="text-sm font-semibold">Que sigue</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex gap-3">
              <span className="text-accent">1.</span>
              <span>
                Confirmamos tu pedido con el proveedor. Esto toma de 1 a 2 dias habiles.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent">2.</span>
              <span>
                Te enviamos el numero de guia por correo en cuanto se despacha.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent">3.</span>
              <span>
                Llega entre {site.deliveryMin} y {site.deliveryMax} dias habiles despues
                del despacho.
              </span>
            </li>
          </ol>
        </div>

        <p className="mt-8 text-sm text-muted">
          ¿Alguna duda con tu pedido?{" "}
          <Link href="/contacto" className="font-medium text-accent underline underline-offset-4">
            Escribenos
          </Link>{" "}
          con tu numero de orden y te respondemos en menos de 24 horas habiles.
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
