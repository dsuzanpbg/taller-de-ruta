"""
Genera las 14 fichas de producto en store/public/productos/.

Son ilustraciones vectoriales propias (no fotos): representan cada producto de
forma reconocible con el mismo lenguaje visual de la tienda, para que el catalogo
se vea premium sin usar material de marcas ni de proveedores.

Todas las salidas son 1200x1200 con fondo consistente, nombre del producto y
etiqueta de precio.

Uso:
    python store/scripts/generate-product-images.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))

from brand_art import fit_art  # noqa: E402
from brand_kit import (  # noqa: E402
    ACCENT,
    ACCENT_SOFT,
    CREAM,
    INK,
    INK_2,
    LINE,
    MUTED,
    MUTED_2,
    SURFACE,
    apply_grain,
    brand_lockup,
    font,
    draw_tracked,
    price_pill,
    radial_gradient,
    save_png,
    soft_shadow,
    text_width,
)

SIZE = 1200
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "productos"
# slug del archivo | nombre corto | categoria | tipo de ilustracion | precio | precio anterior
PRODUCTS: list[tuple[str, str, str, str, int, int]] = [
    ("kit-soporte-antivibracion-360", "Kit soporte antivibración 360", "Soportes de celular", "phone-mount", 599, 749),
    ("soporte-impermeable-espejo", "Soporte impermeable con base espejo", "Soportes de celular", "phone-waterproof", 469, 599),
    ("punos-universales", "Punos universales 22/25 mm", "Punos y comodidad", "grips", 349, 449),
    ("mochila-impermeable", "Mochila impermeable 25L", "Alforjas y bolsas", "backpack", 749, 899),
    ("alforjas-universales", "Alforjas impermeables 36L-58L", "Alforjas y bolsas", "saddlebags", 1099, 1399),
    ("bolsa-pierna", "Bolsa de pierna impermeable", "Alforjas y bolsas", "leg-bag", 399, 499),
    ("bolsa-herramientas", "Bolsa de herramientas", "Alforjas y bolsas", "tool-roll", 329, 399),
    ("cubre-moto", "Cubre moto impermeable", "Cubre moto", "bike-cover", 599, 749),
    ("cubre-punos", "Cubre puños universales", "Punos y comodidad", "handguards", 499, 649),
    ("candado-disco", "Candado de disco + cable", "Seguridad y candados", "disc-lock", 449, 549),
    ("red-porta-carga", "Red elástica porta carga", "Alforjas y bolsas", "cargo-net", 199, 249),
    ("cepillo-cadena", "Cepillo limpiador de cadena", "Mantenimiento", "chain-brush", 179, 229),
    ("stickers-genericos", "Pack stickers genéricos", "Stickers", "stickers", 149, 189),
    ("stickers-reflectivos", "Stickers reflectivos", "Stickers", "reflective", 149, 189),
]

ART_MAX_W = 830
ART_MAX_H = 580
ART_CY = 408


def background() -> Image.Image:
    """Fondo consistente para las 14 fichas: estudio oscuro con halo naranja."""
    base = Image.new("RGBA", (SIZE, SIZE), INK + (255,))

    # Degradado vertical de fondo
    top = np.array((19, 22, 27), dtype=np.float32)
    bottom = np.array((11, 12, 14), dtype=np.float32)
    ramp = np.linspace(0, 1, SIZE, dtype=np.float32)[:, None]
    arr = top[None, :] * (1 - ramp) + bottom[None, :] * ramp
    arr = np.repeat(arr[:, None, :], SIZE, axis=1)
    base = Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")

    # Halo naranja detras del producto
    base.alpha_composite(radial_gradient(SIZE, SIZE, 600, ART_CY - 20, 520, ACCENT, 52, falloff=2.2))
    # Luz superior neutra
    base.alpha_composite(radial_gradient(SIZE, SIZE, 600, 250, 540, (255, 255, 255), 18, falloff=2.0))

    return base


def vignette(image: Image.Image) -> Image.Image:
    yy, xx = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)
    dist = np.sqrt(((xx - 600) / 760) ** 2 + ((yy - 560) / 760) ** 2)
    factor = np.clip(1.0 - (dist - 0.55) * 0.75, 0.55, 1.0)
    arr = np.array(image.convert("RGB")).astype(np.float32) * factor[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def floor_shadow(image: Image.Image) -> Image.Image:
    """Sombra de piso para que el producto no flote."""
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse((600 - 330, ART_CY + 250, 600 + 330, ART_CY + 330), fill=(0, 0, 0, 120))
    layer = layer.filter(ImageFilter.GaussianBlur(38))
    out = image.convert("RGBA")
    out.alpha_composite(layer)
    return out


def wrap_name(name: str, font_obj, max_width: int) -> list[str]:
    words = name.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if font_obj.getlength(candidate) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines[:2]


def build_image(slug: str, name: str, category: str, art: str, price: int, compare_at: int) -> Path:
    image = background()
    image = floor_shadow(image)

    # Producto (recortado a su contenido y escalado para llenar el encuadre)
    art_image = fit_art(art, ART_MAX_W, ART_MAX_H)
    art_w, art_h = art_image.size
    art_x = 600 - art_w // 2
    art_y = ART_CY - art_h // 2

    # Sombra difusa de la ilustracion
    alpha = art_image.getchannel("A")
    shadow = soft_shadow(alpha, offset=(0, 26), blur=34, opacity=130)
    image.alpha_composite(shadow, dest=(art_x, art_y + 26))
    image.alpha_composite(art_image, dest=(art_x, art_y))

    draw = ImageDraw.Draw(image, "RGBA")

    # Marca de agua (arriba a la derecha, dentro del area segura 4:3)
    brand_lockup(draw, 1128, 186, size=18, color=MUTED_2, mark_color=ACCENT, anchor="ra", tracking=5)

    # Barra de acento + categoria
    draw.rounded_rectangle((574, 760, 626, 766), radius=3, fill=ACCENT)
    draw_tracked(draw, (600, 786), category.upper(), font(23, "semibold"), MUTED, 6, anchor="ma")

    # Nombre
    name_font = font(52, "bold")
    lines = wrap_name(name, name_font, 960)
    y = 822 if len(lines) > 1 else 842
    for line in lines:
        draw_tracked(draw, (600, y), line, name_font, CREAM, 0, anchor="ma")
        y += 64

    # Precio
    price_y = 972
    half = price_pill(image, draw, 600, price_y, f"MXN {price}", radius=30, price_size=34)
    compare_font = font(22, "regular")
    compare_text = f"antes MXN {compare_at}"
    compare_x = 600 + half + 20
    draw.text((compare_x, price_y), compare_text, font=compare_font, fill=MUTED_2, anchor="lm")
    line_w = compare_font.getlength(compare_text)
    draw.line([(compare_x, price_y - 1), (compare_x + line_w, price_y - 1)], fill=MUTED_2, width=2)

    # Pie: envio + marca
    draw_tracked(
        draw,
        (72, 1032),
        "Envío a todo México  ·  7 a 15 días hábiles",
        font(19, "regular"),
        MUTED_2,
        1,
        anchor="lm",
    )
    brand_lockup(draw, 1128, 1032, size=16, color=MUTED_2, mark_color=ACCENT, anchor="rm", tracking=4)

    final = vignette(image.convert("RGB"))
    final = apply_grain(final, amount=1.8, seed=abs(hash(slug)) % 9999)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{slug}.png"
    save_png(final, out_path)
    return out_path


def main() -> None:
    for slug, name, category, art, price, compare_at in PRODUCTS:
        path = build_image(slug, name, category, art, price, compare_at)
        print(f"generado: {path.name}")

    print(f"\n{len(PRODUCTS)} imagenes en {OUT_DIR}")


if __name__ == "__main__":
    main()
