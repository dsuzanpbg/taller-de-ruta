"""
Ilustraciones vectoriales de los 14 productos de "Taller de Ruta".

Son dibujos hechos con PIL (no fotos): representan cada producto de forma
reconocible con estilo de hardware premium (aluminio, goma y plastico). Se
generan con licencia propia, sin usar material de marcas ni de proveedores.

Cada funcion dibuja sobre un lienzo canonico de 1000x1000 y se reescala al
tamaño final con alfa premultiplicado (brand_kit.resize_rgba).
"""

from __future__ import annotations

import math
from functools import lru_cache

from PIL import Image, ImageChops, ImageDraw, ImageFilter

from brand_kit import (
    ACCENT,
    ACCENT_HOVER,
    ACCENT_SOFT,
    BODY_D,
    BODY_HL,
    BODY_L,
    BODY_M,
    CREAM,
    GLASS,
    INK,
    INK_2,
    LINE,
    LINE_2,
    MUTED,
    MUTED_2,
    RUBBER,
    STEEL,
    STEEL_D,
    SUCCESS,
    font,
    draw_tracked,
    text_width,
)

CANVAS = 1000


# --------------------------------------------------------------------------
# Lienzo con utilidades de relleno
# --------------------------------------------------------------------------
class Canvas:
    def __init__(self, size: int = CANVAS) -> None:
        self.size = size
        self.img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        self.draw = ImageDraw.Draw(self.img)

    # -- mascaras ---------------------------------------------------------
    def mask_rect(self, box, box2=None, radius: int = 0) -> Image.Image:
        """Acepta (x0, y0, x1, y1) o dos esquinas (x0, y0), (x1, y1)."""
        if box2 is not None:
            box = (box[0], box[1], box2[0], box2[1])
        mask = Image.new("L", (self.size, self.size), 0)
        d = ImageDraw.Draw(mask)
        if radius:
            d.rounded_rectangle(box, radius=radius, fill=255)
        else:
            d.rectangle(box, fill=255)
        return mask

    def mask_ellipse(self, box, box2=None) -> Image.Image:
        if box2 is not None:
            box = (box[0], box[1], box2[0], box2[1])
        mask = Image.new("L", (self.size, self.size), 0)
        ImageDraw.Draw(mask).ellipse(box, fill=255)
        return mask

    def mask_poly(self, points) -> Image.Image:
        mask = Image.new("L", (self.size, self.size), 0)
        ImageDraw.Draw(mask).polygon(points, fill=255)
        return mask

    def mask_lines(self, points, width: int, joint: str = "curve") -> Image.Image:
        mask = Image.new("L", (self.size, self.size), 0)
        ImageDraw.Draw(mask).line(points, fill=255, width=width, joint=joint)
        return mask

    @staticmethod
    def cut(mask: Image.Image, other: Image.Image) -> Image.Image:
        return ImageChops.subtract(mask, other)

    # -- rellenos ---------------------------------------------------------
    def fill(self, mask: Image.Image, c0, c1=None, angle: float = 90.0, alpha: int = 255) -> None:
        from brand_kit import linear_gradient

        if c1 is None:
            c1 = c0
        gradient = linear_gradient(self.size, self.size, c0, c1, angle)
        layer = Image.new("RGBA", (self.size, self.size), (0, 0, 0, 0))
        layer.paste(gradient, (0, 0))
        a = mask if alpha == 255 else mask.point(lambda v: int(v * alpha / 255))
        layer.putalpha(a)
        self.img.alpha_composite(layer)

    def stroke(self, box, radius: int, color, width: int = 3) -> None:
        self.draw.rounded_rectangle(box, radius=radius, outline=color, width=width)

    def line(self, points, color=None, width: int = 6, joint: str = "curve", fill=None) -> None:
        self.draw.line(points, fill=fill if fill is not None else color, width=width, joint=joint)

    def ellipse(self, box, outline=None, fill=None, width: int = 3) -> None:
        self.draw.ellipse(box, outline=outline, fill=fill, width=width)

    def rect(self, box, outline=None, fill=None, width: int = 3) -> None:
        self.draw.rectangle(box, outline=outline, fill=fill, width=width)


def _teardrop(c: Canvas, x: float, y: float, size: float, color, alpha: int = 200) -> None:
    """Gota de lluvia."""
    mask = c.mask_ellipse([x - size * 0.5, y - size * 0.28, x + size * 0.5, y + size * 0.72])
    tip = c.mask_poly(
        [(x, y - size * 0.75), (x - size * 0.42, y - size * 0.05), (x + size * 0.42, y - size * 0.05)]
    )
    c.fill(ImageChops.lighter(mask, tip), color, color, 90, alpha)


def _screw(c: Canvas, x: float, y: float, r: float, color=STEEL) -> None:
    c.ellipse([x - r, y - r, x + r, y + r], fill=color)
    c.line([(x - r * 0.55, y), (x + r * 0.55, y)], fill=BODY_D, width=max(2, int(r * 0.28)))


def _annotation(c: Canvas, x: float, y: float, text: str, color=MUTED, size: int = 30, anchor: str = "lm") -> None:
    f = font(size, "bold")
    draw_tracked(c.draw, (x, y), text, f, color, int(size * 0.06), anchor=anchor)


# --------------------------------------------------------------------------
# 1. Kit soporte antivibracion 360
# --------------------------------------------------------------------------
def art_phone_mount(c: Canvas) -> None:
    # Manubrio (tubo metallic con tapas)
    bar = c.mask_rect((60, 810), (940, 898), 44)
    c.fill(bar, (158, 170, 186), (26, 30, 36), 90)
    spec = c.mask_rect((110, 824), (890, 844), 10)
    c.fill(spec, (236, 244, 252), (236, 244, 252), 90, 140)
    c.fill(c.mask_rect((60, 810), (104, 898), 22), (104, 114, 130), (30, 34, 41), 90)
    c.fill(c.mask_rect((896, 810), (940, 898), 22), (104, 114, 130), (30, 34, 41), 90)

    # Abrazadera del manubrio (anillo de aluminio)
    ring = c.cut(c.mask_rect((392, 752), (608, 960), 56), c.mask_ellipse((438, 796), (562, 916)))
    c.fill(ring, (148, 160, 176), (40, 46, 55), 90)
    c.fill(c.mask_rect((392, 752), (608, 800), 24), (186, 198, 212), (70, 78, 90), 90)
    c.fill(c.mask_rect((392, 912), (608, 960), 24), (52, 60, 70), (22, 26, 32), 90)
    # Tornillo de apriete
    c.fill(c.mask_ellipse((560, 828, 620, 888)), (170, 180, 194), (52, 60, 70), 90)
    c.ellipse([578, 846, 602, 870], fill=(30, 34, 40))
    c.line([(578, 858), (602, 858)], fill=(96, 106, 120), width=5)

    # Post vertical
    c.fill(c.mask_rect((458, 620), (542, 800), 36), (74, 82, 94), (22, 26, 32), 90)
    for y in (664, 726):
        c.fill(c.mask_rect((448, y), (552, y + 26), 13), (128, 138, 154), (48, 55, 66), 90)
    c.fill(c.mask_rect((472, 626), (490, 794), 9), (150, 162, 178), (150, 162, 178), 90, 110)

    # Brazo posterior hacia el soporte
    c.fill(c.mask_rect((468, 470), (532, 560), 28), (58, 66, 78), (20, 24, 30), 90)

    # Amortiguador (bellows) en el punto de union
    for w, y in ((150, 516), (128, 556), (106, 596)):
        c.fill(c.mask_rect((500 - w / 2, y), (500 + w / 2, y + 38), 19), ACCENT_HOVER, (168, 58, 0), 90)
    c.fill(c.mask_rect((486, 508), (514, 528), 10), (128, 138, 154), (48, 55, 66), 90)
    c.fill(c.mask_rect((486, 624), (514, 646), 10), (128, 138, 154), (48, 55, 66), 90)

    # Cuerpo del soporte (detras del telefono)
    body = c.mask_rect((352, 108), (648, 506), 46)
    c.fill(body, BODY_M, BODY_D, 90)
    c.fill(c.mask_rect((352, 108), (648, 166), 34), (86, 96, 112), (40, 46, 55), 90)

    # Telefono
    phone = c.mask_rect((376, 86), (624, 492), 36)
    c.fill(phone, (52, 59, 70), (18, 21, 26), 90)
    screen = c.mask_rect((394, 104), (606, 474), 24)
    c.fill(screen, (23, 29, 38), (13, 16, 21), 90)
    # mapa de fondo
    for gx in range(410, 600, 46):
        c.fill(c.mask_rect((gx, 120), (gx + 2, 460), 1), (44, 54, 68), (44, 54, 68), 90, 150)
    for gy in range(150, 470, 46):
        c.fill(c.mask_rect((404, gy), (596, gy + 2), 1), (44, 54, 68), (44, 54, 68), 90, 150)
    # ruta
    c.line([(432, 436), (474, 372), (458, 306), (528, 244), (566, 176)], ACCENT, 10)
    c.ellipse([552, 160, 584, 192], fill=ACCENT)
    c.ellipse([420, 424, 446, 450], fill=SUCCESS)
    # barra de estado
    c.fill(c.mask_rect((410, 118), (466, 130), 6), (96, 108, 126), (96, 108, 126), 90, 230)
    c.fill(c.mask_rect((556, 118), (592, 130), 6), (96, 108, 126), (96, 108, 126), 90, 180)

    # Abrazaderas de cuatro esquinas
    for cx, cy in ((376, 86), (624, 86), (376, 492), (624, 492)):
        pad = c.mask_rect((cx - 46, cy - 46), (cx + 46, cy + 46), 18)
        c.fill(pad, BODY_L, BODY_D, 90)
        c.ellipse([cx - 11, cy - 11, cx + 11, cy + 11], fill=ACCENT)
    # brazos laterales
    c.fill(c.mask_rect((328, 246), (390, 292), 20), BODY_L, BODY_D, 90)
    c.fill(c.mask_rect((610, 246), (672, 292), 20), BODY_L, BODY_D, 90)

    # Sujecador de cable
    c.fill(c.mask_rect((640, 286), (684, 350), 16), ACCENT, (176, 62, 0), 90)
    c.line([(662, 342), (704, 470), (664, 620), (622, 700)], (60, 68, 80), 12)
    c.fill(c.mask_rect((602, 690), (642, 730), 14), ACCENT_HOVER, (176, 62, 0), 90)

    # Indicador de rotacion 360
    cx0, cy0, r = 500, 288, 252
    c.draw.arc((cx0 - r, cy0 - r, cx0 + r, cy0 + r), start=148, end=212, fill=ACCENT, width=8)
    tip = (cx0 + r * math.cos(math.radians(212)), cy0 + r * math.sin(math.radians(212)))
    base_ang = math.radians(212) + math.pi / 2
    c.draw.polygon(
        [
            tip,
            (tip[0] - 30 * math.cos(base_ang - 0.5), tip[1] - 30 * math.sin(base_ang - 0.5)),
            (tip[0] - 30 * math.cos(base_ang + 0.5), tip[1] - 30 * math.sin(base_ang + 0.5)),
        ],
        fill=ACCENT,
    )
    _annotation(c, 196, cy0, "360°", ACCENT, 40, "rm")


# --------------------------------------------------------------------------
# 2. Soporte impermeable con base de espejo
# --------------------------------------------------------------------------
def art_phone_waterproof(c: Canvas) -> None:
    # Base de espejo
    c.fill(c.mask_ellipse((626, 54, 884, 204)), (96, 116, 138), (36, 44, 56), 90)
    c.fill(c.mask_ellipse((646, 68, 864, 190)), (156, 184, 210), (86, 104, 124), 90)
    c.line([(676, 168), (840, 92)], (222, 234, 246), 7)
    # vastago del espejo
    c.fill(c.mask_poly([(690, 186), (742, 214), (620, 372), (572, 344)]), (112, 124, 140), (44, 50, 60), 90)
    c.fill(c.mask_rect((528, 318), (624, 392), 26), BODY_L, BODY_D, 90)
    c.fill(c.mask_rect((548, 330), (604, 380), 18), ACCENT, (176, 62, 0), 90)

    # Carcasa impermeable
    case = c.mask_rect((300, 356), (652, 800), 44)
    c.fill(case, (74, 96, 120), (30, 38, 48), 90)
    inner = c.mask_rect((324, 380), (628, 776), 30)
    c.fill(inner, (128, 158, 190), (58, 74, 94), 90, 150)
    # telefono dentro
    c.fill(c.mask_rect((366, 412), (586, 746), 22), (34, 40, 50), (18, 22, 28), 90)
    c.line([(392, 690), (432, 622), (418, 568), (480, 508), (522, 454)], (70, 80, 96), 8)
    # membrana: reflejo diagonal
    c.fill(c.mask_poly([(354, 756), (464, 396), (514, 396), (404, 756)]), (235, 244, 252), (235, 244, 252), 90, 60)
    # sello perimetral
    for band in (
        c.mask_rect((300, 356), (652, 398), 21),
        c.mask_rect((300, 758), (652, 800), 21),
        c.mask_rect((300, 356), (332, 800), 16),
        c.mask_rect((620, 356), (652, 800), 16),
    ):
        c.fill(band, (36, 44, 54), (18, 21, 26), 90)
    # cierre rapido
    c.fill(c.mask_rect((432, 784), (526, 830), 18), ACCENT_HOVER, (176, 62, 0), 90)
    c.ellipse([462, 792, 496, 822], fill=(24, 28, 34))

    # Gotas
    for x, y, s in ((232, 292, 46), (744, 322, 40), (190, 520, 36), (786, 610, 44), (250, 760, 32)):
        _teardrop(c, x, y, s, (150, 186, 220), 170)


# --------------------------------------------------------------------------
# 3. Punos universales 22 / 25 mm
# --------------------------------------------------------------------------
def art_grips(c: Canvas) -> None:
    # Manubrio
    bar = c.mask_rect((80, 452), (920, 552), 50)
    c.fill(bar, (128, 140, 156), (30, 34, 41), 90)
    c.fill(c.mask_rect((120, 470), (880, 492), 11), (214, 226, 238), (214, 226, 238), 90, 110)

    for side, x0, x1 in (("izq", 92, 344), ("der", 656, 908)):
        grip = c.mask_rect((x0, 424), (x1, 580), 50)
        c.fill(grip, (44, 50, 60), (16, 19, 24), 90)
        # acanaladuras
        step = 34
        x = x0 + 26
        while x < x1 - 20:
            c.fill(c.mask_rect((x, 438), (x + 12, 566), 6), (70, 79, 92), (32, 37, 46), 90)
            x += step
        # realce del puño
        c.fill(c.mask_rect((x0 + 6, 424), (x0 + 54, 580), 26), (58, 66, 78), (24, 27, 33), 90)
        # aro de acento en el lado interior
        inner_x = x1 - 26 if side == "izq" else x0
        c.fill(c.mask_rect((inner_x - 12, 428), (inner_x + 12, 576), 12), ACCENT, (176, 62, 0), 90)
        # tapa del extremo
        cap_x = x0 if side == "izq" else x1
        c.fill(c.mask_rect((cap_x - 6, 430), (cap_x + 30, 574), 24), (66, 74, 86), (28, 32, 40), 90)

    # Conector central
    c.fill(c.mask_rect((430, 438), (570, 566), 26), BODY_M, BODY_D, 90)

    # Cota de medida
    c.line([(92, 700), (908, 700)], LINE_2, 3)
    for x in (92, 908):
        c.line([(x, 676), (x, 724)], MUTED_2, 3)
    c.fill(c.mask_rect((360, 676), (640, 724), 20), INK_2, INK_2, 90)
    _annotation(c, 500, 700, "22 / 25 mm", MUTED, 30, "mm")


# --------------------------------------------------------------------------
# 4. Mochila impermeable 25L
# --------------------------------------------------------------------------
def art_backpack(c: Canvas) -> None:
    # Tirantes traseros
    for sx in (330, 670):
        c.fill(c.mask_poly([(sx - 40, 300), (sx + 40, 300), (sx + 66, 560), (sx - 66, 560)]), (36, 42, 52), (20, 24, 30), 90)
    # Asa superior
    c.draw.arc((408, 180, 592, 340), start=180, end=360, fill=(92, 102, 118), width=26)
    # Cuerpo
    body = c.mask_poly([(300, 330), (700, 330), (734, 470), (716, 790), (284, 790), (266, 470)])
    c.fill(body, (46, 53, 64), (18, 21, 27), 90)
    # Cierre enrollable
    c.fill(c.mask_rect((286, 258), (714, 352), 44), (68, 78, 92), (30, 35, 44), 90)
    for x in (352, 434, 516, 598):
        c.fill(c.mask_rect((x, 268), (x + 12, 342), 6), (22, 26, 32), (22, 26, 32), 90, 190)
    c.fill(c.mask_rect((286, 330), (714, 360), 14), (24, 28, 34), (24, 28, 34), 90, 220)
    # Bolsillo frontal
    c.fill(c.mask_rect((356, 520), (644, 742), 30), (58, 66, 78), (26, 30, 37), 90)
    c.line([(366, 566), (634, 566)], (150, 160, 174), 7)
    c.fill(c.mask_rect((600, 570), (628, 604), 8), ACCENT, (176, 62, 0), 90)
    # Correas de compresion
    for y in (392, 690):
        c.fill(c.mask_rect((266, y), (734, y + 26), 12), (34, 40, 49), (20, 23, 29), 90)
    # Hebillas
    for x in (392, 570):
        c.fill(c.mask_rect((x, 378), (x + 38, 424), 10), ACCENT, (176, 62, 0), 90)
    # Base
    c.fill(c.mask_rect((284, 764), (716, 812), 24), (24, 28, 34), (14, 16, 20), 90)


# --------------------------------------------------------------------------
# 5. Alforjas impermeables
# --------------------------------------------------------------------------
def art_saddlebags(c: Canvas) -> None:
    # Punto de anclaje (asiento / defensa)
    c.fill(c.mask_rect((436, 232), (564, 296), 26), (58, 66, 78), (24, 28, 34), 90)
    # Bandas elasticas hacia las bolsas
    for x0, y0, x1, y1 in (
        (452, 286, 300, 404),
        (474, 286, 362, 404),
        (526, 286, 638, 404),
        (548, 286, 700, 404),
    ):
        c.line([(x0, y0), (x1, y1)], (50, 58, 70), 18)

    for sx in (330, 670):
        bag = c.mask_poly(
            [(sx - 148, 402), (sx + 148, 402), (sx + 164, 540), (sx + 140, 806), (sx - 140, 806), (sx - 164, 540)]
        )
        c.fill(bag, (48, 55, 66), (20, 23, 29), 90)
        # tapa
        c.fill(c.mask_rect((sx - 152, 396), (sx + 152, 470), 26), (74, 84, 98), (34, 39, 48), 90)
        c.fill(c.mask_rect((sx - 24, 424), (sx + 24, 470), 10), ACCENT, (176, 62, 0), 90)
        # costura
        c.line([(sx - 128, 500), (sx + 128, 500)], (110, 120, 134), 6)
        # reflectivo
        c.fill(c.mask_rect((sx - 160, 560), (sx + 160, 584), 12), (232, 238, 244), (232, 238, 244), 90, 210)
        # fuelle inferior
        c.fill(c.mask_rect((sx - 142, 780), (sx + 142, 818), 18), (26, 30, 36), (16, 19, 24), 90)
        # remaches de la tapa
        for rx in (sx - 120, sx + 120):
            c.ellipse([rx - 9, 423, rx + 9, 441], fill=(150, 160, 174))


# --------------------------------------------------------------------------
# 6. Bolsa de pierna impermeable
# --------------------------------------------------------------------------
def art_leg_bag(c: Canvas) -> None:
    # Muslo (silueta neutra) al fondo
    thigh = c.mask_poly(
        [(316, 40), (664, 40), (706, 520), (676, 930), (300, 930), (276, 520)]
    )
    c.fill(thigh, (48, 54, 64), (22, 26, 32), 90)
    c.fill(c.mask_poly([(330, 60), (386, 60), (356, 910), (312, 910)]), (86, 96, 112), (86, 96, 112), 90, 60)

    # Correas de la pierna
    for y in (312, 700):
        c.fill(c.mask_rect((272, y), (712, y + 60), 30), (62, 70, 82), (28, 32, 40), 90)
        c.fill(c.mask_rect((272, y), (712, y + 16), 8), (96, 106, 122), (96, 106, 122), 90, 150)
    # hebillas
    for y in (306, 694):
        c.fill(c.mask_rect((560, y), (628, y + 68), 12), ACCENT, (176, 62, 0), 90)

    # Bolsa
    bag = c.mask_poly([(318, 386), (682, 386), (708, 480), (686, 686), (314, 686), (292, 480)])
    c.fill(bag, (50, 58, 69), (22, 26, 32), 90)
    c.fill(c.mask_rect((288, 380), (712, 444), 30), (78, 88, 102), (36, 41, 50), 90)
    c.fill(c.mask_rect((450, 398), (538, 446), 12), ACCENT, (176, 62, 0), 90)
    # Linea de cierre impermeable
    c.line([(306, 482), (694, 482)], (120, 130, 144), 7)
    # Telefono en el compartimento
    c.fill(c.mask_rect((540, 508), (646, 634), 14), (30, 36, 44), (18, 21, 27), 90)
    c.fill(c.mask_rect((552, 520), (634, 622), 8), (62, 72, 86), (62, 72, 86), 90, 150)
    # Documento
    c.fill(c.mask_rect((330, 508), (462, 618), 10), (196, 204, 214), (150, 158, 170), 90)
    for i in range(4):
        c.fill(c.mask_rect((346, 530 + i * 22), (446 - i * 14, 538 + i * 22), 4), (90, 98, 110), (90, 98, 110), 90, 200)
    # Reflectivo
    c.fill(c.mask_rect((330, 640), (486, 662), 11), (232, 238, 244), (232, 238, 244), 90, 200)


# --------------------------------------------------------------------------
# 7. Bolsa de herramientas
# --------------------------------------------------------------------------
def art_tool_roll(c: Canvas) -> None:
    roll = c.mask_rect((112, 372), (884, 676), 34)
    c.fill(roll, (58, 64, 56), (24, 27, 24), 90)
    # separaciones elasticas
    for x in (250, 390, 530, 670):
        c.fill(c.mask_rect((x, 372), (x + 22, 676), 10), (26, 30, 28), (16, 18, 17), 90)
    # herramientas
    c.fill(c.mask_rect((140, 404), (232, 452), 16), (156, 166, 178), (86, 94, 106), 90)
    c.fill(c.mask_rect((268, 400), (300, 560), 12), (176, 186, 198), (92, 100, 112), 90)
    c.fill(c.mask_rect((300, 392), (370, 412), 10), (150, 158, 170), (86, 94, 106), 90)
    c.fill(c.mask_rect((408, 396), (500, 416), 10), (150, 158, 170), (86, 94, 106), 90)
    c.fill(c.mask_rect((548, 400), (596, 570), 14), (166, 176, 188), (92, 100, 112), 90)
    c.fill(c.mask_rect((696, 404), (700, 560), 8), (166, 176, 188), (92, 100, 112), 90)
    c.fill(c.mask_rect((690, 396), (760, 418), 10), (150, 158, 170), (86, 94, 106), 90)
    # rolled end
    c.fill(c.mask_ellipse((820, 372, 960, 676)), (68, 74, 66), (28, 32, 28), 90)
    c.draw.arc((846, 400, 934, 648), start=0, end=360, fill=(92, 100, 92), width=6)
    # correa
    c.fill(c.mask_rect((96, 470), (150, 570), 16), ACCENT, (176, 62, 0), 90)
    c.fill(c.mask_rect((84, 452), (162, 492), 14), (70, 78, 90), (34, 39, 48), 90)


# --------------------------------------------------------------------------
# 8. Cubre moto impermeable
# --------------------------------------------------------------------------
def art_bike_cover(c: Canvas) -> None:
    # Ruedas insinuadas debajo
    for cx in (300, 730):
        c.fill(c.mask_ellipse((cx - 158, 560, cx + 158, 876)), (20, 23, 29), (10, 12, 16), 90)
    # Retrovisor que sobresale
    c.fill(c.mask_ellipse((690, 214, 790, 280)), (92, 104, 120), (36, 42, 52), 90)
    c.line([(700, 276), (676, 330)], (70, 78, 90), 10)
    # Funda sobre la moto
    cover = c.mask_poly(
        [
            (132, 726), (136, 590), (186, 496), (268, 448), (372, 424), (470, 404),
            (566, 372), (664, 352), (742, 372), (812, 442), (848, 546), (852, 726),
        ]
    )
    c.fill(cover, (60, 68, 80), (18, 21, 27), 90)
    # Pliegues
    for pts in (
        [(268, 448), (300, 540), (272, 690)],
        [(470, 404), (498, 520), (470, 690)],
        [(700, 380), (730, 500), (706, 690)],
    ):
        c.line(pts, (88, 98, 114), 6)
    # Costura reflectiva
    c.line([(196, 640), (420, 606), (700, 616), (830, 656)], (226, 232, 240), 6)
    # Dobladillo inferior
    c.fill(c.mask_rect((132, 692), (852, 742), 22), (30, 35, 43), (14, 17, 21), 90)
    # Hebilla antiviento
    c.fill(c.mask_rect((560, 718), (646, 764), 12), ACCENT, (176, 62, 0), 90)
    c.fill(c.mask_rect((578, 728), (628, 754), 8), (28, 32, 38), (28, 32, 38), 90)
    # Correa que pasa por debajo
    c.line([(604, 742), (676, 796), (790, 810)], (44, 50, 60), 16)
    # Gotas
    for x, y, s in ((104, 330, 40), (930, 372, 36), (70, 506, 30), (952, 560, 32)):
        _teardrop(c, x, y, s, (150, 186, 220), 150)


# --------------------------------------------------------------------------
# 9. Cubre punos / handguards
# --------------------------------------------------------------------------
def art_handguards(c: Canvas) -> None:
    # Manubrio
    bar = c.mask_rect((120, 430), (880, 528), 48)
    c.fill(bar, (128, 140, 156), (30, 34, 41), 90)
    c.fill(c.mask_rect((160, 448), (840, 468), 10), (214, 226, 238), (214, 226, 238), 90, 110)

    for sx in (296, 704):
        # brazo de montaje
        c.fill(c.mask_rect((sx - 26, 400), (sx + 26, 470), 16), BODY_L, BODY_D, 90)
        # placa del protector
        plate = c.mask_poly(
            [(sx - 118, 470), (sx + 118, 470), (sx + 96, 700), (sx - 96, 700)]
        )
        c.fill(plate, (64, 73, 86), (22, 26, 32), 90)
        c.fill(c.mask_poly([(sx - 118, 470), (sx + 118, 470), (sx + 108, 512), (sx - 108, 512)]), (96, 106, 122), (44, 50, 60), 90)
        # reflejo
        c.fill(c.mask_poly([(sx - 92, 520), (sx - 46, 520), (sx - 68, 680), (sx - 100, 680)]), (236, 244, 252), (236, 244, 252), 90, 55)
        # borde de acento
        c.line([(sx - 118, 470), (sx - 96, 700)], ACCENT, 8)
        c.line([(sx + 118, 470), (sx + 96, 700)], ACCENT, 8)
        # remache
        c.ellipse([sx - 14, 490, sx + 14, 518], fill=(150, 160, 174))
        c.ellipse([sx - 6, 498, sx + 6, 510], fill=BODY_D)


# --------------------------------------------------------------------------
# 10. Candado de disco con cable recordatorio
# --------------------------------------------------------------------------
def art_disc_lock(c: Canvas) -> None:
    # Manubrio al que se engancha el cable recordatorio
    c.fill(c.mask_rect((90, 96), (520, 156), 30), (140, 152, 168), (34, 38, 46), 90)
    c.fill(c.mask_rect((120, 110), (490, 124), 7), (222, 232, 244), (222, 232, 244), 90, 120)

    # Disco de freno
    disc = c.mask_ellipse((236, 176, 764, 704))
    c.fill(disc, (52, 60, 72), (22, 26, 32), 90)
    c.fill(c.mask_ellipse((296, 236, 704, 644)), (74, 84, 98), (30, 35, 43), 90)
    # perforaciones
    for i in range(12):
        a = i * math.pi / 6
        cx = 500 + 168 * math.cos(a)
        cy = 440 + 168 * math.sin(a)
        c.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=(16, 19, 24))
    c.ellipse([420, 360, 580, 520], fill=(30, 35, 43))
    for i in range(5):
        a = i * math.pi * 2 / 5 - math.pi / 2
        c.draw.line(
            [(500, 440), (500 + 70 * math.cos(a), 440 + 70 * math.sin(a))],
            fill=(96, 106, 122),
            width=18,
        )

    # Cuerpo del candado
    body = c.mask_rect((236, 470), (764, 636), 44)
    c.fill(body, (46, 53, 64), (16, 19, 24), 90)
    c.fill(c.mask_rect((236, 470), (764, 522), 24), (96, 106, 122), (40, 46, 55), 90)
    # barra del perno
    c.fill(c.mask_rect((406, 500), (594, 606), 26), (140, 152, 168), (58, 66, 78), 90)
    c.fill(c.mask_rect((462, 512), (538, 594), 14), (188, 200, 214), (96, 106, 122), 90)
    # boton de bloqueo
    c.fill(c.mask_rect((612, 516), (704, 590), 26), ACCENT, (176, 62, 0), 90)
    c.ellipse([636, 534, 680, 572], fill=(30, 34, 40))

    # Cable recordatorio naranja (del candado al manubrio)
    cable = [
        (676, 520), (742, 470), (752, 360), (676, 268), (520, 208), (360, 168), (250, 138),
    ]
    c.draw.line(cable, fill=ACCENT, width=17, joint="curve")
    c.draw.line(cable, fill=ACCENT_HOVER, width=6, joint="curve")
    # Boquilla del cable en el manubrio
    c.fill(c.mask_rect((214, 110), (286, 168), 22), (110, 120, 136), (40, 46, 55), 90)


# --------------------------------------------------------------------------
# 11. Red elastica porta carga
# --------------------------------------------------------------------------
def art_cargo_net(c: Canvas) -> None:
    # Carga sostenida (mochila) atras de la red
    c.fill(c.mask_rect((356, 330), (644, 700), 48), (92, 104, 120), (40, 47, 57), 90)
    c.fill(c.mask_rect((410, 250), (590, 350), 38), (124, 138, 156), (54, 62, 74), 90)
    c.fill(c.mask_rect((420, 430), (580, 540), 16), (58, 66, 78), (28, 33, 40), 90)
    c.fill(c.mask_rect((486, 462), (514, 508), 10), ACCENT, (176, 62, 0), 90)
    c.fill(c.mask_rect((360, 560), (640, 592), 16), (176, 186, 200), (176, 186, 200), 90, 160)

    # Marco de la red (anillo)
    frame = c.cut(c.mask_rect((214, 214), (786, 786), 60), c.mask_rect((236, 236), (764, 764), 44))
    c.fill(frame, (58, 66, 78), (24, 28, 34), 90)
    c.draw.rounded_rectangle((214, 214, 786, 786), radius=60, outline=(128, 138, 154), width=10)

    # Malla elastica
    for i in range(5):
        off = 236 + i * 134
        c.draw.line([(off, 236), (off, 764)], fill=(92, 102, 116), width=10)
        c.draw.line([(236, off), (764, off)], fill=(92, 102, 116), width=10)
    for i in range(5):
        for j in range(5):
            cx = 236 + i * 134
            cy = 236 + j * 134
            c.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=(126, 138, 154))

    # Ganchos de metal
    for i in range(6):
        a = math.pi * 2 * i / 6 + math.pi / 6
        cx = 500 + 286 * math.cos(a)
        cy = 500 + 286 * math.sin(a)
        c.draw.arc((cx - 34, cy - 38, cx + 34, cy + 30), start=20, end=340, fill=STEEL, width=13)
        c.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=(196, 206, 220))


# --------------------------------------------------------------------------
# 12. Cepillo limpiador de cadena
# --------------------------------------------------------------------------
def art_chain_brush(c: Canvas) -> None:
    # Cadena en diagonal (eslabones alternados)
    angle = -0.32
    for i in range(9):
        t = -420 + i * 106
        cx = 500 + t * math.cos(angle) - 300 * math.sin(angle)
        cy = 620 + t * math.sin(angle) + 300 * math.cos(angle)
        c.draw.rounded_rectangle((cx - 48, cy - 30, cx + 48, cy + 30), radius=14, fill=(136, 148, 164))
        c.draw.rounded_rectangle((cx - 48, cy - 4, cx + 48, cy + 28), radius=11, fill=(86, 96, 110))
        c.ellipse([cx - 13, cy - 9, cx + 13, cy + 17], fill=(38, 44, 53))

    # Cepillo: mango
    c.fill(c.mask_rect((110, 300), (330, 376), 38), (52, 60, 72), (20, 24, 30), 90)
    c.fill(c.mask_rect((132, 318), (300, 338), 10), (124, 136, 152), (124, 136, 152), 90, 120)
    # Cuerpo del cepillo
    c.fill(c.mask_rect((300, 246), (704, 496), 42), (58, 66, 78), (22, 26, 32), 90)
    c.fill(c.mask_rect((300, 246), (704, 296), 26), (92, 102, 118), (40, 46, 55), 90)
    # Cerdas en tres caras
    for x in range(322, 690, 26):
        c.fill(c.mask_rect((x, 496), (x + 12, 586), 6), (140, 150, 164), (90, 98, 112), 90)
    for x in range(322, 690, 26):
        c.fill(c.mask_rect((x, 206), (x + 12, 246), 6), (140, 150, 164), (90, 98, 112), 90)
    for y in range(284, 466, 26):
        c.fill(c.mask_rect((704, y), (792, y + 12), 6), (140, 150, 164), (90, 98, 112), 90)
    # Cerdas frontales
    for x in range(322, 690, 30):
        c.fill(c.mask_rect((x, 300), (x + 12, 492), 6), (110, 120, 134), (64, 72, 84), 90)
    # Acento
    c.fill(c.mask_rect((300, 246), (704, 264), 9), ACCENT, (176, 62, 0), 90)


# --------------------------------------------------------------------------
# 13. Stickers genericos
# --------------------------------------------------------------------------
def art_stickers(c: Canvas) -> None:
    def star(cx, cy, r, color):
        pts = []
        for i in range(10):
            ang = -math.pi / 2 + i * math.pi / 5
            rad = r if i % 2 == 0 else r * 0.45
            pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
        c.fill(c.mask_poly(pts), color, color, 90)

    def bolt(cx, cy, s, color):
        pts = [
            (cx + s * 0.16, cy - s), (cx - s * 0.52, cy + s * 0.14), (cx - s * 0.06, cy + s * 0.14),
            (cx - s * 0.18, cy + s), (cx + s * 0.54, cy - s * 0.18), (cx + s * 0.06, cy - s * 0.18),
        ]
        c.fill(c.mask_poly(pts), color, color, 90)

    def mountain(cx, cy, s, color):
        pts = [(cx - s, cy + s * 0.7), (cx - s * 0.25, cy - s * 0.7), (cx + s * 0.15, cy + s * 0.02),
               (cx + s * 0.42, cy - s * 0.42), (cx + s, cy + s * 0.7)]
        c.fill(c.mask_poly(pts), color, color, 90)

    def chevrons(cx, cy, s, color):
        for k in range(3):
            c.draw.line([(cx - s, cy - s * 0.5 + k * s * 0.5), (cx, cy + s * 0.1 + k * s * 0.5),
                         (cx + s, cy - s * 0.5 + k * s * 0.5)], fill=color, width=int(s * 0.16), joint="curve")

    # Hoja de backing
    sheet = c.mask_rect((128, 150), (628, 650), 26)
    c.fill(sheet, (240, 242, 246), (202, 206, 214), 90)
    c.fill(c.mask_rect((128, 150), (628, 168), 9), (255, 255, 255), (255, 255, 255), 90, 120)
    c.draw.rounded_rectangle((128, 150, 628, 650), radius=26, outline=(176, 182, 192), width=3)

    # Stickers sobre la hoja
    star(250, 290, 78, ACCENT)
    bolt(490, 290, 76, (28, 32, 38))
    mountain(250, 520, 86, (28, 32, 38))
    chevrons(490, 510, 74, ACCENT)

    # Stickers sueltos
    star(790, 300, 66, (28, 32, 38))
    c.fill(c.mask_ellipse((680, 430, 800, 550)), ACCENT, ACCENT, 90)
    c.draw.ellipse((706, 456, 774, 524), outline=(240, 242, 246), width=12)
    chevrons(800, 660, 86, (28, 32, 38))
    bolt(660, 730, 58, ACCENT)


# --------------------------------------------------------------------------
# 14. Stickers reflectivos
# --------------------------------------------------------------------------
def art_reflective(c: Canvas) -> None:
    # Superficie oscura (carenado / casco) donde van los reflectivos
    surface = c.mask_poly(
        [(150, 760), (150, 430), (300, 240), (560, 170), (800, 250), (880, 470), (880, 760)]
    )
    c.fill(surface, (58, 66, 78), (16, 19, 25), 90)
    c.fill(c.mask_poly([(150, 760), (150, 470), (330, 300), (420, 320), (300, 760)]), (96, 106, 122), (96, 106, 122), 90, 70)
    # Borde inferior del carenado
    c.fill(c.mask_rect((150, 736), (880, 772), 14), (26, 30, 37), (14, 17, 21), 90)

    # Haz de faros difuso
    beam = Image.new("RGBA", (c.size, c.size), (0, 0, 0, 0))
    ImageDraw.Draw(beam).polygon([(0, 520), (980, 130), (980, 910)], fill=(255, 246, 226, 70))
    beam = beam.filter(ImageFilter.GaussianBlur(70))
    c.img.alpha_composite(beam)

    def strip(cx, cy, w, h, color):
        """Franja reflectiva con corte diagonal y brillo metalico."""
        pts = [
            (cx - w, cy + h),
            (cx - w * 0.42, cy - h),
            (cx + w, cy - h),
            (cx + w * 0.58, cy + h),
        ]
        c.fill(c.mask_poly(pts), color, color, 90)
        pts2 = [
            (cx - w * 0.74, cy + h * 0.7),
            (cx - w * 0.34, cy - h * 0.7),
            (cx + w * 0.86, cy - h * 0.7),
            (cx + w * 0.54, cy + h * 0.7),
        ]
        c.fill(c.mask_poly(pts2), (255, 255, 255), (255, 255, 255), 90, 120)
        # borde
        c.draw.polygon(pts, outline=(120, 132, 148), width=3)

    strip(330, 400, 118, 130, (222, 228, 236))
    strip(620, 400, 118, 130, (222, 228, 236))
    strip(470, 640, 118, 130, ACCENT)


# --------------------------------------------------------------------------
# Escenas extra para los creativos
# --------------------------------------------------------------------------
def scene_motorcycle(c: Canvas, cx: float, cy: float, scale: float, color=(52, 60, 72)) -> None:
    """Moto de perfil, silueta simple."""
    def sc(value: float) -> float:
        return value * scale

    tire = (26, 30, 36)
    rim = (96, 106, 122)
    wheel_r = 92 * scale
    for wx in (cx - 190 * scale, cx + 190 * scale):
        c.fill(c.mask_ellipse((wx - wheel_r, cy - wheel_r, wx + wheel_r, cy + wheel_r)), (34, 39, 47), (18, 21, 26), 90)
        c.draw.ellipse((wx - wheel_r, cy - wheel_r, wx + wheel_r, cy + wheel_r), outline=tire, width=int(10 * scale) + 2)
        c.draw.ellipse((wx - wheel_r * 0.56, cy - wheel_r * 0.56, wx + wheel_r * 0.56, cy + wheel_r * 0.56), outline=rim, width=int(5 * scale) + 2)
        c.draw.ellipse((wx - 16 * scale, cy - 16 * scale, wx + 16 * scale, cy + 16 * scale), fill=rim)

    # Cuadro
    c.line(
        [
            (cx - 150 * scale, cy),
            (cx - 40 * scale, cy - 96 * scale),
            (cx + 40 * scale, cy - 92 * scale),
            (cx + 150 * scale, cy),
            (cx - 150 * scale, cy),
        ],
        color,
        int(16 * scale) + 4,
    )
    # Tanque
    c.fill(c.mask_poly([
        (cx - 70 * scale, cy - 92 * scale),
        (cx - 20 * scale, cy - 136 * scale),
        (cx + 62 * scale, cy - 128 * scale),
        (cx + 74 * scale, cy - 92 * scale),
    ]), (64, 73, 86), (30, 35, 43), 90)
    # Asiento
    c.fill(c.mask_poly([
        (cx - 96 * scale, cy - 108 * scale),
        (cx - 30 * scale, cy - 122 * scale),
        (cx - 24 * scale, cy - 98 * scale),
        (cx - 92 * scale, cy - 88 * scale),
    ]), (40, 46, 55), (22, 26, 32), 90)
    # Manubrio
    c.line([(cx + 92 * scale, cy - 120 * scale), (cx + 150 * scale, cy - 196 * scale)], color, int(13 * scale) + 3)
    c.draw.ellipse(
        (cx + 128 * scale, cy - 214 * scale, cx + 172 * scale, cy - 178 * scale),
        outline=(120, 132, 148),
        width=int(7 * scale) + 2,
    )
    # Faro
    c.fill(c.mask_ellipse((cx + 60 * scale, cy - 158 * scale, cx + 112 * scale, cy - 116 * scale)), (232, 238, 244), (150, 160, 174), 90)


def scene_rain(c: Canvas, width: int, height: int, count: int = 60, seed: int = 3) -> None:
    """Lluvia en diagonal."""
    import random

    rng = random.Random(seed)
    for _ in range(count):
        x = rng.uniform(-100, width + 100)
        y = rng.uniform(-100, height + 100)
        length = rng.uniform(30, 90)
        c.draw.line([(x, y), (x - length * 0.34, y + length)], fill=(150, 186, 220), width=2)


def scene_speed_lines(c: Canvas, width: int, height: int, count: int = 18, seed: int = 5) -> None:
    import random

    rng = random.Random(seed)
    for _ in range(count):
        y = rng.uniform(0, height)
        x = rng.uniform(-200, width)
        length = rng.uniform(80, 320)
        c.draw.line([(x, y), (x + length, y)], fill=(140, 150, 166), width=rng.choice([2, 3]))


# --------------------------------------------------------------------------
# Registro y render
# --------------------------------------------------------------------------
ART = {
    "phone-mount": art_phone_mount,
    "phone-waterproof": art_phone_waterproof,
    "grips": art_grips,
    "backpack": art_backpack,
    "saddlebags": art_saddlebags,
    "leg-bag": art_leg_bag,
    "tool-roll": art_tool_roll,
    "bike-cover": art_bike_cover,
    "handguards": art_handguards,
    "disc-lock": art_disc_lock,
    "cargo-net": art_cargo_net,
    "chain-brush": art_chain_brush,
    "stickers": art_stickers,
    "reflective": art_reflective,
}


# Rotacion (grados) aplicada al lienzo canonico de cada ilustracion
ROTATION = {
    "stickers": -7.0,
    "chain-brush": 4.0,
    "tool-roll": -3.0,
}


@lru_cache(maxsize=64)
def render_art(kind: str, size: int) -> Image.Image:
    """Dibuja la ilustracion y la devuelve escalada a `size` px (RGBA)."""
    from brand_kit import resize_rgba, shade_art

    canvas = Canvas(CANVAS)
    ART[kind](canvas)
    art = canvas.img
    angle = ROTATION.get(kind)
    if angle:
        art = art.rotate(angle, resample=Image.BICUBIC, center=(CANVAS / 2, CANVAS / 2))
    art = resize_rgba(art, (size, size))
    return shade_art(art, 0.85)


@lru_cache(maxsize=64)
def render_art_cropped(kind: str) -> Image.Image:
    """Ilustracion recortada a su contenido real (sin margenes vacios)."""
    from brand_kit import resize_rgba

    art = render_art(kind, 1000)
    mask = art.getchannel("A").point(lambda v: 255 if v > 10 else 0)
    bbox = mask.getbbox()
    if not bbox:
        return art
    pad = 8
    x0 = max(0, bbox[0] - pad)
    y0 = max(0, bbox[1] - pad)
    x1 = min(art.width, bbox[2] + pad)
    y1 = min(art.height, bbox[3] + pad)
    return art.crop((x0, y0, x1, y1))


def fit_art(kind: str, max_width: int, max_height: int) -> Image.Image:
    """Escala la ilustracion para que llene el espacio disponible."""
    from brand_kit import resize_rgba

    art = render_art_cropped(kind)
    scale = min(max_width / art.width, max_height / art.height)
    size = (max(1, int(art.width * scale)), max(1, int(art.height * scale)))
    return resize_rgba(art, size)


def render_art_alpha(kind: str, size: int) -> Image.Image:
    """Canal alfa de la ilustracion, para generar sombras."""
    return render_art(kind, size).getchannel("A")
