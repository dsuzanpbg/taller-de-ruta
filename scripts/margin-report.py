"""
Reporte de margen por producto.

Lee los precios y costos directamente de src/data/products.ts (la fuente de
verdad del catalogo) y calcula el margen bruto de cada producto.

Recordatorio importante: el margen que imprime este script es BRUTO, antes de
comisiones de pasarela, publicidad, envio absorbido y reserva por devoluciones.
Sirve para descartar productos malos, no para declarar utilidad.

Uso:
    python scripts/margin-report.py
"""

from __future__ import annotations

import re
from pathlib import Path

PRODUCTS_FILE = Path(__file__).resolve().parent.parent / "src" / "data" / "products.ts"

MARGIN_FLOOR = 0.55
GATEWAY_FEE = 0.035
RETURN_RESERVE = 0.02


def parse_products(text: str) -> list[dict]:
    """Extrae slug, nombre, precio y costo de cada bloque de producto."""
    products = []

    # Cada producto empieza con "slug: ..." y contiene "price:" y "costMXN:"
    blocks = re.split(r"\n  \{\n", text)

    for block in blocks:
        slug_m = re.search(r'slug:\s*"([^"]+)"', block)
        if not slug_m:
            continue

        name_m = re.search(r'shortName:\s*"([^"]+)"', block)
        price_m = re.search(r"^\s*price:\s*([\d.]+)", block, re.MULTILINE)
        cost_m = re.search(r"^\s*costMXN:\s*([\d.]+)", block, re.MULTILINE)

        if not (price_m and cost_m):
            continue

        products.append(
            {
                "slug": slug_m.group(1),
                "name": name_m.group(1) if name_m else slug_m.group(1),
                "price": float(price_m.group(1)),
                "cost": float(cost_m.group(1)),
            }
        )

    return products


def main() -> None:
    text = PRODUCTS_FILE.read_text(encoding="utf-8")
    products = parse_products(text)

    if not products:
        raise SystemExit("No se pudo leer ningun producto. Revisa el formato de products.ts")

    header = (
        f"{'Producto':<40} {'Precio':>8} {'Costo':>8} "
        f"{'Bruto':>8} {'Bruto %':>8} {'Neto':>8} {'Neto %':>8} {'Estado':>8}"
    )
    print(header)
    print("-" * len(header))

    failing = []

    for p in sorted(products, key=lambda x: -(x["price"] - x["cost"]) / x["price"]):
        gross = p["price"] - p["cost"]
        gross_pct = gross / p["price"]
        fees = p["price"] * (GATEWAY_FEE + RETURN_RESERVE)
        net = p["price"] - p["cost"] - fees
        net_pct = net / p["price"]

        status = "OK" if gross_pct >= MARGIN_FLOOR else "BAJO"
        if status == "BAJO":
            failing.append(p)

        name = p["name"][:39]
        print(
            f"{name:<40} {p['price']:>8.0f} {p['cost']:>8.0f} "
            f"{gross:>8.0f} {gross_pct * 100:>7.1f}% {net:>8.0f} {net_pct * 100:>7.1f}% {status:>8}"
        )

    print("-" * len(header))
    print(f"{len(products)} productos analizados.")
    print(f"Piso de margen bruto exigido: {MARGIN_FLOOR * 100:.0f}%")
    print(
        f"Neto = despues de {GATEWAY_FEE * 100:.1f}% de pasarela y "
        f"{RETURN_RESERVE * 100:.0f}% de reserva por devolucion. Antes de publicidad."
    )

    if failing:
        print(f"\nADVERTENCIA: {len(failing)} producto(s) por debajo del piso de margen:")
        for p in failing:
            minimum = -(-p["cost"] // (1 - MARGIN_FLOOR))
            current = (p["price"] - p["cost"]) / p["price"] * 100
            print(
                f"  - {p['name']}: {current:.1f}% bruto con costo {p['cost']:.0f}. "
                f"Sube el precio a {minimum:.0f}+ mxn o consigue el costo por debajo de "
                f"{p['price'] * (1 - MARGIN_FLOOR):.0f} mxn."
            )
    else:
        print("\nTodos los productos cumplen el piso de margen bruto.")


if __name__ == "__main__":
    main()
