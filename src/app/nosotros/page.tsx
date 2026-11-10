import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Sobre la tienda",
  description:
    "Quienes somos, como elegimos los productos y por que no vendemos cascos ni refacciones de frenos.",
  alternates: { canonical: "/nosotros" },
};

export default function AboutPage() {
  return (
    <div className="container-page py-14">
      <nav className="text-xs text-muted-2">
        <Link href="/" className="transition hover:text-accent">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <span className="text-muted">Sobre la tienda</span>
      </nav>

      <header className="mt-8 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Sobre {site.name}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Vendemos accesorios para moto de uso diario, no para el domingo.
        </p>
      </header>

      <div className="prose-store mt-12 max-w-3xl">
        <h2>Por que existe esta tienda</h2>
        <p>
          Comprar accesorios de moto en Mexico es una loteria. En los marketplaces
          encuentras cincuenta vendedores con la misma foto, el mismo producto y precios
          que van de 98 a 900 pesos sin que se entienda la diferencia.
        </p>
        <p>
          Gran parte de lo barato falla rapido: el soporte se afloja, el cable se
          desconecta, el candado se traba. Y lo caro muchas veces es exactamente el mismo
          producto con otro precio.
        </p>
        <p>
          Esta tienda existe para hacer ese filtro. Probamos, descartamos y solo dejamos
          lo que aguanta uso urbano constante.
        </p>

        <h2>Como elegimos los productos</h2>
        <p>Cada producto que ves aqui paso por el mismo filtro:</p>
        <ul>
          <li>
            <strong>Uso diario real:</strong> tiene que resolver un problema que se repite
            todos los dias, no una necesidad inventada.
          </li>
          <li>
            <strong>Reputacion verificable del proveedor:</strong> historial de ventas,
            valoraciones y tasa de devolucion razonable.
          </li>
          <li>
            <strong>Entrega rastreable:</strong> si no hay numero de guia, no lo vendemos.
            No vas a quedar sin saber donde va tu paquete.
          </li>
          <li>
            <strong>Riesgo bajo:</strong> nada que, si falla, te ponga en peligro.
          </li>
        </ul>

        <h2>Lo que decidimos no vender</h2>
        <p>
          Hay categorias con mucha demanda que dejamos fuera de forma deliberada. No es
          por falta de mercado, es por responsabilidad:
        </p>
        <ul>
          <li>
            <strong>Cascos.</strong> Es equipo de seguridad certificado, con tallas y
            responsabilidad legal. No es un producto que deba venderse por catalogo sin
            probarlo.
          </li>
          <li>
            <strong>Frenos, discos y pastillas.</strong> Una pieza defectuosa aqui puede
            matar a alguien. Ningun ahorro justifica ese riesgo.
          </li>
          <li>
            <strong>Piezas especificas por modelo.</strong> La compatibilidad es tan
            estrecha que la mayoria de las compras terminan en devolucion.
          </li>
          <li>
            <strong>Electronicos complejos.</strong> Camaras, intercomunicadores y alarmas
            requieren soporte tecnico y garantia que no podemos dar bien todavia.
          </li>
        </ul>

        <h2>Sobre el modelo de negocio</h2>
        <p>
          Trabajamos con proveedores internacionales seleccionados y despachamos el pedido
          cuando tu lo haces. Eso nos permite ofrecer precios mas bajos sin tener bodega
          propia.
        </p>
        <p>
          El costo de ese modelo es el tiempo de entrega: {site.deliveryMin} a{" "}
          {site.deliveryMax} dias habiles, mas lento que una tienda con stock local.
          Preferimos decirtelo claro desde el inicio en lugar de prometer entregas
          express que no podemos cumplir.
        </p>

        <h2>Sobre las marcas</h2>
        <p>
          Todos nuestros productos son genericos. <strong>No vendemos imitaciones ni
          productos con logos de marcas registradas</strong> como Honda, Yamaha, Italika,
          Bajaj o similares.
        </p>
        <p>
          Tampoco usamos fotos ni textos de otras tiendas. Si ves un producto nuestro que
          se parece mucho a otro, probablemente sea el mismo fabricante generico, que es
          algo normal en esta industria.
        </p>

        <h2>Nuestro compromiso concreto</h2>
        <p>Sin promesas infladas, esto es lo que nos comprometemos a hacer:</p>
        <ul>
          <li>Decirte los tiempos de entrega reales, aunque no sean los mas rapidos.</li>
          <li>Darte un numero de guia para que sigas tu paquete.</li>
          <li>
            Responder en menos de 24 horas habiles, con una persona que puede resolver.
          </li>
          <li>
            Reponer o devolver tu dinero si el producto llega defectuoso. Sin discutir.
          </li>
          <li>Avisarte si un producto no le queda a tu moto, antes de que lo compres.</li>
        </ul>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/tienda"
          className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
        >
          Ver el catalogo
        </Link>
        <Link
          href="/contacto"
          className="rounded-lg border border-line px-6 py-3 text-sm font-semibold transition hover:border-line-2 hover:bg-surface"
        >
          Contacto
        </Link>
      </div>
    </div>
  );
}
