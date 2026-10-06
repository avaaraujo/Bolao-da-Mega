"use client";

import { useBolao, useMyTokens } from "@/components/bolao-provider";
import { CostBar, GameList } from "@/components/jogos";
import { RankingList } from "@/components/ranking";
import { BackLink, ButtonLink, InkTitle, Label, Loading, Sheet, Strip, Dot } from "@/components/riso";
import { HeatGrid, HeatLegend } from "@/components/volante";
import { approvedTotals, rankNumbers } from "@/lib/rules";
import { brlShort, dayMonth, plural } from "@/lib/format";

export default function Resultado() {
  const { snapshot, base } = useBolao();
  const mine = useMyTokens();
  if (!snapshot) return <Loading />;

  const { edition, participants, games } = snapshot;

  if (edition.status !== "apostada" || !games) {
    return (
      <Sheet>
        <BackLink href={base}>Início</BackLink>
        <InkTitle size="lg" className="mt-3">
          AINDA EM SEGREDO
        </InkTitle>
        <p className="mt-5 text-[18px] leading-snug text-ink">
          O ranking dos números e os jogos aparecem aqui assim que o organizador registrar as apostas na Caixa.
        </p>
        <ButtonLink href={base} variant="outline" className="mt-8 self-start">
          Voltar ao início
        </ButtonLink>
      </Sheet>
    );
  }

  const totals = approvedTotals(participants, edition.quotaPrice);
  const ranking = rankNumbers(participants);
  const votes = new Map(ranking.map((r) => [r.number, r.votes]));
  const myNumbers = participants.filter((p) => mine.includes(p.token)).flatMap((p) => p.numbers);

  return (
    <Sheet
      side={
        <>
          <section className="lg:mt-0">
            <GameList games={games} highlight={myNumbers} />
          </section>

          <section className="mt-9">
            <Label>Mapa dos votos</Label>
            <div className="mt-3">
              <HeatGrid votes={votes} highlight={myNumbers} />
            </div>
            <div className="mt-3">
              <HeatLegend />
            </div>
          </section>

          <section className="mt-9">
            <Label>Ranking</Label>
            <RankingList ranking={ranking} />
          </section>
        </>
      }
    >
      <BackLink href={base}>Início</BackLink>
      <InkTitle stack className="mt-1">
        {"BOLÃO\nDA MEGA"}
      </InkTitle>
      <Strip className="mt-3 lg:mt-auto">
        Apostas feitas <Dot /> {brlShort(totals.total)} <Dot /> {plural(totals.people, "pessoa", "pessoas")} <Dot /> sorteio{" "}
        {dayMonth(edition.drawDate)}
      </Strip>

      <section className="mt-7">
        <Label aside={plural(games.length, "jogo", "jogos")}>Os jogos do grupo</Label>
        {myNumbers.length > 0 && <p className="mt-1.5 text-[15px] text-ink-soft">Seus números aparecem carimbados de rosa.</p>}
        <div className="mt-3 mb-5">
          <CostBar games={games} total={totals.total} />
        </div>
      </section>
    </Sheet>
  );
}
