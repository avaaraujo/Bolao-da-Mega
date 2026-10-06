import type { Metadata } from "next";
import { Landing } from "@/components/landing";
import { homeJsonLd, jsonLdString } from "@/lib/agent/jsonld";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(homeJsonLd()) }} />
      <Landing />
    </>
  );
}
