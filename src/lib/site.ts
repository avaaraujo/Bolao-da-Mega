export const SITE_NAME = "Bolão da Mega";
export const SITE_DESCRIPTION = "O bolão da Mega da Virada do Avá: cotas, Pix, comprovante e 6 números.";
export const SITE_LANG = "pt-BR";
/** Data da última revisão do conteúdo público (usada no sitemap). */
export const CONTENT_UPDATED = "2026-10-04";

/** URL pública do site: a de produção na Vercel, ou localhost no desenvolvimento. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.NODE_ENV === "production"
      ? "https://bolaodamega1.vercel.app"
      : "http://localhost:3077")
).replace(/\/+$/, "");

export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

/**
 * Dados de contato públicos. Só entram no site (página de contato e JSON-LD) quando
 * definidos nas variáveis de ambiente: nada é inventado nem exposto por padrão.
 */
export const CONTACT = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  address:
    process.env.NEXT_PUBLIC_ADDRESS_LOCALITY && process.env.NEXT_PUBLIC_ADDRESS_COUNTRY
      ? {
          streetAddress: process.env.NEXT_PUBLIC_ADDRESS_STREET || undefined,
          addressLocality: process.env.NEXT_PUBLIC_ADDRESS_LOCALITY,
          addressRegion: process.env.NEXT_PUBLIC_ADDRESS_REGION || undefined,
          postalCode: process.env.NEXT_PUBLIC_ADDRESS_POSTAL_CODE || undefined,
          addressCountry: process.env.NEXT_PUBLIC_ADDRESS_COUNTRY,
        }
      : null,
};
