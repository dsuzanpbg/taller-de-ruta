import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/data/site";
import { formatMXN } from "@/lib/format";

export const metadata: Metadata = {
  title: "Envio y tiempos de entrega",
  description:
    "Tiempos de entrega reales, costo de envio y como rastrear tu pedido en Mexico. Envio gratis desde $599 MXN.",
  alternates: { canonical: "/envios" },
};

export default function ShippingPage() {
  return (
    <div className="container-page py-14">
      <nav className="text-xs text-muted-2">
        <Link href="/" className="transition hover:text-accent">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <span className="text-muted">Envio y tiempos</span>
      </nav>

      <header className="mt-8 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Envio y tiempos de entrega
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Preferimos decirte los tiempos reales aunque no sean los mas rapidos del
          mercado. Asi sabes exactamente que esperar y no te llevas una sorpresa.
        </p>
      </header>

      <div className="prose-store mt-12 max-w-3xl">
        <h2>Cuanto tarda mi pedido</h2>
        <p>
          El tiempo total es de <strong>{site.deliveryMin} a {site.deliveryMax} dias
          habiles</strong> contados desde que confirmamos tu pago. Ese plazo se divide en
          dos partes:
        </p>
        <ul>
          <li>
            <strong>Preparacion (1 a 3 dias habiles):</strong> confirmamos tu pedido con
            el proveedor y se despacha.
          </li>
          <li>
            <strong>Transito ({site.deliveryMin - 3} a {site.deliveryMax - 3} dias
            habiles):</strong> el tiempo que tarda el paquete en llegar a tu domicilio.
          </li>
        </ul>
        <p>
          Los dias habiles no incluyen sabados, domingos ni dias festivos. Los pedidos
          hechos despues de las 14:00 horas se procesan el siguiente dia habil.
        </p>

        <h2>Cuanto cuesta el envio</h2>
        <p>
          El envio tiene un costo fijo de <strong>{formatMXN(site.shippingFlat)}</strong> a
          cualquier estado de la Republica. Si tu pedido supera los{" "}
          <strong>{formatMXN(site.freeShippingFrom)}</strong>, el envio es gratis.
        </p>
        <p>
          En la pagina del carrito te mostramos cuanto te falta para alcanzar el envio
          gratis, para que puedas decidir si te conviene agregar algo mas.
        </p>

        <h2>Como rastreo mi pedido</h2>
        <p>
          Te enviamos el numero de guia por correo electronico en cuanto el proveedor
          despacha. Con ese numero puedes seguir el envio directamente con la paqueteria.
        </p>
        <p>
          Si pasaron mas de 5 dias habiles desde tu compra y no has recibido la guia,
          escribenos a <a href={`mailto:${site.email}`}>{site.email}</a> con tu numero de
          orden y lo revisamos.
        </p>

        <h2>A donde enviamos</h2>
        <p>
          Enviamos a <strong>todo Mexico</strong>. Por ahora no enviamos a otros paises.
        </p>
        <p>
          Verifica que tu direccion este completa y correcta antes de pagar: incluye
          calle, numero, colonia, ciudad, estado y codigo postal. Si el paquete se
          pierde por un dato incorrecto, la reposicion corre por tu cuenta.
        </p>

        <h2>Que pasa si no estoy en casa</h2>
        <p>
          Las paqueterias intentan entregar y, si no hay nadie, dejan aviso para recoger
          el paquete en su sucursal. Revisa los avisos: si el paquete no se recoge en el
          plazo que la paqueteria establece, se devuelve al remitente.
        </p>

        <h2>Si tu pedido se retrasa</h2>
        <p>
          Los retrasos pasan por causas fuera de nuestro control: saturacion de aduana,
          clima, huelgas o temporadas altas como Buen Fin y Navidad.
        </p>
        <p>
          Si tu pedido tarda mas de lo pactado, escribenos. Lo revisamos y te damos una
          fecha concreta o te devolvemos tu dinero si ya no tiene sentido esperar.
        </p>
      </div>

      <div className="mt-12 max-w-3xl rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">
          ¿Tienes dudas sobre tu envio?{" "}
          <Link
            href="/contacto"
            className="font-medium text-accent underline underline-offset-4"
          >
            Escribenos
          </Link>{" "}
          y te respondemos en menos de 24 horas habiles.
        </p>
      </div>
    </div>
  );
}
