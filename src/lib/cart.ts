import { products } from "@/data/products";
import type { Product } from "./types";

export type CartLine = { slug: string; qty: number };

export type ResolvedLine = {
  product: Product;
  qty: number;
  subtotal: number;
};

export const FREE_SHIPPING_FROM = 599;
export const FLAT_SHIPPING = 89;
export const MAX_QTY_PER_LINE = 10;

/**
 * Normaliza cualquier entrada no confiable (localStorage, body de una peticion)
 * a una lista de lineas valida contra el catalogo real.
 *
 * Los precios NUNCA se toman del cliente: siempre del catalogo del servidor.
 */
export function normalizeLines(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return [];

  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const merged = new Map<string, number>();

  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const slug = (raw as { slug?: unknown }).slug;
    const qty = (raw as { qty?: unknown }).qty;

    if (typeof slug !== "string" || !bySlug.has(slug)) continue;

    const parsedQty =
      typeof qty === "number" && Number.isFinite(qty) ? Math.floor(qty) : 1;

    const clamped = Math.min(Math.max(parsedQty, 1), MAX_QTY_PER_LINE);
    merged.set(slug, Math.min((merged.get(slug) ?? 0) + clamped, MAX_QTY_PER_LINE));
  }

  return [...merged.entries()].map(([slug, qty]) => ({ slug, qty }));
}

export function resolveLines(lines: CartLine[]): ResolvedLine[] {
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  return lines.flatMap((line) => {
    const product = bySlug.get(line.slug);
    if (!product) return [];
    return [{ product, qty: line.qty, subtotal: product.price * line.qty }];
  });
}

export type OrderTotals = {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
};

export function computeTotals(resolved: ResolvedLine[]): OrderTotals {
  const subtotal = resolved.reduce((sum, line) => sum + line.subtotal, 0);
  const itemCount = resolved.reduce((sum, line) => sum + line.qty, 0);
  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : FLAT_SHIPPING;

  return { subtotal, shipping, total: subtotal + shipping, itemCount };
}
