"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartBar, Gear, House, Receipt, Ticket } from "@phosphor-icons/react";
import { AuthGate } from "@/components/auth-gate";
import { useAdminUser, useBolao } from "@/components/bolao-provider";
import { gsap, MOTION_OK, pop, useGSAP } from "@/components/motion";
import { Button, cx, InkTitle, Loading, Sheet } from "@/components/riso";
import { useEffect, useRef } from "react";

const TABS = [
  { href: "/admin", label: "Painel", long: "Painel", icon: House },
  { href: "/admin/pagamentos", label: "Pix", long: "Pagamentos", icon: Receipt },
  { href: "/admin/ranking", label: "Ranking", long: "Ranking", icon: ChartBar },
  { href: "/admin/jogos", label: "Jogos", long: "Jogos", icon: Ticket },
  { href: "/admin/edicao", label: "Edição", long: "Edição", icon: Gear },
];
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate><Shell>{children}</Shell></AuthGate>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const { snapshot, base } = useBolao();
  const { platform } = useAdminUser();
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);
  const badge = useRef<HTMLSpanElement>(null);
  const pending = snapshot?.participants.filter((p) => p.payment === "em_analise").length ?? 0;
  const lastPending = useRef(pending);

  // Aba nova: o ícone pula como um carimbo de borracha.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const icon = nav.current?.querySelector('[aria-current="page"] svg');
        if (icon) gsap.fromTo(icon, { y: -10, rotate: -16, scale: 1.25 }, { y: 0, rotate: 0, scale: 1, duration: 0.6, ease: "elastic.out(1,0.45)", clearProps: "transform" });
      });
    },
    { dependencies: [pathname, !!snapshot?.isOwner] },
  );

  // Chegou comprovante novo: o contador rosa pula.
  useEffect(() => {
    if (pending > lastPending.current) pop(badge.current);
    lastPending.current = pending;
  }, [pending]);

  if (!snapshot) return <Loading />;

  if (!snapshot.isOwner) {
    return (
      <Sheet>
        <InkTitle size="lg" className="mt-6">
          SÓ O DONO ENTRA
        </InkTitle>
        <p className="mt-5 text-[18px] leading-snug text-ink">
          Esta conta não é a organizadora deste bolão. Entre com a conta que criou {snapshot.edition.name}.
        </p>
        <Button variant="outline" className="mt-8 self-start" onClick={() => platform.signOut()}>
          Sair desta conta
        </Button>
        <Link href={base} className="semi mt-5 min-h-11 self-start text-[15px] font-bold text-blue-deep underline underline-offset-4">
          Voltar para a página do bolão
        </Link>
      </Sheet>
    );
  }

  return (
    <>
      <div className="lg:pl-[248px]">{children}</div>
      {/* Celular: abas embaixo. Desktop: trilho fixo à esquerda, como a lombada do zine. */}
      <nav
        ref={nav}
        aria-label="Seções do organizador"
        className="fixed inset-x-0 bottom-0 z-50 lg:inset-y-0 lg:right-auto lg:flex lg:w-[248px] lg:flex-col lg:border-r-2 lg:border-blue lg:bg-paper lg:px-5 lg:pt-10 lg:pb-8"
      >
        <div className="hidden lg:mb-10 lg:block">
          <InkTitle size="md" as="p">
            {snapshot.edition.name.toUpperCase()}
          </InkTitle>
          <p className="condensed mt-2 text-[15px] font-extrabold uppercase text-blue-deep">Código {snapshot.edition.code}</p>
        </div>
        <ul className="mx-auto grid w-full max-w-[480px] grid-cols-5 border-t-2 border-blue bg-paper pb-[env(safe-area-inset-bottom)] lg:mx-0 lg:flex lg:max-w-none lg:flex-col lg:gap-1 lg:border-t-0 lg:pb-0">
          {TABS.map(({ href, label, long, icon: Icon }) => {
            const full = `${base}${href}`;
            const active = href === "/admin" ? pathname === full : pathname.startsWith(full);
            return (
              <li key={href}>
                <Link
                  href={full}
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
                    <span ref={badge} className="absolute top-1 right-[calc(50%-24px)] flex h-5 min-w-5 items-center justify-center px-1 text-[12px] text-ink lg:relative lg:top-auto lg:right-auto lg:ml-auto lg:h-6 lg:min-w-6 lg:text-[13px]">
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
        <div className="semi mt-auto hidden flex-col gap-2 text-[15px] font-bold text-blue-deep lg:flex">
          <Link href={base} className="underline underline-offset-4">
            Ver a página do bolão
          </Link>
          <Link href="/admin" className="underline underline-offset-4">
            Meus bolões
          </Link>
          <button type="button" onClick={() => platform.signOut()} className="self-start underline underline-offset-4">
            Sair
          </button>
        </div>
      </nav>
    </>
  );
}
