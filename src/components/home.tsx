"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useBolao, useMyTokens } from "@/components/bolao-provider";
import { ActionBar, ButtonLink, Label, Sheet, InkTitle, Strip } from "@/components/riso";
import { approvedTotals, gameCost, planGames } from "@/lib/rules";
import { summarizeSizes } from "@/lib/labels";
import { CostBar } from "@/components/jogos";
import { CountUp } from "@/components/motion";
import { brlShort, dayMonth, firstName, plural } from "@/lib/format";
import { RULES, STEPS } from "@/lib/agent/content";

export function Home() {
  const { snapshot, base } = useBolao();
  const mine = useMyTokens();

  // No HTML do servidor e antes de os dados carregarem, a capa já mostra o texto fixo (título,
  // como funciona, regras). Só o pote, as datas e a ação dependem dos dados.
  const edition = snapshot?.edition;
  const totals = snapshot && edition ? approvedTotals(snapshot.participants, edition.quotaPrice) : null;
  const plan = totals && edition ? planGames(totals.total, edition.betPrice) : null;
  const pot =
    plan && edition ? plan.sizes.map((size, index) => ({ index, size, cost: gameCost(size, edition.betPrice), numbers: [] })) : [];
  const myEntries = snapshot ? snapshot.participants.filter((p) => mine.includes(p.token)) : [];

  const bar = !edition ? null : edition.status === "aberta" ? (
    <ButtonLink href={`${base}/entrar`}>
      Entrar no bolão <ArrowRight size={20} weight="bold" aria-hidden="true" />
    </ButtonLink>
  ) : edition.status === "apostada" ? (
    <ButtonLink href={`${base}/resultado`}>
      Ver ranking e jogos <ArrowRight size={20} weight="bold" aria-hidden="true" />
    </ButtonLink>
  ) : (
    <ButtonLink href="#" aria-disabled="true" className="pointer-events-none bg-paper-deep text-ink-soft">
      Inscrições encerradas
    </ButtonLink>
  );

  return (
    <Sheet
      split="even"
      bar={bar ? <ActionBar>{bar}</ActionBar> : undefined}
      side={
        <>
          <section className="mt-8 lg:mt-0">
            <Label>Como funciona</Label>
            <ol className="mt-3 flex flex-col lg:mt-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex items-baseline gap-4 border-t border-blue/40 py-3 first:border-t-0 lg:gap-7 lg:py-6">
                  <span data-pop className="display ink inline-block w-7 shrink-0 text-[34px] text-pink lg:w-14 lg:text-[76px]">{i + 1}</span>
                  <span className="flex flex-col">
                    <span className="condensed text-[20px] font-extrabold uppercase leading-tight text-ink lg:text-[30px]">{s.title}</span>
                    <span className="text-[16px] leading-snug text-ink-soft lg:text-[19px]">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <Strip className="mt-6 flex-col !items-start !gap-0.5 lg:mt-8">
            {edition && <span>Inscrições até {dayMonth(edition.deadline)}</span>}
            <span className="font-medium text-ink">Os números de cada um ficam em segredo até as apostas serem feitas.</span>
          </Strip>

          <details className="mt-4 border-t border-blue/40 pt-3">
            <summary className="condensed cursor-pointer text-[19px] font-extrabold uppercase text-blue-deep">Regras do bolão</summary>
            <ul className="mt-2 flex flex-col gap-2 text-[15px] leading-snug text-ink-soft">
              {RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </details>

          <footer className="mt-10 flex flex-col gap-3 text-[14px] text-ink-soft lg:mt-auto lg:pt-10">
            <nav aria-label="Sobre o bolão" className="semi flex flex-wrap gap-x-4 gap-y-1 font-semibold">
              <Link href="/about" className="underline underline-offset-4">Sobre</Link>
              <Link href="/contact" className="underline underline-offset-4">Contato</Link>
              <Link href="/privacy" className="underline underline-offset-4">Privacidade</Link>
            </nav>
            <div className="flex items-center justify-between gap-4">
              <span className="semi font-semibold">{process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? `Código ${edition?.code ?? ""}` : "Modo demo: dados fictícios"}</span>
              <Link href={`${base}/admin`} className="semi font-bold text-blue-deep underline underline-offset-4">
                Área do organizador
              </Link>
            </div>
          </footer>
        </>
      }
    >
      <InkTitle stack>{"BOLÃO\nDA MEGA"}</InkTitle>
      <p className="semi mt-3 text-[18px] font-bold text-blue-deep lg:mt-5 lg:text-[22px]">
        Mega da Virada{edition ? ` · ${dayMonth(edition.drawDate)} · ${edition.name}` : ""}
      </p>

      {myEntries.map((p) => (
        <Link
          key={p.token}
          href={`${base}/p/${p.token}`}
          className="mt-5 flex items-center justify-between gap-3 rounded-md bg-yellow px-4 py-3.5 text-ink transition-transform active:translate-y-px"
        >
          <span className="semi text-[17px] font-bold leading-snug">
            {firstName(p.name)}, você está no bolão · {plural(p.quotas, "cota", "cotas")}
          </span>
          <span className="condensed flex shrink-0 items-center gap-1 text-[16px] font-extrabold uppercase">
            Meu bilhete <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </span>
        </Link>
      ))}

      {/* No desktop o pote desce para o pé da capa, junto da ação. */}
      <section data-anchor className="mt-8 lg:mt-auto lg:pt-12">
        <Label aside={totals ? <CountUp value={totals.total} format={brlShort} /> : undefined}>O pote até agora</Label>
        {totals && plan ? (
          <>
            <p className="semi mt-1 mb-3 text-[16px] font-semibold text-ink-soft">
              {plural(totals.people, "pessoa", "pessoas")} · {plural(totals.quotas, "cota confirmada", "cotas confirmadas")}
            </p>
            {pot.length > 0 ? (
              <>
                <CostBar games={pot} total={totals.total} />
                <p className="semi mt-2 text-[17px] font-bold leading-snug text-ink">Já dá para {summarizeSizes(plan.sizes)}.</p>
              </>
            ) : (
              <p className="text-[16px] text-ink-soft">Os primeiros Pix confirmados aparecem aqui.</p>
            )}
          </>
        ) : (
          <p className="mt-1 text-[16px] text-ink-soft motion-safe:animate-pulse">Imprimindo…</p>
        )}
      </section>
    </Sheet>
  );
}
