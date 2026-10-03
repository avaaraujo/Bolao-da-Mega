"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartBar, Gear, House, Receipt, Ticket } from "@phosphor-icons/react";
import { useBolao, useStoredValue, writeStoredValue } from "@/components/bolao-provider";
import { Button, cx, InkTitle, Loading, Sheet } from "@/components/riso";

const SESSION = "bolao-da-mega:admin";

const TABS = [
  { href: "/admin", label: "Painel", long: "Painel", icon: House },
  { href: "/admin/pagamentos", label: "Pix", long: "Pagamentos", icon: Receipt },
  { href: "/admin/ranking", label: "Ranking", long: "Ranking", icon: ChartBar },
  { href: "/admin/jogos", label: "Jogos", long: "Jogos", icon: Ticket },
  { href: "/admin/edicao", label: "Edição", long: "Edição", icon: Gear },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { snapshot } = useBolao();
  const pathname = usePathname();
  const stored = useStoredValue("session", SESSION);
  const authed = stored === undefined ? null : stored === "1";

  if (authed === null || !snapshot) return <Loading />;

  if (!authed) {
    return (
      <Sheet>
        <InkTitle size="lg" className="mt-6">
          ÁREA DO AVÁ
        </InkTitle>
        <p className="mt-5 text-[18px] leading-snug text-ink">Aqui você confere os Pix, vê o ranking dos números e monta os jogos.</p>
        <p className="mt-3 text-[15px] leading-snug text-ink-soft">
          No modo demo não há senha. Em dezembro, com o Supabase ativo, a entrada passa a ser por login.
        </p>
        <Button className="mt-8 min-h-14" onClick={() => writeStoredValue("session", SESSION, "1")}>
          Entrar como Avá
        </Button>
        <Link href="/" className="semi mt-5 min-h-11 self-start text-[15px] font-bold text-blue-deep underline underline-offset-4">
          Voltar para a página do bolão
        </Link>
      </Sheet>
    );
  }

  const pending = snapshot.participants.filter((p) => p.payment === "em_analise").length;

  return (
    <>
      <div className="lg:pl-[248px]">{children}</div>
      {/* Celular: abas embaixo. Desktop: trilho fixo à esquerda, como a lombada do zine. */}
      <nav
        aria-label="Seções do Avá"
        className="fixed inset-x-0 bottom-0 z-50 lg:inset-y-0 lg:right-auto lg:flex lg:w-[248px] lg:flex-col lg:border-r-2 lg:border-blue lg:bg-paper lg:px-5 lg:pt-10 lg:pb-8"
      >
        <div className="hidden lg:mb-10 lg:block">
          <InkTitle size="md" as="p">
            BOLÃO DA MEGA
          </InkTitle>
          <p className="condensed mt-2 text-[15px] font-extrabold uppercase text-blue-deep">Área do Avá</p>
        </div>
        <ul className="mx-auto grid w-full max-w-[480px] grid-cols-5 border-t-2 border-blue bg-paper pb-[env(safe-area-inset-bottom)] lg:mx-0 lg:flex lg:max-w-none lg:flex-col lg:gap-1 lg:border-t-0 lg:pb-0">
          {TABS.map(({ href, label, long, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "condensed relative flex h-16 flex-col items-center justify-center gap-0.5 text-[13px] font-extrabold uppercase lg:h-12 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:px-3 lg:text-[17px]",
                    active ? "bg-yellow text-ink" : "text-blue-deep hover:bg-paper-deep",
                  )}
                >
                  <Icon size={24} weight={active ? "fill" : "bold"} aria-hidden="true" />
                  <span className="lg:hidden">{label}</span>
                  <span className="hidden lg:inline">{long}</span>
                  {href === "/admin/pagamentos" && pending > 0 && (
                    <span className="absolute top-1 right-[calc(50%-24px)] flex h-5 min-w-5 items-center justify-center px-1 text-[12px] text-ink lg:relative lg:top-auto lg:right-auto lg:ml-auto lg:h-6 lg:min-w-6 lg:text-[13px]">
                      <span aria-hidden="true" className="ink absolute inset-0 rounded-full bg-pink" />
                      <span className="relative">{pending}</span>
                      <span className="sr-only"> para conferir</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link href="/" className="semi mt-auto hidden text-[15px] font-bold text-blue-deep underline underline-offset-4 lg:block">
          Ver a página do bolão
        </Link>
      </nav>
    </>
  );
}
