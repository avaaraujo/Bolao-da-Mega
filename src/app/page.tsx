"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useBolao, useMyTokens } from "@/components/bolao-provider";
import { ActionBar, ButtonLink, Label, Loading, Sheet, InkTitle, Strip } from "@/components/riso";
import { approvedTotals, gameCost, planGames } from "@/lib/rules";
import { summarizeSizes } from "@/lib/labels";
import { CostBar } from "@/components/jogos";
import { brlShort, dayMonth, firstName, plural } from "@/lib/format";

const STEPS = [
  { title: "Escolha as cotas", text: "Quantas quiser, R$ 60 cada." },
  { title: "Faça o Pix", text: "O valor exato aparece na hora." },
  { title: "Mande o comprovante", text: "Foto ou PDF, direto aqui." },
  { title: "Marque 6 números", text: "Os mais votados do grupo viram os jogos." },
];

export default function Home() {
  const { snapshot } = useBolao();
  const mine = useMyTokens();
  if (!snapshot) return <Loading />;

  const { edition, participants } = snapshot;
  const totals = approvedTotals(participants, edition.quotaPrice);
  const plan = planGames(totals.total, edition.betPrice);
  const pot = plan.sizes.map((size, index) => ({ index, size, cost: gameCost(size, edition.betPrice), numbers: [] }));
  const myEntries = participants.filter((p) => mine.includes(p.token));

  const bar =
    edition.status === "aberta" ? (
      <ButtonLink href="/entrar">
        Entrar no bolão <ArrowRight size={20} weight="bold" aria-hidden="true" />
      </ButtonLink>
    ) : edition.status === "apostada" ? (
      <ButtonLink href="/resultado">
        Ver ranking e jogos <ArrowRight size={20} weight="bold" aria-hidden="true" />
      </ButtonLink>
    ) : (
      <ButtonLink href="#" aria-disabled="true" className="pointer-events-none bg-paper-deep text-ink-soft">
        Inscrições encerradas
      </ButtonLink>
    );

  return (
    <Sheet bar={<ActionBar>{bar}</ActionBar>}>
      <InkTitle>{"BOLÃO DA MEGA\nDO AVÁ"}</InkTitle>
      <p className="semi mt-3 text-[18px] font-bold text-blue-deep">
        Mega da Virada · {dayMonth(edition.drawDate)} · edição {edition.year}
      </p>

      {myEntries.map((p) => (
        <Link
          key={p.token}
          href={`/p/${p.token}`}
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

      <section className="mt-8">
        <Label aside={brlShort(totals.total)}>O pote até agora</Label>
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
      </section>

      <section className="mt-8">
        <Label>Como funciona</Label>
        <ol className="mt-3 flex flex-col">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-baseline gap-4 border-t border-blue/40 py-3 first:border-t-0">
              <span className="display w-7 shrink-0 text-[34px] text-pink ink">{i + 1}</span>
              <span className="flex flex-col">
                <span className="condensed text-[20px] font-extrabold uppercase leading-tight text-ink">{s.title}</span>
                <span className="text-[16px] leading-snug text-ink-soft">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Strip className="mt-6 flex-col !items-start !gap-0.5">
        <span>Inscrições até {dayMonth(edition.deadline)}</span>
        <span className="font-medium text-ink">Os números de cada um ficam em segredo até as apostas serem feitas.</span>
      </Strip>

      <footer className="mt-10 flex items-center justify-between gap-4 text-[14px] text-ink-soft">
        <span className="semi font-semibold">Modo demo: dados fictícios</span>
        <Link href="/admin" className="semi font-bold text-blue-deep underline underline-offset-4">
          Área do Avá
        </Link>
      </footer>
    </Sheet>
  );
}
