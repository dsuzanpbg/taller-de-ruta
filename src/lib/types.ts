export type ProductRole = "hero" | "catalogo" | "upsell";

export type Spec = { label: string; value: string };
export type Faq = { q: string; a: string };

export type Product = {
  slug: string;
  name: string;
  /** Nombre corto para tarjetas y menús */
  shortName: string;
  /** slug de la colección a la que pertenece */
  collection: string;
  role: ProductRole;
  /** Precio de venta en MXN */
  price: number;
  /** Precio tachado de referencia (opcional) */
  compareAt?: number;
  /** Costo estimado de proveedor en MXN, para cálculo interno de margen */
  costMXN: number;
  badge?: string;
  summary: string;
  description: string[];
  features: string[];
  specs: Spec[];
  faq: Faq[];
  keywords: string[];
  /** Nota honesta sobre el tiempo de entrega de este producto */
  shippingNote: string;
  /** Ruta de la imagen dentro de /public */
  image: string;
  rating: number;
  reviews: number;
  available: boolean;
  featured: boolean;
};

export const MARGIN_FLOOR = 0.55;
