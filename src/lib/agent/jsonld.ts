import { CONTACT, CONTENT_UPDATED, SITE_DESCRIPTION, SITE_LANG, SITE_NAME, absoluteUrl } from "../site";

/** JSON-LD da página inicial: organização, site e aplicação web. */
export function homeJsonLd() {
  const orgId = absoluteUrl("/#organization");
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": orgId,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.svg"),
    description: SITE_DESCRIPTION,
  };
  // contactPoint e address só existem com dados reais configurados (ver CONTACT em site.ts).
  if (CONTACT.email) {
    organization.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT.email,
      availableLanguage: SITE_LANG,
      url: absoluteUrl("/contact"),
    };
  }
  if (CONTACT.address) organization.address = { "@type": "PostalAddress", ...CONTACT.address };

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        name: SITE_NAME,
        url: absoluteUrl("/"),
        description: SITE_DESCRIPTION,
        inLanguage: SITE_LANG,
        publisher: { "@id": orgId },
      },
      {
        "@type": "SoftwareApplication",
        "@id": absoluteUrl("/#app"),
        name: SITE_NAME,
        url: absoluteUrl("/"),
        description: SITE_DESCRIPTION,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        inLanguage: SITE_LANG,
        dateModified: CONTENT_UPDATED,
        offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
        publisher: { "@id": orgId },
      },
    ],
  };
}

/** Serializa para <script type="application/ld+json">, escapando "<" para não fechar a tag. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
