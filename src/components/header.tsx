"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/cart-provider";
import { nav, site } from "@/data/site";

export function Header() {
  const { itemCount, open, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label={site.name}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-lg font-black text-white">
            T
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-sm font-bold tracking-tight">{site.name}</span>
            <span className="mt-0.5 text-[11px] text-muted-2">
              Accesorios para moto diaria
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition hover:text-cream"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={open}
            className="relative flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-medium transition hover:border-line-2 hover:bg-surface"
            aria-label="Abrir carrito"
          >
            <span>Carrito</span>
            {ready && itemCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-lg border border-line px-3 py-2 text-sm lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-line bg-surface lg:hidden">
          <div className="container-page flex flex-col py-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-line py-3 text-sm text-muted transition last:border-0 hover:text-cream"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
