# Cadena de fulfillment automatico (Taller de Ruta)

Como una venta se convierte en un paquete que llega a tu cliente, con el
proveedor de AliExpress de por medio y sin que tengas que pegar el mismo dato
cinco veces.

Resumen en una linea:

```
Venta -> Webhook de Mercado Pago -> Orden guardada -> Compra en AliExpress
      -> Guia del proveedor -> Orden actualizada -> WhatsApp al cliente
```

---

## 1. Que archivos forman la cadena

| Archivo | Que hace |
| --- | --- |
| `store/src/lib/orders.ts` | Modulo de pedidos. Guarda, lee y actualiza ordenes en `store/data/orders.jsonl` (una orden por linea). |
| `store/src/app/api/webhook/mercadopago/route.ts` | Recibe la notificacion de Mercado Pago y guarda la orden en disco. |
| `store/src/app/api/pedidos/route.ts` | `GET /api/pedidos`: lista las ordenes. |
| `store/src/app/api/pedidos/[id]/route.ts` | `GET /api/pedidos/<id>`: una orden. `PATCH /api/pedidos/<id>`: cambia estado / guia. |
| `tools/aliexpress-pedido.mjs` | Prepara la compra en AliExpress: mete el producto al carrito, deja solo ese producto, llena la direccion del cliente y **se detiene antes de pagar**. |

> La carpeta `store/data/` (donde viven los pedidos) tiene datos personales de
> tus clientes. Agregala al `.gitignore` del repo antes de subirlo a Git.

---

## 2. El flujo, paso a paso

### Paso 1. Entra la venta

El cliente paga desde la tienda. `store/src/app/api/checkout/route.ts` crea la
preferencia de Mercado Pago y genera el **id del pedido**:

```
TDR-<stamp>-<random>      ejemplo: TDR-MKX2P1-9QF4
```

Ese id viaja en `external_reference` y en `metadata.order_reference`, junto con
el nombre, el telefono y la direccion de envio del cliente.

### Paso 2. El webhook guarda la orden

Mercado Pago avisa a `POST /api/webhook/mercadopago`. El webhook:

1. Consulta el pago en la API de Mercado Pago.
2. Valida que el pago este `approved` o `authorized` (si no, no guarda nada).
3. Verifica que el pago traiga `external_reference` (el id del pedido).
4. Arma la orden con los productos, el total, el cliente y la direccion.
5. La escribe en `store/data/orders.jsonl` con estado `paid`.

El webhook **siempre responde 200**. Si algo falla, lo anota en la consola del
servidor y no rompe: Mercado Pago ya cobro, no puedes devolverle un error.
Ademas, si llega dos veces la misma notificacion, la orden se actualiza en
lugar de duplicarse.

La orden guardada se ve asi:

```json
{
  "id": "TDR-MKX2P1-9QF4",
  "createdAt": "2026-11-09T23:10:04.512Z",
  "status": "paid",
  "items": [
    { "slug": "kit-soporte-celular-moto-antivibracion-360", "name": "Kit Soporte Celular Moto Antivibracion 360 para Repartidor", "qty": 1, "unitPrice": 599 }
  ],
  "subtotal": 599,
  "shipping": 89,
  "total": 688,
  "customer": {
    "name": "Juan Perez",
    "email": "juan@example.com",
    "phone": "5512345678",
    "address": "Calle 1 #2 | Int. 3 | Col. Centro | Ciudad de Mexico, Ciudad de Mexico | CP 06000"
  },
  "supplier": { "itemId": "1005008713355223" },
  "notes": ""
}
```

### Paso 3. Ver los pedidos que hay

```bash
# todas las ordenes (mas recientes primero)
curl http://localhost:3000/api/pedidos

# solo las que siguen sin salir
curl "http://localhost:3000/api/pedidos?estado=paid"

# una sola orden
curl http://localhost:3000/api/pedidos/TDR-MKX2P1-9QF4
```

> Estos endpoints **no tienen autenticacion** (es un MVP). Antes de ponerlos en
> produccion hay que meterlos detras de la sesion del administrador: exponen
> nombre, telefono y direccion del cliente.

### Paso 4. Comprar al proveedor en AliExpress

Este es el comando que se corre **por cada orden**:

```bash
node tools\aliexpress-pedido.mjs --item 1005008713355223 --order TDR-MKX2P1-9QF4 --nombre "Juan Perez" --tel 5512345678 --direccion "Calle 1 #2 | Int. 3 | Col. Centro | Ciudad de Mexico, Ciudad de Mexico | CP 06000" --rfc TDRR010101HBR --actualizar http://localhost:3000
```

Que hace, en orden:

1. Abre la ficha del producto en AliExpress (`--item`).
2. Lo mete al carrito.
3. Va a la cesta y **desmarca todo lo demas** para que solo se cobre lo del
   pedido.
4. Deja la cantidad correcta (`--cantidad`, default 1).
5. Entra al checkout (`Continuar`).
6. Abre `Modificar` -> `Anadir nueva direccion` y llena la direccion del
   cliente: nombre, telefono, codigo postal (el autocompletado de AliExpress
   saca estado, ciudad y colonia), calle, interior y RFC/CURP.
7. Elige esa direccion para el pedido.
8. **Se detiene.** La pagina queda lista para que una persona revise y pague.

El script **nunca** presiona `Realizar pedido`. El pago es siempre manual.

Opciones:

| Flag | Para que sirve |
| --- | --- |
| `--item` | Id del producto en AliExpress. El hero es `1005008713355223`. |
| `--order` | Id del pedido en la tienda (el `TDR-...`). |
| `--nombre` | Nombre del cliente. |
| `--tel` | Telefono del cliente (10 digitos). |
| `--direccion` | Direccion de entrega. Acepta comas o `\|`. |
| `--cantidad` | Piezas a comprar (default 1). |
| `--rfc` | RFC/CURP del proveedor. AliExpress lo pide siempre para Mexico. Tambien se puede poner en la variable de entorno `RFC_PROVEEDOR`. Si no pasas ninguno, el script usa el valor de ejemplo `TDRR010101HBR`: **cambialo por el RFC real de tu empresa.** |
| `--actualizar` | URL de la tienda. Si la pones, el script actualiza la orden al terminar. |
| `--estado` | Estado con el que se actualiza la orden (`packing`, `shipped`...). |
| `--cerrar` | Cierra la pestana al terminar (por defecto se deja abierta para pagar). |
| `--solo-guia <url>` | No compra nada: abre una pagina y busca el numero de guia. |

La salida es un solo JSON (los mensajes de avance van a la consola):

```json
{
  "ok": true,
  "orden": "TDR-MKX2P1-9QF4",
  "item": "1005008713355223",
  "estado": "listo_para_pagar",
  "requiere_pago_manual": true,
  "pestana": "7BD6CC06E2B98B07C282296E6786A504",
  "checkoutUrl": "https://www.aliexpress.com/p/trade/confirm.html?...",
  "trackingNumber": null,
  "envio_estimado": "Envio gratis",
  "transportista": "iMile  JNT, etc.",
  "total": "MX$155.98",
  "direccion": { "nombre": "Juan Perez", "telefono": "5512345678", "calle": "Calle 1 #2", "colonia": "Centro", "cp": "06000", "ciudad": "de Mexico", "estado": "CDMX" },
  "orden_actualizada": null,
  "pasos": [ { "step": "abrir_item", "ok": true, "item": "1005008713355223" } ]
}
```

Si un paso no encuentra lo que busca, no truena el script: lo reporta en
`pasos` con `"ok": false` y el motivo, y sigue con lo que si pudo hacer.

### Paso 5. Pagar (manual, 30 segundos)

En la pestana que dejo abierta el script:

1. Revisa que la direccion sea la del cliente.
2. Revisa el total.
3. Presiona `Realizar pedido`.

Aqui es donde se cobra. El script nunca lo hace por ti.

### Paso 6. Sacar la guia y pegarla en la orden

Cuando AliExpress ya tiene el pedido, la guia sale de la pagina de pedidos.
Puedes copiarla a mano, o pedirle al script que la busque:

```bash
node tools\aliexpress-pedido.mjs --solo-guia "https://www.aliexpress.com/p/order/index.html"
```

Tambien funciona sin URL: revisa todas las pestanas de AliExpress que tengas
abiertas y te dice en cual aparecio la guia.

```bash
node tools\aliexpress-pedido.mjs --solo-guia
```

Y pegarla en la orden:

```bash
curl -X PATCH http://localhost:3000/api/pedidos/TDR-MKX2P1-9QF4 \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"shipped\",\"supplier\":{\"trackingNumber\":\"LX123456789\",\"trackingUrl\":\"https://www.aliexpress.com/p/order/index.html\",\"costMXN\":107}}"
```

El `PATCH` acepta:

| Campo | Para que sirve |
| --- | --- |
| `status` | `paid`, `packing`, `shipped`, `delivered`, `cancelled`. |
| `supplier.trackingNumber` | Numero de guia. |
| `supplier.trackingUrl` | Link de seguimiento. |
| `supplier.costMXN` | Lo que te costo el producto al proveedor (para calcular la utilidad real). |
| `supplier.orderedAt` | Fecha ISO de la compra. |
| `supplier.itemId` | Id del producto en AliExpress. |
| `notes` | Notas internas del pedido. |

Si corriste el paso 4 con `--actualizar http://localhost:3000`, este paso ya
quedo hecho: el script actualiza la orden solo (estado `packing` si no hay
guia, `shipped` si la encontro).

### Paso 7. Avisar al cliente por WhatsApp

Con la guia ya en la orden, manda el mensaje al numero del cliente. La liga
de WhatsApp de la tienda esta en `NEXT_PUBLIC_STORE_WHATSAPP_LINK` y el
numero en `NEXT_PUBLIC_STORE_WHATSAPP` (archivo `store/.env.local`).

Mensaje sugerido:

```
Hola {nombre}, tu pedido de Taller de Ruta ya va en camino.
Numero de guia: {trackingNumber}
Sigue tu paquete aqui: {trackingUrl}
```

Si quieres automatizarlo despues, el siguiente paso natural es un bot de
WhatsApp que lea `GET /api/pedidos/<id>` y mande el mensaje cuando el estado
pase a `shipped`.

---

## 3. Estados del pedido

```
paid        -> el pago de Mercado Pago quedo aprobado (lo pone el webhook)
packing     -> ya compraste al proveedor, el pedido esta en el paquete
shipped     -> el proveedor ya dio la guia
delivered   -> el cliente recibio el paquete
cancelled   -> se cancelo (reembolso)
```

---

## 4. Cosas que hay que saber

- **El pago nunca es automatico.** A proposito. El script deja la pagina
  lista y tú confirmas.
- **El RFC/CURP es obligatorio** para cualquier envio a Mexico en AliExpress.
  Pon el RFC de tu empresa con `--rfc` o en `RFC_PROVEEDOR`.
- **La direccion se arma con el codigo postal.** AliExpress deduce estado,
  ciudad y colonia a partir del CP, asi que el CP tiene que ir bien. Si la
  colonia que pone AliExpress no es la del cliente, el script te avisa con un
  `aviso` en el paso `direccion` y tu lo corriges a mano en la pagina.
- **La direccion se guarda en tu cuenta de AliExpress.** Si el cliente ya
  tenia una direccion dada de alta, el script la reutiliza en vez de crear
  otra. Si no, crea una nueva.
- **El archivo de pedidos es texto plano.** Sirve para el MVP. Antes de
  escalar a volumen, movete a una base de datos (el modulo
  `store/src/lib/orders.ts` esta armado para que ese cambio sea local).
- **Los endpoints de pedidos no tienen autenticacion.** Es un MVP: agregala
  antes de produccion.

---

## 5. Como probar el webhook

El webhook solo guarda la orden si el pago viene `approved` o `authorized`, y
solo si el pago trae `external_reference` (el id `TDR-...`).

### Con Mercado Pago de prueba (recomendado)

1. Pon un token de prueba en `store/.env.local`:

   ```
   MERCADOPAGO_ACCESS_TOKEN=TEST-0000000000000000-0000000000000000
   ```

2. Levanta la tienda: `cd store && npx next dev`.
3. Haz una compra de prueba desde la tienda (la de Mercado Pago sandbox).
4. Cuando el pago queda aprobado, Mercado Pago manda la notificacion al
   webhook y la orden aparece aqui:

   ```bash
   curl http://localhost:3000/api/pedidos
   ```

> Ojo: el webhook solo se registra si la tienda esta en una URL con HTTPS
> (el checkout de la tienda pone `notification_url` solo cuando es `https://`).
> En local puedes disparar la notificacion a mano con `curl`:
>
> ```bash
> curl -X POST http://localhost:3000/api/webhook/mercadopago \
>   -H "Content-Type: application/json" \
>   -d "{\"type\":\"payment\",\"data\":{\"id\":\"<ID_DEL_PAGO>\"}}"
> ```

### Con un mock (para desarrollo)

El webhook consulta el pago en la API de Mercado Pago. Para no depender de la
API real puedes apuntar a un servidor local:

```
MERCADOPAGO_API_BASE=http://127.0.0.1:8899
```

El mock solo tiene que responder un JSON con esta forma en
`/v1/payments/<id>`:

```json
{
  "id": 999888777,
  "status": "approved",
  "transaction_amount": 688,
  "external_reference": "TDR-MOCK-0001",
  "payer": { "email": "cliente@example.com", "name": "Juan Perez" },
  "metadata": {
    "order_reference": "TDR-MOCK-0001",
    "customer_name": "Juan Perez",
    "customer_phone": "5512345678",
    "shipping_address": "Calle 1 #2 | Col. Centro | Ciudad de Mexico | CP 06000"
  },
  "items": [
    { "id": "kit-soporte-celular-moto-antivibracion-360", "title": "Kit soporte antivibracion 360", "quantity": 1, "unit_price": 599 },
    { "id": "envio", "title": "Envio a domicilio", "quantity": 1, "unit_price": 89 }
  ]
}
```

Con eso, un `curl` al webhook deja el pedido listo en
`store/data/orders.jsonl` sin gastar un peso.
