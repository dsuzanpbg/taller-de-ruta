"""
Sistema de diseno compartido de "Taller de Ruta" para los PNG de la tienda.

Aqui vive la paleta (la misma de src/app/globals.css), las tipografias, los
helpers de dibujo con numpy (degradados, sombras, halos) y los componentes de
layout (marca, precios, hooks, pies de creativo).

Lo consumen:
    scripts/generate-product-images.py
    scripts/generate-creativos.py

Todo se dibuja a resolucion final: las ilustraciones si se dibujan en un lienzo
grande y se reescalan (ver brand_art.py).
"""

from __future__ import annotations

import math
import os
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# --------------------------------------------------------------------------
# Paleta (identica a las variables CSS de src/app/globals.css)
# --------------------------------------------------------------------------
INK = (11, 12, 14)
INK_2 = (16, 18, 22)
SURFACE = (21, 24, 29)
SURFACE_2 = (28, 32, 39)
LINE = (39, 44, 53)
LINE_2 = (52, 58, 69)
ACCENT = (255, 106, 0)
ACCENT_HOVER = (255, 131, 48)
ACCENT_SOFT = (42, 26, 13)
CREAM = (244, 245, 247)
MUTED = (153, 161, 174)
MUTED_2 = (109, 116, 128)
SUCCESS = (62, 207, 142)

# Colores de ilustracion (plastico y metal del hardware)
BODY_D = (19, 22, 27)
BODY_M = (38, 44, 53)
BODY_L = (70, 79, 92)
BODY_HL = (116, 128, 144)
STEEL = (146, 158, 174)
STEEL_D = (84, 94, 108)
RUBBER = (26, 29, 35)
GLASS = (96, 122, 150)

# --------------------------------------------------------------------------
# Tipografias
# --------------------------------------------------------------------------
FONT_DIRS = [
    Path(r"C:\Windows\Fonts"),
    Path("/usr/share/fonts/truetype/dejavu"),
    Path("/System/Library/Fonts"),
]

FONT_FILES = {
    "regular": ["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"],
    "semibold": ["seguisb.ttf", "segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"],
    "bold": ["segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"],
    "black": ["seguibl.ttf", "ariblk.ttf", "DejaVuSans-Bold.ttf"],
}


def _find_font_file(weight: str) -> str | None:
    for name in FONT_FILES.get(weight, FONT_FILES["regular"]):
        for folder in FONT_DIRS:
            candidate = folder / name
            if candidate.exists():
                return str(candidate)
    return None


@lru_cache(maxsize=256)
def font(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    """Fuente del sistema. Degrada a la de por defecto si no encuentra nada."""
    path = _find_font_file(weight)
    if path:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


# --------------------------------------------------------------------------
# Texto
# --------------------------------------------------------------------------
def text_width(font_obj: ImageFont.FreeTypeFont, text: str, tracking: int = 0) -> float:
    if not text:
        return 0.0
    return font_obj.getlength(text) + tracking * max(0, len(text) - 1)


def draw_tracked(
    draw: ImageDraw.ImageDraw,
    xy: tuple[float, float],
    text: str,
    font_obj: ImageFont.FreeTypeFont,
    fill,
    tracking: int = 0,
    anchor: str = "la",
) -> float:
    """Escribe texto con espaciado entre letras. Devuelve el ancho dibujado."""
    x, y = xy
    width = text_width(font_obj, text, tracking)
    if anchor[0] == "m":
        x -= width / 2
    elif anchor[0] == "r":
        x -= width
    v_anchor = "l" + anchor[1] if anchor[1] != "a" else "la"

    for char in text:
        draw.text((x, y), char, font=font_obj, fill=fill, anchor=v_anchor)
        x += font_obj.getlength(char) + tracking
    return width


def wrap_rich(
    items: list[tuple[str, tuple]],
    font_obj: ImageFont.FreeTypeFont,
    max_width: int,
    tracking: int = 0,
) -> list[list[tuple[str, tuple]]]:
    """Parte una lista de (texto, color) en lineas que caben en max_width."""
    lines: list[list[tuple[str, tuple]]] = []
    current: list[tuple[str, tuple]] = []
    current_width = 0.0

    for text, color in items:
        word_width = font_obj.getlength(text) + tracking * len(text)
        space = font_obj.getlength(" ") + tracking if current else 0
        if current and current_width + space + word_width > max_width:
            lines.append(current)
            current = []
            current_width = 0.0
            space = 0
        current.append((text, color))
        current_width += space + word_width

    if current:
        lines.append(current)
    return lines


def draw_rich_block(
    draw: ImageDraw.ImageDraw,
    center_x: float,
    top_y: float,
    lines: list[list[tuple[str, tuple]]],
    font_obj: ImageFont.FreeTypeFont,
    tracking: int = 0,
    line_height: float | None = None,
    align: str = "center",
) -> float:
    """Dibuja un bloque de lineas con palabras de distinto color."""
    if line_height is None:
        line_height = font_obj.size * 1.22

    y = top_y
    for line in lines:
        words = [w for w, _ in line]
        widths = [font_obj.getlength(w) + tracking * len(w) for w in words]
        spaces = font_obj.getlength(" ") + tracking if len(words) > 1 else 0
        total = sum(widths) + spaces * (len(words) - 1)

        if align == "center":
            x = center_x - total / 2
        elif align == "right":
            x = center_x - total
        else:
            x = center_x

        for (word, color), word_width in zip(line, widths):
            draw_tracked(draw, (x, y), word, font_obj, color, tracking, anchor="la")
            x += word_width + spaces

        y += line_height
    return y


def strike_through(
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    width: float,
    color,
    thickness: int = 2,
) -> None:
    draw.line([(x, y), (x + width, y)], fill=color, width=thickness)


# --------------------------------------------------------------------------
# Degradados y texturas (numpy)
# --------------------------------------------------------------------------
def _blend(c0, c1, t: np.ndarray) -> np.ndarray:
    a = np.array(c0, dtype=np.float32)[None, None, :]
    b = np.array(c1, dtype=np.float32)[None, None, :]
    return a * (1 - t[..., None]) + b * t[..., None]


def linear_gradient(
    width: int, height: int, c0, c1, angle: float = 90.0
) -> Image.Image:
    """Degradado lineal. angle=90 es de arriba a abajo, angle=0 de izquierda a derecha."""
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    rad = math.radians(angle)
    proj = xx * math.cos(rad) + yy * math.sin(rad)
    span = proj.max() - proj.min()
    t = (proj - proj.min()) / span if span else np.zeros_like(proj)
    arr = np.clip(_blend(c0, c1, t), 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


def radial_gradient(
    width: int,
    height: int,
    cx: float,
    cy: float,
    radius: float,
    color,
    alpha: float = 255.0,
    falloff: float = 2.0,
) -> Image.Image:
    """Halo radial suave (RGBA)."""
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / max(radius, 1)
    a = np.clip(1.0 - dist, 0.0, 1.0) ** falloff * alpha
    arr = np.zeros((height, width, 4), dtype=np.uint8)
    arr[..., 0] = color[0]
    arr[..., 1] = color[1]
    arr[..., 2] = color[2]
    arr[..., 3] = np.clip(a, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def grain(size: tuple[int, int], amount: float = 3.0, seed: int = 7) -> Image.Image:
    """Ruido muy leve para que los degradados no se banding-een."""
    rng = np.random.default_rng(seed)
    noise = rng.normal(0, amount, size=(size[1], size[0], 1)).astype(np.float32)
    base = np.full((size[1], size[0], 3), 128.0, dtype=np.float32)
    arr = np.clip(base + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


def apply_grain(image: Image.Image, amount: float = 3.0, seed: int = 7) -> Image.Image:
    w, h = image.size
    noise = np.array(grain((w, h), amount, seed)).astype(np.float32) - 128.0
    arr = np.array(image.convert("RGB")).astype(np.float32)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


def save_png(image: Image.Image, path: Path, colors: int = 256) -> Path:
    """Guarda el PNG optimizado y cuantizado (mismo aspecto, ~4 veces mas liviano)."""
    rgb = image.convert("RGB")
    quantized = rgb.quantize(
        colors=colors,
        method=Image.FASTOCTREE,
        dither=Image.FLOYDSTEINBERG,
    )
    quantized.save(path, "PNG", optimize=True)
    return path


# --------------------------------------------------------------------------
# Composición
# --------------------------------------------------------------------------
def resize_rgba(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Reescala RGBA con alfa premultiplicado (evita halos oscuros)."""
    arr = np.array(image).astype(np.float32)
    alpha = arr[..., 3:4] / 255.0
    prem = np.concatenate([arr[..., :3] * alpha, arr[..., 3:4]], axis=2)
    prem_img = Image.fromarray(np.clip(prem, 0, 255).astype(np.uint8), "RGBA")
    out = np.array(prem_img.resize(size, Image.Resampling.LANCZOS)).astype(np.float32)
    out_alpha = out[..., 3:4] / 255.0
    rgb = np.where(out_alpha > 0, out[..., :3] / np.maximum(out_alpha, 1e-5), 0.0)
    merged = np.concatenate([np.clip(rgb, 0, 255), out[..., 3:4]], axis=2)
    return Image.fromarray(merged.astype(np.uint8), "RGBA")


def soft_shadow(
    alpha: Image.Image,
    offset: tuple[int, int] = (0, 18),
    blur: int = 26,
    opacity: int = 120,
    spread: float = 1.0,
    color=(0, 0, 0),
) -> Image.Image:
    """Sombra difusa a partir del canal alfa de una ilustración."""
    shadow = alpha.filter(ImageFilter.GaussianBlur(blur))
    if spread != 1.0:
        shadow = shadow.point(lambda v: int(min(255, v * spread)))
    shadow = shadow.point(lambda v: int(v * opacity / 255))
    layer = Image.new("RGBA", alpha.size, color + (0,))
    layer.putalpha(shadow)
    return layer


def paste_shadow(base: Image.Image, shadow: Image.Image, offset: tuple[int, int]) -> None:
    base.alpha_composite(shadow, dest=(max(0, offset[0]), max(0, offset[1])))


def gradient_shape(
    base: Image.Image,
    mask: Image.Image,
    c0,
    c1,
    angle: float = 90.0,
) -> None:
    """Rellena la region de `mask` con un degradado sobre `base` (RGBA)."""
    gradient = linear_gradient(base.width, base.height, c0, c1, angle)
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    layer.paste(gradient, (0, 0))
    layer.putalpha(mask)
    base.alpha_composite(layer)


def mask_from(size: tuple[int, int], painter) -> Image.Image:
    """Construye una mascara (L) a partir de un callback que dibuja en blanco."""
    mask = Image.new("L", size, 0)
    painter(ImageDraw.Draw(mask))
    return mask


def shade_art(layer: Image.Image, strength: float = 1.0) -> Image.Image:
    """Volumetrico suave: luz desde arriba-izquierda, sombra abajo-derecha."""
    w, h = layer.size
    arr = np.array(layer).astype(np.float32)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    t = np.clip((xx * 0.42 + yy * 0.58) / max(w * 0.42 + h * 0.58, 1), 0, 1)
    light = np.clip(1.0 - t, 0, 1) ** 1.7 * 26 * strength
    dark = np.clip((t - 0.42) / 0.58, 0, 1) ** 1.5 * 42 * strength
    arr[..., :3] = np.clip(arr[..., :3] + light[..., None] - dark[..., None], 0, 255)
    out = Image.fromarray(arr.astype(np.uint8), "RGBA")
    return out


def inner_rim(mask: Image.Image, width: int = 8) -> Image.Image:
    """Banda interior del borde de una mascara (para brillos de borde)."""
    eroded = mask.filter(ImageFilter.MinFilter(width * 2 + 1))
    band = Image.new("L", mask.size, 0)
    from PIL import ImageChops

    return ImageChops.subtract(eroded, mask)


# --------------------------------------------------------------------------
# Componentes de layout
# --------------------------------------------------------------------------
def brand_lockup(
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    size: int = 20,
    color=MUTED_2,
    mark_color=ACCENT,
    anchor: str = "la",
    tracking: int = 4,
) -> None:
    """Marca de agua: cuadrado con ruta + texto TALLER DE RUTA."""
    label_font = font(size, "bold")
    text = "TALLER DE RUTA"
    text_w = text_width(label_font, text, tracking)
    mark = int(size * 1.35)

    if anchor[0] == "m":
        x -= (text_w + mark + size * 0.9) / 2
    elif anchor[0] == "r":
        x -= text_w + mark + size * 0.9

    box = [x, y, x + mark, y + mark]
    draw.rounded_rectangle(box, radius=int(mark * 0.28), fill=mark_color)
    # glifo: carretera en perspectiva
    inset = mark * 0.24
    draw.polygon(
        [
            (x + inset, y + mark - inset),
            (x + mark * 0.38, y + inset),
            (x + mark * 0.62, y + inset),
            (x + mark - inset, y + mark - inset),
        ],
        fill=INK,
    )
    dash = max(2, int(mark * 0.09))
    draw.line(
        [(x + mark * 0.5, y + inset + mark * 0.08), (x + mark * 0.5, y + mark - inset - mark * 0.06)],
        fill=mark_color,
        width=dash,
    )
    draw_tracked(
        draw,
        (x + mark + size * 0.9, y + mark / 2),
        text,
        label_font,
        color,
        tracking,
        anchor="lm",
    )


def price_pill(
    base: Image.Image,
    draw: ImageDraw.ImageDraw,
    center_x: float,
    center_y: float,
    price_text: str,
    radius: int = 29,
    price_size: int = 34,
    pad_x: int = 34,
) -> float:
    """Pill de precio (acento) centrada. Devuelve la mitad del ancho."""
    price_font = font(price_size, "bold")
    text_w = price_font.getlength(price_text)
    total_w = text_w + pad_x * 2
    box = [
        center_x - total_w / 2,
        center_y - radius,
        center_x + total_w / 2,
        center_y + radius,
    ]
    mask = mask_from(base.size, lambda d: d.rounded_rectangle(box, radius=radius, fill=255))
    gradient_shape(base, mask, ACCENT_HOVER, ACCENT, angle=90)
    draw.text((center_x, center_y), price_text, font=price_font, fill=INK, anchor="mm")
    return total_w / 2


def soft_panel(
    base: Image.Image,
    box: list[int],
    radius: int = 28,
    fill=(255, 255, 255, 16),
    border=(255, 255, 255, 26),
) -> None:
    """Panel translucido tipo tarjeta."""
    x0, y0, x1, y1 = box
    draw = ImageDraw.Draw(base, "RGBA")
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=border, width=2)


def rounded_outline(
    draw: ImageDraw.ImageDraw,
    box: list[int],
    radius: int,
    color,
    width: int = 3,
) -> None:
    draw.rounded_rectangle(box, radius=radius, outline=color, width=width)


def hairline(draw: ImageDraw.ImageDraw, x0: float, y: float, x1: float, color, width: int = 2) -> None:
    draw.line([(x0, y), (x1, y)], fill=color, width=width)


def accent_bar(draw: ImageDraw.ImageDraw, cx: float, y: float, width: int = 88, height: int = 6) -> None:
    draw.rounded_rectangle(
        [cx - width / 2, y, cx + width / 2, y + height], radius=height / 2, fill=ACCENT
    )


def dashed_line(
    draw: ImageDraw.ImageDraw,
    points: list[tuple[float, float]],
    color,
    width: int = 2,
    dash: int = 14,
    gap: int = 10,
) -> None:
    """Linea punteada sobre una polilinea."""
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        length = math.hypot(x1 - x0, y1 - y0)
        if length == 0:
            continue
        ux, uy = (x1 - x0) / length, (y1 - y0) / length
        pos = 0.0
        while pos < length:
            end = min(pos + dash, length)
            draw.line(
                [(x0 + ux * pos, y0 + uy * pos), (x0 + ux * end, y0 + uy * end)],
                fill=color,
                width=width,
            )
            pos = end + gap


def arrow_head(
    draw: ImageDraw.ImageDraw,
    tip: tuple[float, float],
    angle: float,
    size: float,
    color,
) -> None:
    """Punta de flecha triangular."""
    left = (tip[0] - size * math.cos(angle - 0.42), tip[1] - size * math.sin(angle - 0.42))
    right = (tip[0] - size * math.cos(angle + 0.42), tip[1] - size * math.sin(angle + 0.42))
    draw.polygon([tip, left, right], fill=color)


def circle_arc(
    draw: ImageDraw.ImageDraw,
    center: tuple[float, float],
    radius: float,
    start: float,
    end: float,
    color,
    width: int = 6,
) -> None:
    box = [
        center[0] - radius,
        center[1] - radius,
        center[0] + radius,
        center[1] + radius,
    ]
    draw.arc(box, start, end, fill=color, width=width)
