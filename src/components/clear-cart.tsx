"use client";

import { useEffect } from "react";

import { useCart } from "@/components/cart-provider";

/**
 * Vacia el carrito despues de un pago aprobado.
 * Se monta solo en la pagina de confirmacion.
 */
export function ClearCart() {
  const { clear, ready } = useCart();

  useEffect(() => {
    if (ready) clear();
  }, [clear, ready]);

  return null;
}
