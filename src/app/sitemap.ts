import type { MetadataRoute } from "next";

import { collections } from "@/data/collections";
import { getAllGuides } from "@/data/guides";
import { getProductSlugs } from "@/data/products";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/tienda`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/guias`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/envios`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/devoluciones`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/contacto`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/nosotros`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  const productRoutes: MetadataRoute.Sitemap = getProductSlugs().map((slug) => ({
    url: `${base}/producto/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const collectionRoutes: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: `${base}/coleccion/${collection.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const guideRoutes: MetadataRoute.Sitemap = getAllGuides().map((guide) => ({
    url: `${base}/guias/${guide.slug}`,
    lastModified: new Date(guide.updated),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...collectionRoutes, ...guideRoutes];
}
