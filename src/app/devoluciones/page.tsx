import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Devoluciones y garantia",
  description:
    "Politica de devoluciones clara: 30 dias para reportar defectos, reposicion o devolucion de tu dinero. Sin letras chiquitas.",
  alternates: { canonical: "/devoluciones" },
};

export default function ReturnsPage() {
  return (
    <div className="container-page py-14">
      <nav className="text-xs text-muted-2">
        <Link href="/" className="transition hover:text-accent">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <span className="text-muted">Devoluciones</span>
      </nav>

      <header className="mt-8 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Devoluciones y garantia
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Escribimos esta politica para que la puedas aplicar sin depender de nuestro
          criterio. Si algo falla, esto es lo que hacemos.
        </p>
      </header>

      <div className="prose-store mt-12 max-w-3xl">
        <h2>Si el producto llega con defecto</h2>
        <p>
          Tienes <strong>30 dias naturales</strong> a partir de la entrega para
          reportarlo. Escribenos a <a href={`mailto:${site.email}`}>{site.email}</a> con:
        </p>
        <ul>
          <li>Tu numero de orden</li>
          <li>Una descripcion de lo que falla</li>
          <li>Fotos o video donde se vea el problema</li>
        </ul>
        <p>
          Con eso lo resolvemos de una de dos formas, tu eliges: <strong>reponemos el
          producto</strong> sin costo, o <strong>te devolvemos el dinero</strong>{" "}
          completo, incluido el envio.
        </p>

        <h2>Si el producto no es lo que esperabas</h2>
        <p>
          Si el producto funciona bien pero no es lo que esperabas, tienes{" "}
          <strong>15 dias naturales</strong> desde la entrega para devolverlo. En este
          caso el producto debe estar sin usar, completo y en su empaque original.
        </p>
        <p>
          Aqui el envio de retorno corre por tu cuenta. Te devolvemos el valor del
          producto en cuanto lo recibimos y verificamos su estado.
        </p>

        <h2>Que NO cubrimos</h2>
        <p>Para que no haya malentendidos, esto queda fuera de la garantia:</p>
        <ul>
          <li>
            <strong>Dano por mal uso:</strong> golpes, caidas, instalacion incorrecta,
            modificaciones o exposicion a quimicos.
          </li>
          <li>
            <strong>Desgaste normal:</strong> un cubre moto expuesto al sol se degrada con
            el tiempo; eso no es un defecto de fabrica.
          </li>
          <li>
            <strong>Errores de compatibilidad:</strong> si el producto no le queda a tu
            moto porque no verificaste las medidas antes de comprar. Revisa la ficha y la
            guia de medidas; si tienes dudas, preguntanos antes.
          </li>
          <li>
            <strong>Paquetes perdidos por direccion incorrecta:</strong> verifica tu
            direccion al pagar.
          </li>
        </ul>

        <h2>Productos que no vendemos, y por que</h2>
        <p>
          No vendemos cascos, frenos, discos ni pastillas. Son equipo de seguridad critico
          que requiere certificaciones y responsabilidad legal que no podemos asumir, y
          su tasa de falla no perdona.
        </p>
        <p>
          Si buscas eso, te recomendamos comprarlo en una tienda fisica especializada
          donde puedas probarlo y tengas a quien reclamar.
        </p>

        <h2>Como te devolvemos el dinero</h2>
        <p>
          Las devoluciones se procesan por el mismo medio de pago que usaste, a traves de
          Mercado Pago. El tiempo en reflejarse depende de tu banco: normalmente entre 5 y
          10 dias habiles.
        </p>

        <h2>Si no estas de acuerdo con la resolucion</h2>
        <p>
          Escribenos de nuevo y explica tu caso. Preferimos resolver una situacion
          discutible antes que perder un cliente por un monto pequeno.
        </p>
        <p>
          Como consumidor en Mexico tambien puedes acudir a la Procuraduria Federal del
          Consumidor (PROFECO) si consideras que tus derechos no fueron respetados.
        </p>
      </div>

      <div className="mt-12 max-w-3xl rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">
          Para iniciar una devolucion, escribenos a{" "}
          <a
            href={`mailto:${site.email}`}
            className="font-medium text-accent underline underline-offset-4"
          >
            {site.email}
          </a>{" "}
          con tu numero de orden.
        </p>
      </div>
    </div>
  );
}
