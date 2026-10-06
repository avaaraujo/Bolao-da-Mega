"use client";

import { AdminSheet } from "@/components/admin";
import { useBolao } from "@/components/bolao-provider";
import { Label } from "@/components/riso";
import { RankingList } from "@/components/ranking";
import { HeatGrid, HeatLegend } from "@/components/volante";
import { rankNumbers } from "@/lib/rules";

export default function Ranking() {
  const { snapshot } = useBolao();
  if (!snapshot) return null;
  const ranking = rankNumbers(snapshot.participants);
  const votes = new Map(ranking.map((r) => [r.number, r.votes]));
  const voters = snapshot.participants.filter((p) => p.payment === "aprovado" && p.numbers.length === 6).length;

  return (
    <AdminSheet
      title="RANKING"
      split="wide-left"
      side={
        <>
          <Label className="mt-8 lg:mt-0">Do mais ao menos votado</Label>
          <RankingList ranking={ranking} />
        </>
      }
    >
      <p className="mt-3 text-[16px] leading-snug text-ink-soft lg:mt-0">
        Votos de {voters} pessoas com Pix aprovado. Só você vê isto até as apostas serem registradas.
      </p>
      <div className="mt-4">
        <HeatGrid votes={votes} />
      </div>
      <div className="mt-3">
        <HeatLegend />
      </div>
    </AdminSheet>
  );
}
