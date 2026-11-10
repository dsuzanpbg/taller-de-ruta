import { NextResponse } from "next/server";

import { products } from "@/data/products";
import { appendOrder, SUPPLIER_ITEMS } from "@/lib/orders";

export const runtime = "nodejs";

/**
 * Base de la API de Mercado Pago. Se puede cambiar con
 * MERCADOPAGO_API_BASE para apuntar a un mock en las pruebas locales.
 */
const MP_API_BASE =
  process.env.MERCADOPAGO_API_BASE ?? "https://api.mercadopago.com";

/** Estados de Mercado Pago que cuentan como venta. */
const PAID_STATUSES = ["approved", "authorized"];

type MpItem = {
  id?: string;
  title?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
};

type MpPayment = {
  id: number;
  status: string;
  status_detail?: string;
  transaction_amount?: number;
  external_reference?: string;
  metadata?: Record<string, unknown>;
  payer?: { email?: string; name?: string; phone?: { number?: string } };
  items?: MpItem[];
  shipping?: { amount?: number; mode?: string };
};

function readText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Convierte los items de la preferencia de Mercado Pago en los items de la
 * orden. El `id` del item es el slug del catalogo de la tienda.
 */
function buildItems(mpItems: MpItem[] | undefined): {
  items: { slug: string; name: string; qty: number; unitPrice: number }[];
  shipping: number;
} {
  const items: {
    slug: string;
    name: string;
    qty: number;
    unitPrice: number;
  }[] = [];

  let shipping = 0;

  for (const mpItem of mpItems ?? []) {
    const slug = readText(mpItem.id);
    if (!slug) continue;

    const qty = Math.max(1, Math.trunc(readNumber(mpItem.quantity, 1)));
    const unitPrice = readNumber(mpItem.unit_price, 0);

    // La linea de envio se agrega como item en la preferencia; no es producto.
    if (slug === "envio") {
      shipping += unitPrice * qty;
      continue;
    }

    const product = products.find((entry) => entry.slug === slug);

    items.push({
      slug,
      name: product?.name ?? readText(mpItem.title, slug),
      qty,
      unitPrice,
    });
  }

  return { items, shipping };
}

/**
 * Webhook de Mercado Pago.
 *
 * Cuando el pago queda aprobado, se guarda el pedido en disco
 * (`store/data/orders.jsonl`) con los datos del cliente y la direccion de
 * envio que viaja en la metadata de la preferencia.
 *
 * Mercado Pago reintenta la notificacion si no recibe un 200 rapido, asi que
 * SIEMPRE respondemos 200: si algo falla se registra en consola y se sigue.
 */
export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  let event: Record<string, unknown>;
  try {
    event = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ received: true, ok: true }, { status: 200 });
  }

  const type = event.type ?? event.topic;
  const dataId =
    (event.data as { id?: string | number } | undefined)?.id ?? event.id;

  if (type !== "payment" || dataId === undefined || dataId === null) {
    return NextResponse.json({ received: true, ok: true }, { status: 200 });
  }

  if (!accessToken) {
    console.warn("[webhook] Pago recibido pero MERCADOPAGO_ACCESS_TOKEN no esta configurado.");
    return NextResponse.json({ received: true, ok: true }, { status: 200 });
  }

  let payment: MpPayment;

  try {
    const response = await fetch(`${MP_API_BASE}/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[webhook] No se pudo consultar el pago", dataId, response.status);
      return NextResponse.json({ received: true, ok: true }, { status: 200 });
    }

    payment = (await response.json()) as MpPayment;
  } catch (error) {
    console.error("[webhook] Error al procesar la notificacion:", error);
    return NextResponse.json({ received: true, ok: true }, { status: 200 });
  }

  const address = readText(payment.metadata?.shipping_address) || "sin direccion registrada";

  console.log(
    [
      "[webhook] PAGO",
      `id=${payment.id}`,
      `estado=${payment.status}`,
      `detalle=${payment.status_detail ?? "-"}`,
      `monto=${payment.transaction_amount ?? "-"} MXN`,
      `orden=${payment.external_reference ?? "-"}`,
      `correo=${payment.payer?.email ?? "-"}`,
      `envio=${address}`,
    ].join(" | "),
  );

  // ---- Validaciones ------------------------------------------------------
  const status = readText(payment.status).toLowerCase();

  if (!PAID_STATUSES.includes(status)) {
    console.log(
      `[webhook] Pago ${payment.id} en estado "${status}": no se guarda orden.`,
    );
    return NextResponse.json({ received: true, ok: true }, { status: 200 });
  }

  const orderId =
    readText(payment.external_reference) ||
    readText(payment.metadata?.order_reference);

  if (!orderId) {
    console.warn(
      `[webhook] Pago ${payment.id} sin external_reference: no se puede guardar la orden.`,
    );
    return NextResponse.json({ received: true, ok: true }, { status: 200 });
  }

  // ---- Guardar la orden --------------------------------------------------
  try {
    const { items, shipping } = buildItems(payment.items);

    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.qty,
      0,
    );

    const total = readNumber(payment.transaction_amount, subtotal + shipping);

    const customerName =
      readText(payment.metadata?.customer_name) ||
      readText(payment.payer?.name);

    const customerPhone =
      readText(payment.metadata?.customer_phone) ||
      readText(payment.payer?.phone?.number);

    const firstSlug = items[0]?.slug ?? "";

    const order = await appendOrder({
      id: orderId,
      createdAt: new Date().toISOString(),
      status: "paid",
      items,
      subtotal,
      shipping,
      total,
      customer: {
        name: customerName,
        email: readText(payment.payer?.email),
        phone: customerPhone,
        address,
      },
      supplier: {
        itemId: SUPPLIER_ITEMS[firstSlug] ?? "",
      },
      notes: "",
    });

    console.log(
      `[webhook] Orden ${order.id} guardada | ${order.items.length} producto(s) | ${order.total} MXN | estado=${order.status}`,
    );

    return NextResponse.json(
      { received: true, ok: true, order: order.id },
      { status: 200 },
    );
  } catch (error) {
    // Nunca reventamos el webhook: Mercado Pago reintenta y el pago ya cobro.
    console.error("[webhook] No se pudo guardar la orden:", error);
    return NextResponse.json({ received: true, ok: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
