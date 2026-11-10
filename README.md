# Taller de Ruta — Tienda de accesorios para moto

Tienda en linea completa para dropshipping de accesorios para motocicleta en
Mexico. Construida con Next.js 16, React 19 y Tailwind CSS 4.

**Costo mensual de operacion: 0 USD** (hosting gratuito en Vercel).

---

## Estado actual

| Parte | Estado |
|---|---|
| Catalogo de 14 productos | Listo |
| 7 categorias con texto SEO | Listo |
| Paginas de producto con especificaciones y FAQ | Listo |
| Carrito con persistencia local | Listo |
| Checkout con Mercado Pago | Codigo listo, **falta tu token** |
| Paginas legales (envio, devoluciones, contacto, nosotros) | Listo |
| 7 guias SEO | Listo |
| Sitemap, robots y datos estructurados | Listo |
| Imagenes de producto | **Placeholders** — reemplazar antes de vender |
| Costos reales de proveedor | **Sin confirmar** — ver `../STORE_BUILD_READINESS.md` |

---

## Requisitos

- Node.js 20 o superior (probado con 24.12)
- pnpm 10 o superior

## Empezar en local

```bash
pnpm install
cp .env.example .env.local   # En Windows: copy .env.example .env.local
pnpm dev
```

Abre http://localhost:3000

La tienda funciona completa sin configurar nada. Lo unico que no funciona sin
`.env.local` es el cobro con tarjeta: si falta el token de Mercado Pago, el
checkout muestra un aviso y ofrece cerrar el pedido por WhatsApp en lugar de
fallar en silencio.

## Comandos

| Comando | Que hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con recarga en vivo |
| `pnpm build` | Compila para produccion |
| `pnpm start` | Sirve la version compilada |

Scripts de utilidad (requieren Python con Pillow, ya incluido en el entorno DSH):

| Comando | Que hace |
|---|---|
| `python scripts/margin-report.py` | Reporte de margen bruto y neto por producto |
| `python scripts/generate-product-images.py` | Regenera las imagenes placeholder |

---

## Estructura del proyecto

```
store/
├── src/
│   ├── app/                      # Rutas (App Router)
│   │   ├── page.tsx              # Home
│   │   ├── tienda/               # Catalogo completo
│   │   ├── coleccion/[slug]/     # Paginas de categoria
│   │   ├── producto/[slug]/      # Ficha de producto
│   │   ├── carrito/              # Checkout: datos de envio + pago
│   │   ├── checkout/             # Paginas de resultado del pago
│   │   ├── guias/                # Guias SEO
│   │   ├── envios|devoluciones|contacto|nosotros/
│   │   ├── api/checkout/         # Crea la preferencia de Mercado Pago
│   │   ├── api/webhook/mercadopago/  # Recibe confirmacion de pago
│   │   ├── sitemap.ts / robots.ts
│   │   └── globals.css           # Tokens de diseno y estilos base
│   ├── components/               # Header, footer, carrito, tarjetas
│   ├── data/                     # ← TODO EL CONTENIDO VIVE AQUI
│   │   ├── products.ts           # Los 14 productos
│   │   ├── collections.ts        # Las 7 categorias
│   │   ├── guides.ts             # Las 7 guias SEO
│   │   └── site.ts               # Nombre, contacto, envio, banderas
│   └── lib/                      # Formato, carrito, margen, validacion
├── public/productos/             # Imagenes de producto
└── scripts/                      # Utilidades de Python
```

**La regla importante:** todo el contenido esta en `src/data/`. Para cambiar
precios, textos o agregar productos no necesitas tocar componentes.

---

## Como cambiar cosas

### Cambiar un precio

Edita `price` (y `compareAt` si quieres mostrar precio tachado) en
`src/data/products.ts`. El cambio se refleja en la tienda, en el carrito y en el
checkout, porque el servidor siempre lee el precio del catalogo y nunca confia
en lo que manda el navegador.

Despues corre `python scripts/margin-report.py` para verificar que el producto
sigue cumpliendo el piso de 55% de margen bruto.

### Agregar un producto

1. Agrega un objeto al arreglo de `src/data/products.ts` copiando uno existente.
   El campo `slug` es la URL: `/producto/tu-slug`.
2. Coloca la imagen en `public/productos/tu-slug.png` y apunta `image` a
   `/productos/tu-slug.png`.
3. Listo. La ficha, el sitemap, el JSON-LD y el listado de la categoria se
   generan solos.

### Cambiar datos de contacto o costo de envio

Todo esta en `src/data/site.ts`: correo, WhatsApp, costo de envio, umbral de
envio gratis, plazo de entrega.

### Activar o desactivar las estrellas de valoracion

En `src/data/site.ts` existe la bandera `showSupplierRatings`, **apagada a
proposito**.

Los valores de `rating` y `reviews` en `products.ts` vienen de las resenas del
proveedor en AliExpress, no de clientes de esta tienda. Mostrarlos como resenas
propias seria enganoso y ademas incumple las politicas de datos estructurados de
Google, que pueden penalizar el sitio por `aggregateRating` falso.

Activala solo cuando tengas resenas reales de tus propios clientes y hayas
reemplazado esos valores.

---

## Configurar el cobro con Mercado Pago

Sin esto la tienda no puede cobrar con tarjeta.

1. Crea una cuenta en https://www.mercadopago.com.mx
2. Entra a https://www.mercadopago.com.mx/developers/panel/app y crea una
   aplicacion.
3. En **Credenciales de prueba**, copia el `Access Token` (empieza con `TEST-`).
4. Pegalo en `.env.local`:

   ```
   MERCADOPAGO_ACCESS_TOKEN=TEST-tu-token-aqui
   ```

5. Reinicia el servidor y prueba una compra. Con credenciales `TEST-` el pago se
   hace en modo sandbox y no se cobra dinero real.
6. Cuando confirmes que todo funciona, reemplaza el token por el de produccion
   (empieza con `APP_USR-`).

**Comisiones:** Mercado Pago cobra aproximadamente 3.5% + IVA por transaccion.
El reporte de margen ya descuenta ese porcentaje en la columna "Neto".

**Aviso de pagos:** no hay base de datos. Los pedidos se registran en el log del
servidor y el detalle completo (incluida la direccion de envio) queda en
`metadata.shipping_address` de la preferencia, visible en el panel de Mercado
Pago. **Antes de escalar hay que agregar base de datos y correo de
confirmacion** — ver la seccion de pendientes.

---

## Desplegar gratis en Vercel

1. Sube el proyecto a un repositorio de GitHub:

   ```bash
   cd store
   git init
   git add .
   git commit -m "Tienda inicial"
   git remote add origin https://github.com/tu-usuario/taller-de-ruta.git
   git push -u origin main
   ```

2. Entra a https://vercel.com y crea una cuenta con GitHub (plan Hobby, gratis).
3. **Add New → Project** e importa el repositorio.
4. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SITE_URL` = `https://tu-proyecto.vercel.app`
   - `MERCADOPAGO_ACCESS_TOKEN` = tu token de produccion
   - `NEXT_PUBLIC_STORE_EMAIL` y `NEXT_PUBLIC_STORE_WHATSAPP_LINK`
5. **Deploy**. En unos minutos tendras la tienda publica.

### Dominio propio

El subdominio `.vercel.app` es gratis pero se ve poco profesional para vender.
Un dominio `.mx` cuesta aproximadamente 200-400 MXN al año (Namecheap,
Porkbun o Cloudflare). En Vercel: **Settings → Domains → Add**, y apuntas los
DNS del registrador. Es el unico gasto realmente necesario del proyecto.

Despues de conectar el dominio, actualiza `NEXT_PUBLIC_SITE_URL` con el dominio
final y vuelve a desplegar: de eso dependen el sitemap, los canonical y las URLs
de retorno del pago.

---

## Seguridad implementada

- **Precios a prueba de manipulacion:** el checkout ignora cualquier precio que
  venga del navegador y lo recalcula contra el catalogo del servidor. Se
  verifico enviando un slug inexistente y una cantidad de 999: el servidor
  descarta el producto falso y limita la cantidad a 10 por linea.
- **Validacion doble:** el formulario valida en el navegador para dar respuesta
  inmediata y el servidor vuelve a validar todo antes de crear el cobro.
- **Token secreto:** `MERCADOPAGO_ACCESS_TOKEN` solo existe en el servidor y
  nunca llega al navegador. `.env.local` esta en `.gitignore`.
- **Paginas de pago fuera del indice:** `/carrito` y `/checkout/` estan
  bloqueadas en `robots.txt`.

---

## Pendientes antes de vender de verdad

Estos son los puntos abiertos, en orden de importancia:

1. **Confirmar costos y plazos reales de proveedor.** Los costos en
   `products.ts` son estimaciones de investigacion. Hasta confirmarlos en
   checkout, los margenes no son reales. Detalle en
   `../STORE_BUILD_READINESS.md`.
2. **Reemplazar las imagenes placeholder** por fotos reales. Ver `IMAGENES.md`.
3. **Revisar el precio de las alforjas.** Con el costo asumido de 520 MXN da
   52.7% de margen bruto, por debajo del piso de 55%. Opciones: subir a 1199+
   MXN o conseguir el costo por debajo de 495 MXN.
4. **Agregar base de datos de pedidos.** Hoy los pedidos solo viven en el log
   del servidor y en el panel de Mercado Pago.
5. **Correo de confirmacion automatico.** Al cliente y a ti.
6. **Google Search Console y Analytics.** Para medir trafico organico desde el
   dia uno.
7. **Aviso de privacidad.** No esta incluido; es obligatorio en Mexico si
   recolectas datos personales (LFPDPPP). Revisa con un abogado.
8. **Terminos y condiciones.** Igual que el anterior.

---

## Notas de diseno

- Tema oscuro industrial con acento naranja, pensado para el publico motero.
- Sin dependencias de fuentes externas: usa la pila de fuentes del sistema, asi
  que no hay peticiones a Google Fonts y carga mas rapido.
- Mobile primero: la mayoria del trafico de esta categoria llega desde el
  telefono.
- Contraste verificado y foco visible para navegacion con teclado.
