import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Área do organizador e salas dos bolões e bilhetes pessoais não são conteúdo público.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/b/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
