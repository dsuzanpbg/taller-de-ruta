"use client";

import { useState } from "react";

import { useCart } from "@/components/cart-provider";

type Props = {
  slug: string;
  className?: string;
  label?: string;
  /** Cantidad agregada por clic cuando el boton es directo */
  qty?: number;
  showQtyPicker?: boolean;
};

export function AddToCartButton({
  slug,
  className,
  label = "Agregar al carrito",
  qty = 1,
  showQtyPicker = false,
}: Props) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(qty);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(slug, showQtyPicker ? quantity : qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className={showQtyPicker ? "flex flex-wrap items-stretch gap-3" : undefined}>
      {showQtyPicker && (
        <div className="flex items-center rounded-lg border border-line">
          <button
            type="button"
            aria-label="Quitar una unidad"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="px-3.5 py-3 text-muted transition hover:text-cream"
          >
            −
          </button>
          <span className="min-w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            aria-label="Agregar una unidad"
            onClick={() => setQuantity((value) => Math.min(10, value + 1))}
            className="px-3.5 py-3 text-muted transition hover:text-cream"
          >
            +
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        className={
          className ??
          "flex-1 rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
        }
      >
        {added ? "Agregado ✓" : label}
      </button>
    </div>
  );
}
