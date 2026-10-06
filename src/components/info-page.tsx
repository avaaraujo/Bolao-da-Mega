import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, InkTitle, Label, Sheet } from "./riso";
import { INFO_PAGES, type InfoPageContent } from "@/lib/agent/content";

export function infoMetadata(page: InfoPageContent): Metadata {
  return { title: page.title, description: page.description, alternates: { canonical: page.path } };
}

/** Página de texto no sistema visual riso: título-cartaz, seções e links para as irmãs. */
export function InfoPage({ page }: { page: InfoPageContent }) {
  return (
    <Sheet>
      <InkTitle className="mt-2">{page.headline}</InkTitle>
      <p className="semi mt-3 text-[18px] font-bold leading-snug text-blue-deep">{page.description}</p>

      {page.sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <Label>{s.heading}</Label>
          {s.paragraphs?.map((text) => (
            <p key={text} className="mt-3 text-[17px] leading-snug text-ink">
              {text}
            </p>
          ))}
          {s.items && (
            <ul className="mt-3 flex flex-col">
              {s.items.map((item) => (
                <li key={item} className="border-t border-blue/40 py-2.5 text-[17px] leading-snug text-ink first:border-t-0">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <nav aria-label="Outras páginas" className="semi mt-10 flex flex-wrap gap-x-5 gap-y-2 text-[15px] font-bold text-blue-deep">
        {INFO_PAGES.filter((p) => p.path !== page.path).map((p) => (
          <Link key={p.path} href={p.path} className="underline underline-offset-4">
            {p.title}
          </Link>
        ))}
      </nav>
      <ButtonLink href="/" variant="outline" className="mt-8 self-start">
        Voltar ao início
      </ButtonLink>
    </Sheet>
  );
}
