import type { Metadata, Viewport } from "next";

import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { site } from "@/data/site";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? site.url;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "accesorios moto",
    "soporte celular moto",
    "alforjas moto",
    "cubre moto impermeable",
    "punos moto",
    "accesorios para repartidor",
  ],
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: site.name,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: site.name,
    description: site.description,
    url: siteUrl,
    email: site.email,
    areaServed: "MX",
    currenciesAccepted: "MXN",
    paymentAccepted: "Tarjeta de credito, tarjeta de debito, transferencia",
  };

  return (
    <html lang="es-MX">
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
