"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useCart } from "@/components/cart-provider";
import { site } from "@/data/site";
import { computeTotals, resolveLines } from "@/lib/cart";
import {
  emptyCustomer,
  MEXICAN_STATES,
  type Customer,
  type FieldErrors,
} from "@/lib/customer";
import { formatMXN } from "@/lib/format";

type SubmitState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "error"; message: string }
  | { kind: "notConfigured"; message: string };

export default function CartPage() {
  const { lines, setQty, remove, ready } = useCart();
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });

  const resolved = useMemo(() => resolveLines(lines), [lines]);
  const totals = useMemo(() => computeTotals(resolved), [resolved]);
  const missingForFreeShipping = site.freeShippingFrom - totals.subtotal;

  function update(field: keyof Customer, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmit({ kind: "sending" });
    setErrors({});

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((line) => ({ slug: line.slug, qty: line.qty })),
          customer,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        fields?: FieldErrors;
        checkoutUrl?: string;
      };

      if (response.status === 422 && data.fields) {
        setErrors(data.fields);
        setSubmit({ kind: "error", message: "Revisa los campos marcados." });
        return;
      }

      if (response.status === 503) {
        setSubmit({
          kind: "notConfigured",
          message: data.message ?? "El pago en linea todavia no esta activo.",
        });
        return;
      }

      if (!response.ok || !data.checkoutUrl) {
        setSubmit({
          kind: "error",
          message: data.message ?? "No pudimos iniciar el pago. Intenta de nuevo.",
        });
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setSubmit({
        kind: "error",
        message: "Error de conexion. Revisa tu internet e intenta de nuevo.",
      });
    }
  }

  if (!ready) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-sm text-muted">Cargando tu carrito...</p>
      </div>
    );
  }

  if (resolved.length === 0) {
    return (
      <div className="container-page py-24">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold">Tu carrito esta vacio</h1>
          <p className="mt-3 text-sm text-muted">
            Todavia no agregas nada. Empieza por lo que mas se pide.
          </p>
          <Link
            href="/tienda"
            className="mt-8 inline-flex rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Ver el catalogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-black tracking-tight">Finalizar compra</h1>
      <p className="mt-2 text-sm text-muted">
        Revisa tu pedido y completa los datos de envio. El pago se procesa con Mercado
        Pago.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        {/* ---------------- Datos de envio ---------------- */}
        <div>
          <h2 className="text-lg font-bold">Datos de envio</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Nombre completo"
              value={customer.name}
              error={errors.name}
              onChange={(value) => update("name", value)}
              className="sm:col-span-2"
              autoComplete="name"
            />
            <Field
              label="Correo electronico"
              type="email"
              value={customer.email}
              error={errors.email}
              onChange={(value) => update("email", value)}
              autoComplete="email"
            />
            <Field
              label="Telefono (10 digitos)"
              type="tel"
              value={customer.phone}
              error={errors.phone}
              onChange={(value) => update("phone", value)}
              autoComplete="tel"
            />
            <Field
              label="Calle y numero"
              value={customer.street}
              error={errors.street}
              onChange={(value) => update("street", value)}
              className="sm:col-span-2"
              autoComplete="address-line1"
            />
            <Field
              label="Interior / depto (opcional)"
              value={customer.interior}
              onChange={(value) => update("interior", value)}
              autoComplete="address-line2"
            />
            <Field
              label="Colonia"
              value={customer.neighborhood}
              error={errors.neighborhood}
              onChange={(value) => update("neighborhood", value)}
            />
            <Field
              label="Ciudad o municipio"
              value={customer.city}
              error={errors.city}
              onChange={(value) => update("city", value)}
              autoComplete="address-level2"
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="state" className="text-xs font-medium text-muted">
                Estado
              </label>
              <select
                id="state"
                value={customer.state}
                onChange={(event) => update("state", event.target.value)}
                className={`rounded-lg border bg-ink-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent ${
                  errors.state ? "border-red-500" : "border-line"
                }`}
              >
                <option value="">Selecciona tu estado</option>
                {MEXICAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && <p className="text-xs text-red-400">{errors.state}</p>}
            </div>

            <Field
              label="Codigo postal"
              value={customer.zip}
              error={errors.zip}
              onChange={(value) => update("zip", value.replace(/\D/g, "").slice(0, 5))}
              inputMode="numeric"
              autoComplete="postal-code"
            />

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="notes" className="text-xs font-medium text-muted">
                Referencias de entrega (opcional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={customer.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Entre calles, color de fachada, indicaciones para el repartidor..."
                className="resize-none rounded-lg border border-line bg-ink-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent"
              />
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-line bg-surface p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Antes de pagar, ten en cuenta
            </h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-2">
              <li>
                · La entrega tarda entre {site.deliveryMin} y {site.deliveryMax} dias
                habiles. Te enviamos la guia por correo.
              </li>
              <li>
                · Revisa bien tu direccion: un dato incorrecto puede hacer que el
                paquete se pierda.
              </li>
              <li>
                · Tienes 30 dias para reportar cualquier defecto con fotos.
              </li>
            </ul>
          </div>
        </div>

        {/* ---------------- Resumen ---------------- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-6">
            <h2 className="text-base font-bold">Tu pedido</h2>

            <ul className="mt-5 divide-y divide-line">
              {resolved.map(({ product, qty, subtotal }) => (
                <li key={product.slug} className="flex gap-3.5 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-ink-2">
                    <Image
                      src={product.image}
                      alt={product.shortName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-xs font-medium leading-snug">
                      {product.shortName}
                    </span>
                    <span className="mt-0.5 text-xs text-muted-2">
                      {formatMXN(product.price)} c/u
                    </span>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-md border border-line">
                        <button
                          type="button"
                          aria-label="Quitar una unidad"
                          onClick={() => setQty(product.slug, qty - 1)}
                          className="px-2 py-0.5 text-xs text-muted transition hover:text-cream"
                        >
                          −
                        </button>
                        <span className="min-w-7 text-center text-xs">{qty}</span>
                        <button
                          type="button"
                          aria-label="Agregar una unidad"
                          onClick={() => setQty(product.slug, qty + 1)}
                          className="px-2 py-0.5 text-xs text-muted transition hover:text-cream"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold">
                          {formatMXN(subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(product.slug)}
                          className="text-[11px] text-muted-2 underline underline-offset-2 transition hover:text-accent"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatMXN(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Envio</dt>
                <dd>
                  {totals.shipping === 0 ? (
                    <span className="text-success">Gratis</span>
                  ) : (
                    formatMXN(totals.shipping)
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-bold">Total</dt>
                <dd className="font-black">{formatMXN(totals.total)}</dd>
              </div>
            </dl>

            {missingForFreeShipping > 0 && (
              <p className="mt-4 rounded-lg bg-accent-soft px-3.5 py-2.5 text-xs text-accent">
                Agrega {formatMXN(missingForFreeShipping)} mas y el envio te sale gratis.
              </p>
            )}

            <button
              type="submit"
              disabled={submit.kind === "sending"}
              className="mt-6 w-full rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submit.kind === "sending"
                ? "Iniciando pago..."
                : `Pagar ${formatMXN(totals.total)}`}
            </button>

            <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-2">
              Pago seguro procesado por Mercado Pago. Nunca vemos ni guardamos los datos
              de tu tarjeta.
            </p>

            {submit.kind === "error" && (
              <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
                {submit.message}
              </p>
            )}

            {submit.kind === "notConfigured" && (
              <div className="mt-4 rounded-lg border border-accent/40 bg-accent-soft px-3.5 py-3 text-xs leading-relaxed text-accent">
                <p className="font-semibold">El pago en linea no esta activo.</p>
                <p className="mt-1.5 text-accent/90">{submit.message}</p>
                <a
                  href={site.whatsappLink}
                  className="mt-2.5 inline-block font-semibold underline underline-offset-4"
                >
                  Escribir por WhatsApp
                </a>
              </div>
            )}
          </div>

          <Link
            href="/tienda"
            className="mt-4 block text-center text-xs text-muted transition hover:text-accent"
          >
            ← Seguir comprando
          </Link>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  className = "",
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  className?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className={`rounded-lg border bg-ink-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent ${
          error ? "border-red-500" : "border-line"
        }`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
