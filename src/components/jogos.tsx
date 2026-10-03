"use client";

import type { Game } from "@/lib/types";
import { brlShort, pad2 } from "@/lib/format";
import { cx, Stamp } from "./riso";

const INKS = ["bg-blue", "bg-pink", "bg-yellow"];

/** Faixa de custo: cada jogo ocupa a fração exata do valor arrecadado. */
export function CostBar({ games, total }: { games: Game[]; total: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex h-9 w-full overflow-hidden rounded-[3px] border-2 border-blue bg-paper p-[2px]"
        role="img"
        aria-label={games.map((g) => `Jogo de ${g.size}: ${brlShort(g.cost)}`).join("; ")}
      >
        {/* Onde dois jogos grandes se encontram, a passada seguinte invade a anterior:
            a riso imprime ali a terceira cor. Jogos pequenos mantêm a própria faixa. */}
        {games.map((g, i) => {
          const wide = (x?: Game) => !!x && x.cost / total >= 0.04;
          const overprint = i > 0 && wide(g) && wide(games[i - 1]);
          return (
            <span
              key={g.index}
              className={cx(
                "ink h-full min-w-[4px] rounded-[1px]",
                INKS[g.index % INKS.length],
                i > 0 && (overprint ? "-ml-[7px] translate-y-[1.5px]" : "ml-[2px]"),
              )}
              style={{ flexGrow: g.cost, flexBasis: 0 }}
            />
          );
        })}
      </div>
      <div className="semi flex justify-between text-[13px] font-semibold text-ink-soft">
        <span>R$ 0</span>
        <span>{brlShort(total)}</span>
      </div>
    </div>
  );
}

export function GameList({ games, highlight = [] }: { games: Game[]; highlight?: number[] }) {
  return (
    <ol className="flex flex-col">
      {games.map((g) => (
        <li key={g.index} className="flex flex-col gap-2 border-t-2 border-blue py-3.5 first:border-t-0 first:pt-0">
          <div className="condensed flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-2 text-[19px] font-extrabold uppercase text-blue-deep">
              <span aria-hidden="true" className={cx("ink inline-block h-3.5 w-3.5 rounded-[2px]", INKS[g.index % INKS.length])} />
              Jogo {g.index + 1} · {g.size} números
            </span>
            <span className="text-[19px] font-extrabold tabular-nums text-ink">{brlShort(g.cost)}</span>
          </div>
          <p className="semi grid grid-cols-6 gap-y-1 text-[22px] font-bold leading-tight text-blue-deep">
            {g.numbers.map((n) => (
              <span key={n} className="relative justify-self-start px-0.5">
                {pad2(n)}
                {highlight.includes(n) && <Stamp n={n} className="h-[1.32em] -translate-x-px" />}
              </span>
            ))}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function gamesAsText(games: Game[], year: number) {
  const lines = games.map(
    (g) => `Jogo ${g.index + 1} (${g.size} números, ${brlShort(g.cost)}): ${g.numbers.map(pad2).join(" ")}`,
  );
  return [`Bolão da Mega do Avá ${year}`, ...lines].join("\n");
}
