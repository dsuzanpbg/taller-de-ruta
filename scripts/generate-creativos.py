"""
Genera los creativos organicos de "Taller de Ruta" en store/public/creativos/.

Cada creativo es una pieza de venta lista para Reels/TikTok (1080x1920) o
Feed (1080x1080): gancho de texto grande, ilustracion del producto, precio y
llamada a la accion.

Ademas escribe store/scripts/CREATIVOS-GUIONES.txt con el guion (hook, cuerpo,
CTA y duracion sugerida) de cada pieza, para poder grabar los videos.

Uso:
    python store/scripts/generate-creativos.py
"""

from __future__ import annotations

import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))

from brand_art import fit_art, render_art, render_art_alpha  # noqa: E402
from brand_kit import (  # noqa: E402
    ACCENT,
    ACCENT_HOVER,
    ACCENT_SOFT,
    CREAM,
    INK,
    INK_2,
    LINE,
    LINE_2,
    MUTED,
    MUTED_2,
    SURFACE,
    apply_grain,
    brand_lockup,
    draw_rich_block,
    draw_tracked,
    font,
    gradient_shape,
    linear_gradient,
    mask_from,
    radial_gradient,
    save_png,
    soft_shadow,
    text_width,
    wrap_rich,
)

W, H = 1080, 1920
SQUARE = 1080
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "creativos"
GUIONES_PATH = Path(__file__).resolve().parent / "CREATIVOS-GUIONES.txt"

# --------------------------------------------------------------------------
# Contenido de los creativos
# --------------------------------------------------------------------------
# hook: el asterisco marca la(s) palabra(s) que van en color acento.
CREATIVOS: list[dict] = [
    {
        "file": "c01-kit-antivibracion-gancho-vibracion-1080x1920",
        "format": "vertical",
        "art": "phone-mount",
        "scene": "vibration",
        "kicker": "EL PROBLEMA DE TODO REPARTIDOR",
        "hook": "No es tu celular. *Es la vibración.*",
        "price": 599,
        "compare": 749,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "No es tu celular, es la vibración. Tu celular no se gira solo: el motor te lo está moviendo.",
            "cuerpo": "Sostén el celular con la mano en el semáforo y siente el temblor en los dedos. Ese mismo temblor es el que hace que un soporte rígido afloje el teléfono a los 20 minutos. Este kit tiene amortiguación en el punto de unión, que es justo donde se absorbe el golpe. Sujeta por las cuatro esquinas y gira 360 grados para cambiar de vertical a horizontal sin desmontar.",
            "cta": "Escribe por WhatsApp y te confirmamos si le queda a tu manubrio. Envío a todo México, 7 a 15 días hábiles.",
            "duracion": "18 s",
            "notas": "Graba el celular vibrando en el soporte y luego el mismo montaje sin amortiguación. Cierra con el kit en la mano.",
        },
    },
    {
        "file": "c02-kit-antivibracion-gancho-repartidor-1080x1920",
        "format": "vertical",
        "art": "phone-mount",
        "scene": "road",
        "kicker": "PARA QUIEN VIVE EN DOS RUEDAS",
        "hook": "Si repartes, *esto te cambia el día*",
        "price": 599,
        "compare": 749,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "Si repartes todo el día, esto te cambia el día.",
            "cuerpo": "La ruta se ve en el celular, el pedido se escucha por el audífono y la app no se cae a media esquina. El soporte va en manubrio o en la base del espejo, según tu moto. Trae sujecador de cable para que el cargador no se desconecte cuando pasas un tope.",
            "cta": "Mándanos WhatsApp con el modelo de tu moto y te decimos qué base va. 7 a 15 días hábiles.",
            "duracion": "20 s",
            "notas": "Muestra el celular navegando en el soporte y la app corriendo. Cierra con el cable sujeto.",
        },
    },
    {
        "file": "c03-kit-antivibracion-gancho-instalacion-1080x1920",
        "format": "vertical",
        "art": "phone-mount",
        "scene": "tools",
        "kicker": "INSTALACIÓN",
        "hook": "Se instala en 5 minutos, *sin taladrar*",
        "price": 599,
        "compare": 749,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "Se instala en 5 minutos, sin taladrar nada.",
            "cuerpo": "Aprieta la abrazadera en el manubrio, mete el brazo, ajusta el ángulo y ya. Sirve en manubrios de 22 a 32 mm o en la base del espejo, que viene incluida. Viene con herramienta, así que no necesitas comprar nada extra.",
            "cta": "¿No sabes si le queda? Escríbenos y te mandamos la guía de medidas. Envío a todo México.",
            "duracion": "15 s",
            "notas": "Grabación en plano detalle de la instalación. Saca el celular y comprueba que la cámara no se mueve.",
        },
    },
    {
        "file": "c04-kit-antivibracion-gancho-lluvia-1080x1920",
        "format": "vertical",
        "art": "phone-mount",
        "scene": "rain",
        "kicker": "OJO CON ESTO",
        "hook": "Tu celular *no aguanta la lluvia*",
        "price": 599,
        "compare": 749,
        "cta": "Pide el kit impermeable por WhatsApp",
        "guion": {
            "gancho": "El soporte aguanta el agua, tu celular no. Dato importante antes de que llueva.",
            "cuerpo": "El soporte antivibración es resistente al agua, pero el teléfono va expuesto. Si tu ruta incluye lluvia, necesitas el soporte impermeable: es una carcasa con sello que se monta en el espejo. La pantalla se sigue usando a través de la membrana.",
            "cta": "Escríbenos por WhatsApp y te digo cuál de los dos necesitas para tu moto. Envío a todo México.",
            "duracion": "16 s",
            "notas": "Plano de lluvia con gotas. Muestra el kit antivibración y luego la carcasa impermeable como upsell.",
        },
    },
    {
        "file": "c05-soporte-impermeable-gancho-lluvia-1080x1920",
        "format": "vertical",
        "art": "phone-waterproof",
        "scene": "rain",
        "kicker": "CUANDO LLUEVE",
        "hook": "Con lluvia *ya no ves la ruta*",
        "price": 469,
        "compare": 599,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "Pantalla mojada y ya no ves la ruta. Y el agua siempre entra donde menos quieres.",
            "cuerpo": "Este soporte encierra el teléfono en una carcasa con sello y membrana sensible al tacto. La pantalla se usa desde adentro, sin sacar el celular. El cierre es de liberación rápida: lo bajas en dos segundos cuando llegas.",
            "cta": "Escríbenos por WhatsApp. Envío a todo México, 7 a 15 días hábiles.",
            "duracion": "17 s",
            "notas": "Lluvia en pantalla, gotas en la membrana, mano abriendo y cerrando el cierre rápido.",
        },
    },
    {
        "file": "c06-soporte-impermeable-gancho-espejo-1080x1080",
        "format": "square",
        "art": "phone-waterproof",
        "scene": "none",
        "kicker": "MONTAJE",
        "hook": "En el espejo, *sin estorbar el manubrio*",
        "price": 469,
        "compare": 599,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "Va en el espejo, no te estorba el manubrio.",
            "cuerpo": "Si ya traes cosas montadas en el manubrio, la base de espejo es la opción que menos estorba. Queda a la altura de tu vista y gira para dejar el teléfono donde lo veas bien.",
            "cta": "Escríbenos por WhatsApp y confirmamos compatibilidad. 7 a 15 días hábiles.",
            "duracion": "12 s",
            "notas": "Foto del soporte montado en el espejo real de una moto, con el celular navegando.",
        },
    },
    {
        "file": "c07-punos-gancho-manos-1080x1920",
        "format": "vertical",
        "art": "grips",
        "scene": "vibration",
        "kicker": "LA MEJORA MÁS BARATA",
        "hook": "Tus manos *te lo van a agradecer*",
        "price": 349,
        "compare": 449,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "Después de 200 kilómetros tus manos lo agradecen. Y es de las mejoras más baratas que le puedes hacer a tu moto.",
            "cuerpo": "Los puños de fábrica se endurecen, se ponen resbalosos y te matan las manos. Estos son de goma blanda con patrón antideslizante: agarran con o sin guantes y absorben parte de la vibración. Vienen en 22 y 25 mm para el lado del clutch y el del acelerador.",
            "cta": "Escríbenos por WhatsApp y te digo qué medida te toca. Envío a todo México.",
            "duracion": "18 s",
            "notas": "Manos en el manubrio, contraste entre el puño viejo resbaloso y el nuevo con canal.",
        },
    },
    {
        "file": "c08-punos-gancho-medida-1080x1080",
        "format": "square",
        "art": "grips",
        "scene": "none",
        "kicker": "NO TE EQUIVOQUES",
        "hook": "22 o 25 mm: *así lo mides*",
        "price": 349,
        "compare": 449,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "22 o 25 milímetros: así mides el tuyo.",
            "cuerpo": "Lo normal es 22 en el lado del clutch y 25 en el del acelerador, pero hay motos distintas. Mide el diámetro exterior de tu puño viejo con un vernier o compáralo contra los nuevos. Si te quedan los dos, se los puedes llevar.",
            "cta": "¿Dudas con la medida? Escríbenos por WhatsApp con una foto de tu manubrio.",
            "duracion": "14 s",
            "notas": "Manos midiendo con vernier o con una regla. Si no tienes vernier, compara tu puño viejo contra el nuevo antes de pedir.",
        },
    },
    {
        "file": "c09-cubre-moto-gancho-lluvia-1080x1920",
        "format": "vertical",
        "art": "bike-cover",
        "scene": "rain",
        "kicker": "TU MOTO DUERME AFUERA",
        "hook": "Lo peor *no es la lluvia*",
        "price": 599,
        "compare": 749,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "La lluvia no es lo peor que le pasa a tu moto. El sol es igual de traicionero.",
            "cuerpo": "El asiento y los plásticos se deterioran con el sol, y el polvo se mete en todo. Esta funda tiene costuras selladas, forro suave que no raya la pintura y costuras reflectivas. Incluye bolsa para guardarla cuando no la usas.",
            "cta": "Escríbenos por WhatsApp y te ayudamos a elegir talla. Mide de punta a punta y manda el alto del manubrio.",
            "duracion": "19 s",
            "notas": "Comparación antes y después de una lluvia. Muestra la hebilla inferior y la costura reflectiva.",
        },
    },
    {
        "file": "c10-cubre-moto-gancho-viento-1080x1080",
        "format": "square",
        "art": "bike-cover",
        "scene": "wind",
        "kicker": "EL DETALLE QUE IMPORTA",
        "hook": "La hebilla que *la mantiene en su lugar*",
        "price": 599,
        "compare": 749,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "La hebilla que la mantiene en su lugar.",
            "cuerpo": "Las fundas baratas solo se amarran con cordón y una noche de viento las deja en el suelo. Esta pasa por debajo de la moto con una correa y una hebilla. Eso es lo que hace la diferencia.",
            "cta": "Escríbenos por WhatsApp. Tallas M, L, XL y XXL. 7 a 15 días hábiles.",
            "duracion": "13 s",
            "notas": "Plano detalle de la hebilla cerrándose bajo la moto. Se nota el tirón de la correa.",
        },
    },
    {
        "file": "c11-alforjas-gancho-peso-1080x1920",
        "format": "vertical",
        "art": "saddlebags",
        "scene": "weight",
        "kicker": "PESO",
        "hook": "El peso en la espalda *se paga*",
        "price": 1099,
        "compare": 1399,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "Si cargas peso en la espalda, la moto te lo cobra.",
            "cuerpo": "Cargar la mochila te cansa los hombros y te desestabiliza. Las alforjas bajan el centro de gravedad y reparten el peso a los lados. De 36 a 58 litros, con cubiertas impermeables y bandas elásticas incluidas.",
            "cta": "Escríbenos por WhatsApp y te decimos si entran en tu modelo. 7 a 15 días hábiles.",
            "duracion": "19 s",
            "notas": "Muestra la mochila cargada en la espalda y después las alforjas montadas. Compara cómo se ven las luces traseras.",
        },
    },
    {
        "file": "c12-bolsa-pierna-gancho-documentos-1080x1080",
        "format": "square",
        "art": "leg-bag",
        "scene": "none",
        "kicker": "SIEMPRE A LA MANO",
        "hook": "Cartera, celular y documentos: *secos*",
        "price": 399,
        "compare": 499,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "Cartera, celular y documentos: secos y a la mano.",
            "cuerpo": "Esta bolsa se ajusta al muslo con correas regulables y se queda fija en el trayecto. Cuando te bajas, te la llevas contigo y no dejas nada en la moto. Cierre impermeable y compartimentos separados.",
            "cta": "Escríbenos por WhatsApp. Envío a todo México, 7 a 15 días hábiles.",
            "duracion": "13 s",
            "notas": "Manos metiendo el celular en el compartimento y ajustando la correa del muslo.",
        },
    },
    {
        "file": "c13-mochila-gancho-lluvia-1080x1920",
        "format": "vertical",
        "art": "backpack",
        "scene": "rain",
        "kicker": "TRABAJO DE CAMPO",
        "hook": "Cierre estanco. *No una funda de lluvia.*",
        "price": 749,
        "compare": 899,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "Cierre estanco, no una funda de lluvia.",
            "cuerpo": "Una funda de lluvia encima de la mochila deja entrar el agua por las costuras y por la espalda. Esta se enrolla sobre sí misma y sella: no hay cremallera por donde se filtre. Adentro entra una laptop de 15 pulgadas, con compartimento propio.",
            "cta": "Escríbenos por WhatsApp y te ayudamos con el tamaño. 7 a 15 días hábiles.",
            "duracion": "18 s",
            "notas": "Abre la mochila, mete la laptop, cierra el rollo y échale agua encima a propósito.",
        },
    },
    {
        "file": "c14-red-elastica-gancho-casco-1080x1080",
        "format": "square",
        "art": "cargo-net",
        "scene": "none",
        "kicker": "EL MEJOR PRECIO DE LA LISTA",
        "hook": "El accesorio más útil *y más barato*",
        "price": 199,
        "compare": 249,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "El accesorio más útil de toda la lista, y de los más baratos.",
            "cuerpo": "Sujeta el casco cuando te bajas, la compra del día o la mochila. Seis ganchos de metal recubierto para que no rayen la pintura, y elástico que mantiene la tensión. Se enrolla y se guarda en cualquier hueco de la moto.",
            "cta": "Escríbenos por WhatsApp. Envío a todo México, 7 a 15 días hábiles.",
            "duracion": "13 s",
            "notas": "Muestra el casco colgando de la red en la parrilla y cómo se enrolla para guardarla.",
        },
    },
    {
        "file": "c15-cepillo-cadena-gancho-mantenimiento-1080x1080",
        "format": "square",
        "art": "chain-brush",
        "scene": "none",
        "kicker": "MANTENIMIENTO",
        "hook": "La cadena limpia *en cinco minutos*",
        "price": 179,
        "compare": 229,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "La cadena limpia en cinco minutos, sin quitarte los guantes.",
            "cuerpo": "Con trapo quedan sucios los eslabones internos, que es donde importa. Este cepillo tiene cerdas en tres caras y abraza la cadena completa: le das vueltas a la rueda y trabaja solo. Las cerdas son de nailon, no de alambre, así que no dañan los o-rings.",
            "cta": "Escríbenos por WhatsApp. 7 a 15 días hábiles.",
            "duracion": "14 s",
            "notas": "Cepillo trabajando sobre la cadena con la rueda girando. Primer plano de las cerdas en las tres caras.",
        },
    },
    {
        "file": "c16-stickers-reflectivos-gancho-noche-1080x1920",
        "format": "vertical",
        "art": "reflective",
        "scene": "night",
        "kicker": "DE NOCHE",
        "hook": "Si no te ven, *no estás*",
        "price": 149,
        "compare": 189,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "Si no te ven, no estás. De noche, lo que decide es la visibilidad.",
            "cuerpo": "La mayoría de los accidentes con moto pasa porque el otro conductor simplemente no te vio. El reflectivo no necesita batería ni instalación: refleja la luz de los faros que le apuntan. Se aplica en casco, horquilla, guardabarros o costados.",
            "cta": "Escríbenos por WhatsApp y te digo dónde conviene ponerlos. 7 a 15 días hábiles.",
            "duracion": "17 s",
            "notas": "Escena nocturna: los reflectivos en la moto y los faros de un auto pasándole al frente. Sin música fuerte, con el ruido de la moto.",
        },
    },
    {
        "file": "c17-stickers-genericos-gancho-personalizar-1080x1080",
        "format": "square",
        "art": "stickers",
        "scene": "none",
        "kicker": "SIN LOGOS DE MARCA",
        "hook": "Personaliza tu moto *sin marcas ajenas*",
        "price": 149,
        "compare": 189,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "Personaliza tu moto sin marcas ajenas.",
            "cuerpo": "Pack de calcomanías genéricas para carenado, tanque o casco. Vinil resistente al agua y a los rayos UV, pensados para exterior. No vendemos logos de Honda, Yamaha, Italika ni ninguna otra marca registrada.",
            "cta": "Escríbenos por WhatsApp y te decimos cómo se aplican. 7 a 15 días hábiles.",
            "duracion": "12 s",
            "notas": "Mano retirando la calcomanía del papel protector y pegándola en el carenado. Toma de antes y después.",
        },
    },
    {
        "file": "c18-candado-gancho-cable-recordatorio-1080x1920",
        "format": "vertical",
        "art": "disc-lock",
        "scene": "night",
        "kicker": "PARA QUE NO SE TE OLVIDE",
        "hook": "El cable naranja *que salva tu horquilla*",
        "price": 449,
        "compare": 549,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "El cable naranja que salva tu horquilla.",
            "cuerpo": "El candado de disco se pone en segundos y cabe en cualquier bolsillo. El cable recordatorio va del candado al manubrio: si intentas arrancar, lo ves antes de romper la horquilla o de caerte. Viene con dos llaves y bolsa.",
            "cta": "Escríbenos por WhatsApp. Ningún candado de este precio es inviolable, pero sí hace la diferencia. 7 a 15 días hábiles.",
            "duracion": "18 s",
            "notas": "Poner el candado, ver el cable tensado contra el manubrio, y el gesto de '¡uy, ya casi arranco!'.",
        },
    },
    {
        "file": "c19-bolsa-herramientas-gancho-herramienta-1080x1080",
        "format": "square",
        "art": "tool-roll",
        "scene": "none",
        "kicker": "HERRAMIENTA ORDENADA",
        "hook": "Herramienta suelta *termina sonando*",
        "price": 329,
        "compare": 399,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "Herramienta suelta termina sonando, oxidada o perdida.",
            "cuerpo": "Este rollo la mantiene sujeta y ordenada, con separaciones elásticas para llaves y desarmadores. Es compacto: enrollado entra bajo el asiento de muchas motos o se cuelga de las defensas. La herramienta no viene incluida, es el organizador.",
            "cta": "Escríbenos por WhatsApp. 7 a 15 días hábiles.",
            "duracion": "13 s",
            "notas": "Herramienta cayendo al suelo contra la misma herramienta ordenada en el rollo. Aclarar que la herramienta no viene incluida.",
        },
    },
    {
        "file": "c20-cubre-punos-gancho-viento-1080x1920",
        "format": "vertical",
        "art": "handguards",
        "scene": "wind",
        "kicker": "FRÍO EN LAS MANOS",
        "hook": "El viento directo *te enfría las manos*",
        "price": 499,
        "compare": 649,
        "cta": "Escríbenos por WhatsApp",
        "guion": {
            "gancho": "El frío en las manos no viene solo de la temperatura, viene del viento que te golpea directo.",
            "cuerpo": "Estos protectores cortan ese flujo de aire y también la lluvia que te cae en los dedos. Se montan en el manubrio con abrazadera, sin modificar la moto. Además te protegen de piedras y de bichos en carretera.",
            "cta": "Escríbenos por WhatsApp y te ayudamos a revisar el espacio en tu manubrio. 7 a 15 días hábiles.",
            "duracion": "17 s",
            "notas": "Manos en el manubrio con y sin protectores, sensación de viento. Graba de noche con el protector puesto.",
        },
    },
]


# --------------------------------------------------------------------------
# Utilidades de color y texto
# --------------------------------------------------------------------------
def parse_hook(text: str) -> list[tuple[str, tuple]]:
    """Convierte 'palabra *resaltada*' en lista de (palabra, color)."""
    items: list[tuple[str, tuple]] = []
    for index, chunk in enumerate(text.split("*")):
        chunk = chunk.strip()
        if not chunk:
            continue
        color = ACCENT if index % 2 else CREAM
        for word in chunk.split():
            items.append((word, color))
    return items


def hook_lines(hook: str, font_obj, max_width: int):
    items = parse_hook(hook)
    return wrap_rich(items, font_obj, max_width)


# --------------------------------------------------------------------------
# Fondos y escenas
# --------------------------------------------------------------------------
def base_background(width: int, height: int, top, bottom) -> Image.Image:
    base = Image.new("RGBA", (width, height), INK + (255,))
    gradient = linear_gradient(width, height, top, bottom, angle=90)
    base = gradient.convert("RGBA")
    return base


def scrim(image: Image.Image, top_alpha: int = 190, bottom_alpha: int = 225) -> Image.Image:
    """Oscurece arriba y abajo para que el texto se lea."""
    w, h = image.size
    ramp = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    top_factor = np.clip(1 - ramp / 0.42, 0, 1) ** 1.4
    bottom_factor = np.clip((ramp - 0.58) / 0.42, 0, 1) ** 1.4
    factor = np.maximum(top_factor, bottom_factor)[:, :, None]
    arr = np.array(image.convert("RGB")).astype(np.float32)
    arr = arr * (1 - factor * 0.82)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def scene_rain(draw: ImageDraw.ImageDraw, w: int, h: int, seed: int = 3) -> None:
    rng = random.Random(seed)
    for _ in range(150):
        x = rng.uniform(-120, w + 120)
        y = rng.uniform(-120, h + 120)
        length = rng.uniform(40, 130)
        draw.line([(x, y), (x - length * 0.32, y + length)], fill=(150, 186, 220), width=2)


def scene_vibration(draw: ImageDraw.ImageDraw, w: int, h: int, cx: float, cy: float) -> None:
    rng = random.Random(11)
    for i in range(4):
        radius = 260 + i * 86
        draw.arc(
            (cx - radius, cy - radius * 0.72, cx + radius, cy + radius * 0.72),
            start=202,
            end=338,
            fill=(126, 62, 16),
            width=3,
        )
    for _ in range(22):
        x = rng.uniform(40, w - 40)
        y = rng.uniform(40, h - 40)
        length = rng.uniform(30, 110)
        draw.line([(x, y), (x + length, y)], fill=(110, 120, 134), width=2)


def scene_road(draw: ImageDraw.ImageDraw, w: int, h: int) -> None:
    horizon = int(h * 0.62)
    draw.rectangle((0, horizon, w, h), fill=(16, 18, 22))
    draw.polygon([(w * 0.42, horizon), (w * 0.58, horizon), (w * 1.05, h), (w * -0.05, h)], fill=(28, 31, 37))
    y = horizon
    step = 18
    while y < h:
        draw.rectangle((w * 0.5 - step * 0.16, y, w * 0.5 + step * 0.16, y + step * 1.4), fill=(150, 158, 170))
        y += step * 3.4
        step *= 1.22


def scene_tools(draw: ImageDraw.ImageDraw, w: int, h: int) -> None:
    """Llave y destornillador en silueta al fondo."""
    draw.ellipse((w * 0.06, h * 0.70, w * 0.30, h * 0.78), outline=(70, 78, 90), width=16)
    draw.rectangle((w * 0.06, h * 0.73, w * 0.34, h * 0.75), fill=(70, 78, 90))
    draw.rounded_rectangle((w * 0.70, h * 0.66, w * 0.74, h * 0.80), radius=12, fill=(70, 78, 90))
    draw.rounded_rectangle((w * 0.66, h * 0.62, w * 0.78, h * 0.67), radius=12, fill=(70, 78, 90))


def scene_night(draw: ImageDraw.ImageDraw, w: int, h: int) -> None:
    """Silueta de ciudad de noche."""
    rng = random.Random(23)
    base_y = int(h * 0.80)
    x = 0
    while x < w:
        bw = rng.randint(70, 150)
        bh = rng.randint(120, 340)
        draw.rectangle((x, base_y - bh, x + bw, base_y), fill=(15, 17, 21))
        for wy in range(base_y - bh + 20, base_y - 20, 34):
            for wx in range(x + 14, x + bw - 14, 30):
                if rng.random() > 0.45:
                    draw.rectangle((wx, wy, wx + 10, wy + 14), fill=(188, 170, 110))
        x += bw + 6
    draw.rectangle((0, base_y, w, h), fill=(11, 12, 15))


def scene_wind(draw: ImageDraw.ImageDraw, w: int, h: int) -> None:
    rng = random.Random(31)
    for _ in range(16):
        y = rng.uniform(h * 0.15, h * 0.95)
        x = rng.uniform(-200, w)
        length = rng.uniform(140, 420)
        draw.line([(x, y), (x + length, y)], fill=(126, 138, 154), width=3)


def scene_weight(draw: ImageDraw.ImageDraw, w: int, h: int) -> None:
    rng = random.Random(41)
    for _ in range(7):
        x = rng.choice([rng.uniform(40, w * 0.16), rng.uniform(w * 0.84, w - 40)])
        y = rng.uniform(h * 0.30, h * 0.85)
        draw.polygon([(x, y + 44), (x - 20, y), (x + 20, y)], fill=(150, 162, 178))
        draw.rectangle((x - 3, y - 26, x + 3, y), fill=(150, 162, 178))


SCENES = {
    "rain": scene_rain,
    "vibration": scene_vibration,
    "road": scene_road,
    "tools": scene_tools,
    "night": scene_night,
    "wind": scene_wind,
    "weight": scene_weight,
}


# --------------------------------------------------------------------------
# Componentes
# --------------------------------------------------------------------------
def whatsapp_icon(draw: ImageDraw.ImageDraw, x: float, y: float, size: float, color=INK) -> None:
    """Burbuja de chat generica (no es el logo de WhatsApp)."""
    rx = size * 0.44
    ry = size * 0.34
    draw.polygon(
        [
            (x - rx * 0.72, y + ry * 0.42),
            (x - rx * 0.18, y + ry * 1.18),
            (x + rx * 0.06, y + ry * 0.38),
        ],
        fill=color,
    )
    draw.ellipse((x - rx, y - ry, x + rx, y + ry), fill=color)
    for index in range(3):
        cx = x - rx * 0.46 + index * rx * 0.46
        draw.ellipse((cx - size * 0.045, y - size * 0.045, cx + size * 0.045, y + size * 0.045), fill=ACCENT)


def price_block(
    image: Image.Image,
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    price: int,
    compare: int,
    scale: float = 1.0,
) -> float:
    """Pill de precio + precio anterior tachado. Devuelve el alto usado."""
    pill_h = int(66 * scale)
    font_size = int(34 * scale)
    price_font = font(font_size, "bold")
    text = f"MXN {price}"
    pad = int(30 * scale)
    width = price_font.getlength(text) + pad * 2

    box = [x, y, x + width, y + pill_h]
    mask = mask_from(image.size, lambda d: d.rounded_rectangle(box, radius=pill_h // 2, fill=255))
    gradient_shape(image, mask, ACCENT_HOVER, ACCENT, angle=90)
    draw.text((x + pad, y + pill_h / 2), text, font=price_font, fill=INK, anchor="lm")

    compare_font = font(int(23 * scale), "regular")
    compare_text = f"antes MXN {compare}"
    cx = x + width + int(18 * scale)
    draw.text((cx, y + pill_h / 2), compare_text, font=compare_font, fill=MUTED, anchor="lm")
    line_w = compare_font.getlength(compare_text)
    draw.line([(cx, y + pill_h / 2 - 1), (cx + line_w, y + pill_h / 2 - 1)], fill=MUTED_2, width=2)
    return pill_h


def cta_button(
    image: Image.Image,
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    width: float,
    label: str,
    scale: float = 1.0,
) -> float:
    """Boton crema con el texto de la llamada a la accion."""
    height = int(84 * scale)
    radius = int(26 * scale)
    box = [x, y, x + width, y + height]
    mask = mask_from(image.size, lambda d: d.rounded_rectangle(box, radius=radius, fill=255))
    gradient_shape(image, mask, (252, 252, 253), (224, 226, 231), angle=90)

    label_font = font(int(30 * scale), "bold")
    text_w = label_font.getlength(label)
    icon = 40 * scale
    total = text_w + icon + 18 * scale
    start = x + (width - total) / 2
    whatsapp_icon(draw, start + icon / 2, y + height / 2, icon, INK)
    draw.text((start + icon + 18 * scale, y + height / 2), label, font=label_font, fill=INK, anchor="lm")
    return height


# --------------------------------------------------------------------------
# Render de cada formato
# --------------------------------------------------------------------------
def render_creative(data: dict) -> Image.Image:
    is_square = data["format"] == "square"
    width = SQUARE
    height = SQUARE if is_square else H

    top_color = (20, 23, 29)
    bottom_color = (11, 12, 14)
    if data["scene"] == "night":
        top_color = (14, 16, 24)
        bottom_color = (8, 9, 13)

    image = base_background(width, height, top_color, bottom_color)

    # --- Layout del texto (se calcula antes para recortar la escena) -----
    margin = 72
    hook_font = font(96 if not is_square else 68, "bold")
    lines = hook_lines(data["hook"], hook_font, width - margin * 2 - 30)
    line_height = hook_font.size * 1.16
    hook_top = 236 if not is_square else 200

    panel_top = height - (470 if not is_square else 300)
    hook_bottom = hook_top + len(lines) * line_height
    zone_top = hook_bottom + 26
    zone_bottom = panel_top - 20
    zone_height = zone_bottom - zone_top

    # --- Escena de fondo (recortada a la zona de la ilustracion) --------
    scene_name = data.get("scene", "none")
    if scene_name in SCENES:
        layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer, "RGBA")
        if scene_name == "vibration":
            scene_vibration(draw, width, height, width / 2, zone_top + zone_height * 0.45)
        else:
            SCENES[scene_name](draw, width, height)
        cropped = layer.crop((0, max(0, int(zone_top) - 70), width, int(panel_top)))
        image.alpha_composite(cropped, dest=(0, max(0, int(zone_top) - 70)))

    # Halo naranja detras del producto
    art_center_y = zone_top + zone_height / 2
    image.alpha_composite(
        radial_gradient(width, height, width / 2, art_center_y, width * 0.62, ACCENT, 46, falloff=2.2)
    )
    image = scrim(image)

    # --- Texto superior -------------------------------------------------
    draw = ImageDraw.Draw(image, "RGBA")

    draw.rounded_rectangle((margin, 176, margin + 46, 183), radius=3, fill=ACCENT)
    draw_tracked(draw, (margin + 62, 156), data["kicker"].upper(), font(26, "semibold"), ACCENT, 4, anchor="la")

    draw_rich_block(
        draw,
        width / 2,
        hook_top,
        lines,
        hook_font,
        tracking=0,
        line_height=line_height,
        align="center",
    )

    # --- Ilustracion ----------------------------------------------------
    art = fit_art(data["art"], int(width * 0.94), int(zone_height))
    art_w, art_h = art.size
    art_x = int(width / 2 - art_w / 2)
    art_y = int(zone_top + (zone_height - art_h) / 2)

    alpha = art.getchannel("A")
    shadow = soft_shadow(alpha, offset=(0, 30), blur=40, opacity=140)
    image.alpha_composite(shadow, dest=(art_x, art_y + 30))
    image.alpha_composite(art, dest=(art_x, art_y))

    # --- Panel de oferta ------------------------------------------------
    draw = ImageDraw.Draw(image, "RGBA")
    panel_x = margin
    panel_w = width - margin * 2
    panel_h = 250 if not is_square else 228
    panel_y = panel_top

    panel_mask = mask_from(
        image.size,
        lambda d: d.rounded_rectangle((panel_x, panel_y, panel_x + panel_w, panel_y + panel_h), radius=34, fill=255),
    )
    panel_layer = Image.new("RGBA", image.size, (255, 255, 255, 0))
    panel_layer.paste(Image.new("RGBA", image.size, (24, 27, 33, 232)), (0, 0))
    panel_layer.putalpha(panel_mask)
    image.alpha_composite(panel_layer)

    inner_x = panel_x + 34
    inner_w = panel_w - 68
    price_block(image, draw, inner_x, panel_y + 30, data["price"], data["compare"], scale=1.0)
    cta_button(image, draw, inner_x, panel_y + 122, inner_w, data["cta"], scale=1.0)

    # --- Pie ------------------------------------------------------------
    draw = ImageDraw.Draw(image, "RGBA")
    foot_y = panel_y + panel_h + 34
    draw_tracked(
        draw,
        (width / 2, foot_y),
        "Envío a todo México  ·  7 a 15 días hábiles  ·  Guía rastreable",
        font(23, "regular"),
        MUTED,
        1,
        anchor="ma",
    )

    # Marca de agua arriba a la izquierda
    brand_lockup(draw, margin, 84, size=17, color=MUTED_2, mark_color=ACCENT, anchor="la", tracking=4)

    final = apply_grain(image.convert("RGB"), amount=1.8, seed=abs(hash(data["file"])) % 9999)
    return final


# --------------------------------------------------------------------------
# Guion TXT
# --------------------------------------------------------------------------
def write_guiones() -> Path:
    lines: list[str] = []
    lines.append("GUIONES DE CREATIVOS - TALLER DE RUTA")
    lines.append("=" * 78)
    lines.append("")
    lines.append("Copy y ritmo para grabar los videos de cada pieza.")
    lines.append("Reglas de la casa: español de Mexico, voz directa, sin marcas de terceros,")
    lines.append("sin prometer entregas mas rapidas de lo real (7 a 15 dias habiles).")
    lines.append("")

    for index, data in enumerate(CREATIVOS, start=1):
        lines.append("-" * 78)
        lines.append(f"C{index:02d}. {data['file']}")
        lines.append(f"     Formato : {data['format']} ({'1080x1920' if data['format'] == 'vertical' else '1080x1080'})")
        lines.append(f"     Gancho  : {data['hook'].replace('*', '')}")
        lines.append(f"     Oferta  : MXN {data['price']} (antes MXN {data['compare']})")
        lines.append(f"     CTA     : {data['cta']}")
        lines.append("")
        guion = data["guion"]
        lines.append(f"  GANCHO  (0-3 s)  : {guion['gancho']}")
        lines.append(f"  CUERPO  (3-12 s) : {guion['cuerpo']}")
        lines.append(f"  CTA     (12 s+)  : {guion['cta']}")
        lines.append(f"  DURACION SUGERIDA : {guion['duracion']}")
        lines.append(f"  NOTAS DE GRABACION: {guion['notas']}")
        lines.append("")

    lines.append("-" * 78)
    lines.append("")
    lines.append("REGLAS PARA TODOS LOS VIDEOS")
    lines.append("- Cierra siempre con: 'Escribenos por WhatsApp' + 'Envio a todo Mexico, 7 a 15 dias habiles'.")
    lines.append("- No prometas entrega inmediata ni seguridad garantizada con ningun candado.")
    lines.append("- No aparezcan logos de Honda, Yamaha, Italika, Bajaj ni ninguna otra marca.")
    lines.append("- Si grabas con tu moto, no pongas placas legibles ni datos personales.")
    lines.append("")

    GUIONES_PATH.write_text("\n".join(lines), encoding="utf-8")
    return GUIONES_PATH


# --------------------------------------------------------------------------
def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for data in CREATIVOS:
        image = render_creative(data)
        out_path = OUT_DIR / f"{data['file']}.png"
        save_png(image, out_path)
        print(f"generado: {out_path.name}")

    guion_path = write_guiones()
    print(f"\n{len(CREATIVOS)} creativos en {OUT_DIR}")
    print(f"guiones: {guion_path.name}")


if __name__ == "__main__":
    main()
