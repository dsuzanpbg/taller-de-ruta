import { MARGIN_FLOOR } from "./types";
import type { Product } from "./types";

export type MarginReport = {
  slug: string;
  name: string;
  price: number;
  costMXN: number;
  grossMargin: number;
  grossMarginPercent: number;
  /** Precio minimo de venta para cumplir el piso de margen */
  minimumPrice: number;
  passes: boolean;
};

/**
 * Calcula el margen bruto de un producto usando el costo estimado de proveedor.
 *
 * IMPORTANTE: este margen es ANTES de comisiones de pasarela, envio absorbido,
 * publicidad y reserva por devoluciones. Sirve para descartar productos malos,
 * no para declarar utilidad.
 */
export function marginReport(product: Product): MarginReport {
  const grossMargin = product.price - product.costMXN;
  const grossMarginPercent = grossMargin / product.price;
  const minimumPrice = Math.ceil(product.costMXN / (1 - MARGIN_FLOOR));

  return {
    slug: product.slug,
    name: product.name,
    price: product.price,
    costMXN: product.costMXN,
    grossMargin,
    grossMarginPercent,
    minimumPrice,
    passes: grossMarginPercent >= MARGIN_FLOOR,
  };
}

/** Margen despues de comision de pasarela y reserva por devolucion. */
export function netMargin(
  price: number,
  costMXN: number,
  gatewayFeePercent = 0.035,
  returnReservePercent = 0.02,
): number {
  const fees = price * (gatewayFeePercent + returnReservePercent);
  return price - costMXN - fees;
}
