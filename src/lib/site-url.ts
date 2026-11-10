import { site } from "@/data/site";

/**
 * URL publica del sitio, sin diagonal final.
 * Se usa para sitemap, robots, canonical y los back_urls de pago.
 */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? site.url).replace(/\/$/, "");
}
