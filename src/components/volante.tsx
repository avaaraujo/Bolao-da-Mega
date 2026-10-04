"use client";

import { useState } from "react";
import { heatLevel, NUMBERS } from "@/lib/rules";
import { pad2 } from "@/lib/format";
import { cx, nudge, Stamp } from "./riso";

const ALL = Array.from({ length: NUMBERS }, (_, i) => i + 1);

const rowHeight = "h-[clamp(44px,calc((100dvh-410px)/10),58px)] lg:h-[clamp(56px,calc((100dvh-190px)/10),84px)]";

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-6 gap-[2px] rounded-[3px] border-2 border-blue bg-blue">
      {children}
    </div>
  );
}

/**
 * Volante para marcar 6 números: cada toque carimba tinta rosa sobre o número azul.
 * `fresh` são os números carimbados nesta visita (só esses animam); `onToggle` devolve false quando o toque não vale.
 */
export function Volante({
  selected,
  fresh,
  onToggle,
  disabled,
}: {
  selected: number[];
  fresh?: ReadonlySet<number>;
  onToggle: (n: number) => boolean | void;
  disabled?: boolean;
}) {
  // Números recém-soltos continuam no papel o tempo da tinta recuar.
  const [leaving, setLeaving] = useState<number[]>([]);

  function press(n: number, cell: HTMLElement) {
    const wasOn = selected.includes(n);
    if (onToggle(n) === false) return nudge(cell);
    if (wasOn) {
      setLeaving((l) => [...l, n]);
      setTimeout(() => setLeaving((l) => l.filter((x) => x !== n)), 160);
    }
  }

  return (
    <Frame label="Volante de 1 a 60">
      {ALL.map((n) => {
        const on = selected.includes(n);
        const out = !on && leaving.includes(n);
        return (
          <button
            key={n}
            type="button"
            aria-pressed={on}
            aria-label={`Número ${n}`}
            disabled={disabled}
            onClick={(e) => press(n, e.currentTarget)}
            className={cx(
              "semi relative flex items-center justify-center bg-paper text-[clamp(22px,7.4cqi,40px)] font-bold text-blue-deep transition-colors",
              rowHeight,
              !on && !disabled && "hover:bg-paper-deep active:bg-yellow/40",
            )}
          >
            <span className="relative">{pad2(n)}</span>
            {(on || out) && <Stamp n={n} motion={out ? "out" : fresh?.has(n) ? "in" : undefined} className="h-[78%]" />}
          </button>
        );
      })}
    </Frame>
  );
}

/** Mapa de calor do ranking: 5 retículas fixas de tinta rosa. */
export function HeatGrid({ votes, highlight = [] }: { votes: Map<number, number>; highlight?: number[] }) {
  const max = Math.max(0, ...votes.values());
  return (
    <Frame label="Mapa de calor dos números votados">
      {ALL.map((n) => {
        const v = votes.get(n) ?? 0;
        const level = heatLevel(v, max);
        return (
          <div
            key={n}
            className={cx("relative flex flex-col items-center justify-center bg-paper", rowHeight)}
            aria-label={`Número ${n}: ${v} ${v === 1 ? "voto" : "votos"}`}
          >
            {level > 0 && <span aria-hidden="true" className={cx("ink absolute inset-0", `screen-${level}`)} />}
            <span
              className={cx(
                "semi relative -translate-y-[3px] rounded-[2px] bg-paper/85 px-1 text-[clamp(20px,6.6cqi,36px)] font-bold leading-none",
                "text-blue-deep",
                highlight.includes(n) && "underline decoration-[3px] underline-offset-[5px]",
              )}
            >
              {pad2(n)}
            </span>
            <span
              className={cx(
                "semi absolute right-[3px] bottom-[3px] rounded-[2px] px-[3px] text-[11px] font-bold leading-[14px]",
                v > 0 ? "bg-paper text-ink" : "border border-dashed border-blue text-blue-deep",
              )}
            >
              {v}
            </span>
          </div>
        );
      })}
    </Frame>
  );
}

export function HeatLegend() {
  return (
    <div className="semi flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
      <span>menos votos</span>
      {[1, 2, 3, 4, 5].map((l) => (
        <span key={l} aria-hidden="true" className={cx("ink h-4 w-6 rounded-[2px] border border-blue/40", `screen-${l}`)} />
      ))}
      <span>mais votos</span>
    </div>
  );
}
