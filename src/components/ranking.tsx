"use client";

import { useState } from "react";
import type { RankEntry } from "@/lib/rules";
import { dateTime, pad2 } from "@/lib/format";
import { Button } from "./riso";

const STEP = 15;

/** Lista ranqueada: barra de tinta proporcional aos votos, desempate visível. */
export function RankingList({ ranking }: { ranking: RankEntry[] }) {
  const [shown, setShown] = useState(STEP);
  const max = ranking[0]?.votes ?? 1;
  if (ranking.length === 0) {
    return <p className="mt-3 text-[16px] text-ink-soft">Ninguém com Pix aprovado marcou números ainda.</p>;
  }
  return (
    <>
      <ol className="mt-2">
        {ranking.slice(0, shown).map((r, i) => {
          const tie = (ranking[i - 1]?.votes === r.votes) || (ranking[i + 1]?.votes === r.votes);
          return (
            <li key={r.number} className="flex items-center gap-3 border-t border-blue/40 py-2 first:border-t-0">
              <span className="semi w-8 shrink-0 text-right text-[15px] font-bold tabular-nums text-ink-soft">{i + 1}º</span>
              <span className="semi w-10 shrink-0 text-[24px] font-bold tabular-nums text-blue-deep">{pad2(r.number)}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="relative h-3.5 w-full">
                  <span className="ink absolute inset-y-0 left-0 rounded-[1px] bg-pink" style={{ width: `${(r.votes / max) * 100}%` }} />
                </span>
                {tie && <span className="text-[12px] leading-none text-ink-soft">1º voto {dateTime(r.firstVoteAt)}</span>}
              </span>
              <span className="semi w-[4.6rem] shrink-0 whitespace-nowrap text-right text-[16px] font-bold tabular-nums text-ink">
                {r.votes} {r.votes === 1 ? "voto" : "votos"}
              </span>
            </li>
          );
        })}
      </ol>
      {shown < ranking.length && (
        <Button variant="outline" className="mt-3" onClick={() => setShown((s) => s + STEP)}>
          Mostrar mais {Math.min(STEP, ranking.length - shown)}
        </Button>
      )}
    </>
  );
}
