import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Área do organizador e bilhetes pessoais não são conteúdo público.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/p/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
