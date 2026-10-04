import type { MetadataRoute } from "next";
import { INFO_PAGES } from "@/lib/agent/content";
import { CONTENT_UPDATED, absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), lastModified: CONTENT_UPDATED, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/entrar"), lastModified: CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.7 },
    ...INFO_PAGES.map((p) => ({
      url: absoluteUrl(p.path),
      lastModified: CONTENT_UPDATED,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
