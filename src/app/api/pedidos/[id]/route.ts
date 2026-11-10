import { NextResponse } from "next/server";

import {
  getOrder,
  ORDER_STATUSES,
  updateOrder,
  type OrderPatch,
  type OrderStatus,
  type OrderSupplier,
} from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Pedido por id.
 *
 * GET   /api/pedidos/TDR-XXXX-XXXX  -> la orden
 * PATCH /api/pedidos/TDR-XXXX-XXXX  -> actualiza estado / guia / notas
 *
 * TODO(auth): igual que /api/pedidos, este endpoint esta abierto.
 * Ponerlo detras de la sesion del administrador antes de produccion.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const order = await getOrder(id);

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[api/pedidos/:id] Error leyendo la orden:", error);
    return NextResponse.json(
      { error: "No se pudo leer el pedido." },
      { status: 500 },
    );
  }
}

/**
 * Actualiza la orden. Sirve para mover el estado (paid -> packing ->
 * shipped -> delivered) y para pegar la guia del proveedor.
 *
 * Body ejemplo:
 *   { "status": "shipped", "supplier": { "trackingNumber": "LX123456789" } }
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Solicitud invalida." },
        { status: 400 },
      );
    }

    const payload = (body ?? {}) as Record<string, unknown>;

    const statusRaw = payload.status;
    if (
      statusRaw !== undefined &&
      !(ORDER_STATUSES as readonly string[]).includes(String(statusRaw))
    ) {
      return NextResponse.json(
        { error: "Estado no valido.", estados: ORDER_STATUSES },
        { status: 400 },
      );
    }

    const supplierRaw = (payload.supplier ?? {}) as Record<string, unknown>;
    const hasTracking =
      typeof supplierRaw.trackingNumber === "string" ||
      typeof supplierRaw.trackingUrl === "string" ||
      typeof supplierRaw.costMXN === "number" ||
      typeof supplierRaw.orderedAt === "string" ||
      typeof supplierRaw.itemId === "string";

    const patch: OrderPatch = {};

    if (statusRaw !== undefined) patch.status = String(statusRaw) as OrderStatus;
    if (typeof payload.notes === "string") patch.notes = payload.notes;

    if (hasTracking) {
      const supplier: Partial<OrderSupplier> = {};

      if (typeof supplierRaw.trackingNumber === "string") {
        supplier.trackingNumber = supplierRaw.trackingNumber;
      }
      if (typeof supplierRaw.trackingUrl === "string") {
        supplier.trackingUrl = supplierRaw.trackingUrl;
      }
      if (typeof supplierRaw.costMXN === "number") {
        supplier.costMXN = supplierRaw.costMXN;
      }
      if (typeof supplierRaw.orderedAt === "string") {
        supplier.orderedAt = supplierRaw.orderedAt;
      }
      if (typeof supplierRaw.itemId === "string") {
        supplier.itemId = supplierRaw.itemId;
      }

      patch.supplier = supplier;
    }

    const updated = await updateOrder(id, patch);

    if (!updated) {
      return NextResponse.json(
        { error: "Pedido no encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[api/pedidos/:id] Error actualizando la orden:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el pedido." },
      { status: 500 },
    );
  }
}
