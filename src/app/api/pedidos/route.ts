import { NextResponse } from "next/server";

import { listOrders, ORDER_STATUSES, type OrderStatus } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Panel de pedidos (operacion interna).
 *
 * GET /api/pedidos            -> todas las ordenes (mas recientes primero)
 * GET /api/pedidos?estado=paid&limite=20 -> filtradas
 *
 * TODO(auth): este endpoint esta abierto. Antes de usarlo en produccion
 * hay que meterlo detras de la sesion del administrador (o de un token)
 * porque expone datos personales del cliente (nombre, telefono y direccion).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const estadoParam = url.searchParams.get("estado");
    const limiteParam = url.searchParams.get("limite");

    let status: OrderStatus | undefined;
    if (estadoParam) {
      if (!(ORDER_STATUSES as readonly string[]).includes(estadoParam)) {
        return NextResponse.json(
          {
            error: "Estado no valido.",
            estados: ORDER_STATUSES,
          },
          { status: 400 },
        );
      }
      status = estadoParam as OrderStatus;
    }

    const limite = limiteParam === null ? undefined : Number(limiteParam);
    if (limite !== undefined && !Number.isFinite(limite)) {
      return NextResponse.json(
        { error: "El limite debe ser un numero." },
        { status: 400 },
      );
    }

    const orders = await listOrders({
      status,
      limit: limite !== undefined && limite >= 0 ? limite : undefined,
    });

    return NextResponse.json({
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error("[api/pedidos] Error listando ordenes:", error);
    return NextResponse.json(
      { error: "No se pudieron leer los pedidos." },
      { status: 500 },
    );
  }
}
