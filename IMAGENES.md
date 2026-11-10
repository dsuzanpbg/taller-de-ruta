# Imagenes de producto

## Estado actual: placeholders

Las 14 imagenes en `public/productos/` **no son fotos del producto**. Son
placeholders generados con Python que respetan la identidad visual de la tienda.

Funcionan para revisar el diseno y la estructura, pero **vender con ellas es un
problema**: el cliente compra por foto, y una imagen generica reduce la
confianza y la conversion de forma directa.

La ficha de producto ya lo aclara con el texto "Imagen ilustrativa del
producto". Ese aviso es honesto mientras son placeholders; **quitalo cuando
pongas fotos reales** (esta en `src/app/producto/[slug]/page.tsx`).

---

## Que necesitas para reemplazarlas

Por cada producto, idealmente **3 a 5 imagenes**:

1. Foto principal con fondo limpio (la que se ve en el catalogo).
2. Foto del producto en uso, montado en la moto.
3. Detalle del material, cierre o acabado.
4. Foto con referencia de escala.
5. Foto del empaque o de lo que incluye el paquete.

## De donde sacar las fotos

Por orden de calidad:

1. **Fotos propias.** Las mejores. Pide una muestra del producto y fotografiala
   con tu telefono. Con luz natural y fondo neutro es suficiente.
2. **Fotos del proveedor con permiso.** Muchos proveedores de AliExpress o
   CJdropshipping permiten el uso comercial de sus imagenes. **Pidelo por
   escrito en el chat del proveedor** antes de usarlas.
3. **Renders propios.** Si no puedes fotografiar, un render del producto en 3D
   es mejor que un placeholder abstracto.

**Nunca uses** fotos de Amazon, Mercado Libre u otras tiendas. Es la via rapida
a un reclamo por derechos de autor.

---

## Como reemplazarlas

### Opcion A: mismo nombre de archivo (mas rapido)

Sobrescribe el archivo existente conservando el nombre. Por ejemplo, para el
producto estrella:

```
public/productos/kit-soporte-antivibracion-360.png
```

El sitio la toma automaticamente. No hay que tocar codigo.

**Especificaciones recomendadas:**

- Formato: JPG o WebP para fotos (PNG solo si necesitas transparencia)
- Tamano minimo: 1200 x 1200 px (formato cuadrado, es el que espera la ficha)
- Peso: menos de 300 KB por imagen
- Fondo: blanco o gris neutro para las fotos de catalogo

> Nota: el sitio usa el optimizador de imagenes de Next.js, que convierte a
> WebP/AVIF y genera los tamanos responsive en automatico. Sube la imagen en
> buena calidad y deja que el optimizador haga el resto.

### Opcion B: otro formato o varios angulos

1. Coloca las imagenes en `public/productos/`.
2. En `src/data/products.ts`, cambia el campo `image` del producto:

   ```ts
   image: "/productos/kit-soporte-antivibracion-360-uso-real.jpg",
   ```

Si necesitas galeria con varias imagenes por producto, hay que agregar un campo
`gallery: string[]` al tipo `Product` en `src/lib/types.ts` y renderizarlo en
`src/app/producto/[slug]/page.tsx`. La ficha actual muestra una sola imagen.

---

## Regenerar los placeholders

Si cambias el catalogo y quieres placeholders nuevos:

```bash
python scripts/generate-product-images.py
```

El script esta en `scripts/generate-product-images.py`. Para agregar un producto
nuevo, añade una linea a la lista `PRODUCTS` al final del archivo con:

```python
("slug-del-producto", "Nombre corto", "Categoria", "tipo-de-icono"),
```

Tipos de icono disponibles: `phone-mount`, `phone-waterproof`, `grips`,
`backpack`, `saddlebags`, `leg-bag`, `tool-roll`, `bike-cover`, `handguards`,
`disc-lock`, `cargo-net`, `chain-brush`, `stickers`, `reflective`.

---

## Checklist antes de lanzar

- [ ] Cada uno de los 14 productos tiene al menos una foto real
- [ ] Fotos con permiso por escrito del proveedor, o propias
- [ ] Imagenes cuadradas de al menos 1200 x 1200 px
- [ ] Fotos comprimidas (menos de 300 KB cada una)
- [ ] Se quito el aviso "Imagen ilustrativa del producto" de la ficha
- [ ] Ninguna foto contiene logos de marcas registradas
