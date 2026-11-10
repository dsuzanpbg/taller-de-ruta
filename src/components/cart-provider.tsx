"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { computeTotals, normalizeLines, resolveLines, type CartLine } from "@/lib/cart";
import { formatMXN } from "@/lib/format";

const STORAGE_KEY = "tdr-cart-v2";

type CartContextValue = {
  lines: CartLine[];
  /** false mientras se hidrata desde localStorage */
  ready: boolean;
  itemCount: number;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de <CartProvider>");
  }
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Hidratar desde localStorage una sola vez, en el cliente.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setLines(normalizeLines(JSON.parse(raw)));
      }
    } catch {
      // localStorage corrupto o bloqueado: se ignora y arranca vacio.
    }
    setReady(true);
  }, []);

  // Persistir solo despues de hidratar, para no borrar el carrito guardado.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Modo privado o cuota llena: el carrito sigue funcionando en memoria.
    }
  }, [lines, ready]);

  // Bloquear el scroll del fondo cuando el panel esta abierto.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Cerrar el panel con la tecla Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const add = useCallback((slug: string, qty = 1) => {
    setLines((current) => {
      const next = normalizeLines([...current, { slug, qty }]);
      return next;
    });
    setIsOpen(true);
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    setLines((current) =>
      qty <= 0
        ? current.filter((line) => line.slug !== slug)
        : normalizeLines(
            current.map((line) => (line.slug === slug ? { slug, qty } : line)),
          ),
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setLines((current) => current.filter((line) => line.slug !== slug));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.qty, 0),
    [lines],
  );

  const resolved = useMemo(() => resolveLines(lines), [lines]);
  const totals = useMemo(() => computeTotals(resolved), [resolved]);

  const value = useMemo<CartContextValue>(
    () => ({ lines, ready, itemCount, add, setQty, remove, clear, open, close }),
    [lines, ready, itemCount, add, setQty, remove, clear, open, close],
  );

  return (
    <CartContext.Provider value={value}>
      {children}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Cerrar carrito"
            onClick={close}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <aside
            className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de compras"
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-base font-semibold">
                Tu carrito
                {totals.itemCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted">
                    ({totals.itemCount}{" "}
                    {totals.itemCount === 1 ? "articulo" : "articulos"})
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-md px-2 py-1 text-sm text-muted transition hover:bg-surface-2 hover:text-cream"
              >
                Cerrar
              </button>
            </header>

            {resolved.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-sm text-muted">Tu carrito esta vacio.</p>
                <Link
                  href="/tienda"
                  onClick={close}
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
                >
                  Ver el catalogo
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                  {resolved.map(({ product, qty, subtotal }) => (
                    <li key={product.slug} className="flex gap-4 py-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-ink-2">
                        <Image
                          src={product.image}
                          alt={product.shortName}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link
                          href={`/producto/${product.slug}`}
                          onClick={close}
                          className="text-sm font-medium leading-snug transition hover:text-accent"
                        >
                          {product.shortName}
                        </Link>

                        <span className="mt-1 text-sm text-muted">
                          {formatMXN(product.price)} c/u
                        </span>

                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                          <div className="flex items-center rounded-md border border-line">
                            <button
                              type="button"
                              aria-label={`Quitar una unidad de ${product.shortName}`}
                              onClick={() => setQty(product.slug, qty - 1)}
                              className="px-2.5 py-1 text-sm text-muted transition hover:text-cream"
                            >
                              −
                            </button>
                            <span className="min-w-8 text-center text-sm">{qty}</span>
                            <button
                              type="button"
                              aria-label={`Agregar una unidad de ${product.shortName}`}
                              onClick={() => setQty(product.slug, qty + 1)}
                              className="px-2.5 py-1 text-sm text-muted transition hover:text-cream"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold">
                              {formatMXN(subtotal)}
                            </span>
                            <button
                              type="button"
                              onClick={() => remove(product.slug)}
                              className="text-xs text-muted-2 underline underline-offset-2 transition hover:text-accent"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <footer className="border-t border-line px-5 py-4">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">Subtotal</dt>
                      <dd className="font-medium">{formatMXN(totals.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Envio</dt>
                      <dd className="font-medium">
                        {totals.shipping === 0 ? (
                          <span className="text-success">Gratis</span>
                        ) : (
                          formatMXN(totals.shipping)
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-line pt-2 text-base">
                      <dt className="font-semibold">Total</dt>
                      <dd className="font-bold">{formatMXN(totals.total)}</dd>
                    </div>
                  </dl>

                  <Link
                    href="/carrito"
                    onClick={close}
                    className="mt-4 block w-full rounded-lg bg-accent px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-accent-hover"
                  >
                    Ir al checkout
                  </Link>

                  <button
                    type="button"
                    onClick={close}
                    className="mt-2 w-full rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-muted transition hover:border-line-2 hover:text-cream"
                  >
                    Seguir comprando
                  </button>
                </footer>
              </>
            )}
          </aside>
        </div>
      )}
    </CartContext.Provider>
  );
}
