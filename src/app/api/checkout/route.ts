import { NextResponse } from "next/server";

import { computeTotals, normalizeLines, resolveLines } from "@/lib/cart";
import { validateCustomer } from "@/lib/customer";

export const runtime = "nodejs";

const MP_PREFERENCES_URL = "https://api.mercadopago.com/checkout/preferences";

type MpPreference = {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
};

function buildOrderReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TDR-${stamp}-${random}`;
}

export async function POST(request: Request) {
  // ---- 1. Leer el cuerpo -------------------------------------------------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud invalida." }, { status: 400 });
  }

  const payload = (body ?? {}) as { lines?: unknown; customer?: unknown };

  // ---- 2. Validar carrito contra el catalogo del servidor ----------------
  const lines = normalizeLines(payload.lines);
  const resolved = resolveLines(lines);

  if (resolved.length === 0) {
    return NextResponse.json(
      { error: "Tu carrito esta vacio o los productos ya no estan disponibles." },
      { status: 400 },
    );
  }

  const totals = computeTotals(resolved);

  // ---- 3. Validar datos del cliente --------------------------------------
  const { customer, errors } = validateCustomer(payload.customer);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Revisa los datos del formulario.", fields: errors },
      { status: 422 },
    );
  }

  // ---- 4. Verificar configuracion de pago --------------------------------
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      {
        error: "not_configured",
        message:
          "El pago con tarjeta todavia no esta activo en esta tienda. Escribenos por WhatsApp y cerramos tu pedido a mano.",
      },
      { status: 503 },
    );
  }

  // ---- 5. Construir la preferencia de pago -------------------------------
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  ).replace(/\/$/, "");

  const isHttps = siteUrl.startsWith("https://");
  const orderReference = buildOrderReference();

  const address = [
    customer.street,
    customer.interior ? `Int. ${customer.interior}` : null,
    `Col. ${customer.neighborhood}`,
    `${customer.city}, ${customer.state}`,
    `CP ${customer.zip}`,
    customer.notes ? `Ref: ${customer.notes}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const items = resolved.map((line) => ({
    id: line.product.slug,
    title: line.product.shortName.slice(0, 250),
    description: line.product.summary.slice(0, 250),
    quantity: line.qty,
    unit_price: line.product.price,
    currency_id: "MXN",
  }));

  if (totals.shipping > 0) {
    items.push({
      id: "envio",
      title: "Envio a domicilio",
      description: "Envio estandar a cualquier estado de Mexico",
      quantity: 1,
      unit_price: totals.shipping,
      currency_id: "MXN",
    });
  }

  const preference: Record<string, unknown> = {
    items,
    payer: {
      name: customer.name,
      email: customer.email,
      phone: { number: customer.phone },
    },
    back_urls: {
      success: `${siteUrl}/checkout/gracias`,
      failure: `${siteUrl}/checkout/error`,
      pending: `${siteUrl}/checkout/pendiente`,
    },
    external_reference: orderReference,
    statement_descriptor: "TALLERDERUTA",
    metadata: {
      order_reference: orderReference,
      customer_name: customer.name,
      customer_phone: customer.phone,
      shipping_address: address,
      item_count: totals.itemCount,
    },
  };

  // auto_return exige una back_url publica; Mercado Pago la rechaza en localhost.
  if (isHttps) {
    preference.auto_return = "approved";
    preference.notification_url = `${siteUrl}/api/webhook/mercadopago`;
  }

  // ---- 6. Crear la preferencia en Mercado Pago ---------------------------
  try {
    const response = await fetch(MP_PREFERENCES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": orderReference,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[checkout] Mercado Pago rechazo la preferencia:", response.status, detail);

      return NextResponse.json(
        {
          error: "gateway_error",
          message:
            "No pudimos iniciar el pago. Intenta de nuevo en un momento o escribenos por WhatsApp.",
        },
        { status: 502 },
      );
    }

    const data = (await response.json()) as MpPreference;

    console.log(
      `[checkout] Preferencia creada ${data.id} | orden ${orderReference} | total ${totals.total} MXN`,
    );
    console.log(`[checkout] Envio a: ${address}`);
    console.log(`[checkout] Contacto: ${customer.name} <${customer.email}> ${customer.phone}`);

    return NextResponse.json({
      orderReference,
      total: totals.total,
      checkoutUrl:
        process.env.NODE_ENV === "production"
          ? data.init_point
          : (data.sandbox_init_point ?? data.init_point),
    });
  } catch (error) {
    console.error("[checkout] Error de red al contactar Mercado Pago:", error);

    return NextResponse.json(
      {
        error: "network_error",
        message:
          "No pudimos conectar con la pasarela de pago. Revisa tu conexion e intenta de nuevo.",
      },
      { status: 502 },
    );
  }
}
