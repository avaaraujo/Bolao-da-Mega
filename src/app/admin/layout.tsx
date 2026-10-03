"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartBar, Gear, House, Receipt, Ticket } from "@phosphor-icons/react";
import { useBolao, useStoredValue, writeStoredValue } from "@/components/bolao-provider";
import { Button, cx, InkTitle, Loading, Sheet } from "@/components/riso";

const SESSION = "bolao-da-mega:admin";

const TABS = [
  { href: "/admin", label: "Painel", icon: House },
  { href: "/admin/pagamentos", label: "Pix", icon: Receipt },
  { href: "/admin/ranking", label: "Ranking", icon: ChartBar },
  { href: "/admin/jogos", label: "Jogos", icon: Ticket },
  { href: "/admin/edicao", label: "Edição", icon: Gear },
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
        <InkTitle size="lg" className="mt-6">ÁREA DO AVÁ</InkTitle>
        <p className="mt-5 text-[18px] leading-snug text-ink">
          Aqui você confere os Pix, vê o ranking dos números e monta os jogos.
        </p>
        <p className="mt-3 text-[15px] leading-snug text-ink-soft">
          No modo demo não há senha. Em dezembro, com o Supabase ativo, a entrada passa a ser por login.
        </p>
        <Button
          className="mt-8 min-h-14"
          onClick={() => writeStoredValue("session", SESSION, "1")}
        >
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
      {children}
      <nav aria-label="Seções do Avá" className="fixed inset-x-0 bottom-0 z-50">
        <ul className="mx-auto grid w-full max-w-[480px] grid-cols-5 border-t-2 border-blue bg-paper pb-[env(safe-area-inset-bottom)]">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "condensed relative flex h-16 flex-col items-center justify-center gap-0.5 text-[13px] font-extrabold uppercase",
                    active ? "bg-yellow text-ink" : "text-blue-deep hover:bg-paper-deep",
                  )}
                >
                  <Icon size={24} weight={active ? "fill" : "bold"} aria-hidden="true" />
                  {label}
                  {href === "/admin/pagamentos" && pending > 0 && (
                    <span className="absolute top-1 right-[calc(50%-24px)] flex h-5 min-w-5 items-center justify-center px-1 text-[12px] text-ink">
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
      </nav>
    </>
  );
}
