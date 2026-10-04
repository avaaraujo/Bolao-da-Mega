import type { Metadata, Viewport } from "next";
import { Anybody, Archivo } from "next/font/google";
import { Toaster } from "sonner";
import { BolaoProvider } from "@/components/bolao-provider";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
});

// Display ultracondensado: o título cabe grande numa linha, como cartaz de riso.
const anybody = Anybody({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-anybody",
});

const description = "O bolão da Mega da Virada do Avá: cotas, Pix, comprovante e 6 números.";

export const metadata: Metadata = {
  // Base das URLs absolutas da imagem de compartilhamento; na Vercel, a URL de produção.
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3077",
  ),
  title: "Bolão da Mega",
  description,
  openGraph: {
    title: "Bolão da Mega",
    description,
    siteName: "Bolão da Mega",
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#fbfaf6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${anybody.variable}`}>
      <body className="antialiased">
        {/* Textura de tinta riso: falhas finas e borda levemente irregular. */}
        <svg width="0" height="0" aria-hidden="true" className="absolute">
          <filter id="riso-ink" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="grain" />
            <feColorMatrix
              in="grain"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.35"
              result="holes"
            />
            <feComposite in="SourceGraphic" in2="holes" operator="in" result="inked" />
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp" />
            <feDisplacementMap in="inked" in2="warp" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <BolaoProvider>{children}</BolaoProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#fbfaf6",
              color: "#1a1a1a",
              border: "2px solid #0078bf",
              borderRadius: "6px",
              fontFamily: "var(--font-archivo)",
            },
          }}
        />
      </body>
    </html>
  );
}
