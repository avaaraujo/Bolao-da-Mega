import type { EditionStatus } from "./types";

export const STATUS_LABEL: Record<EditionStatus, string> = {
  rascunho: "Rascunho",
  aberta: "Inscrições abertas",
  fechada: "Inscrições fechadas",
  apostada: "Apostas registradas",
};

/** [12, 9, 7, 6, 6, 6] → "1 jogo de 12 + 1 jogo de 9 + 1 jogo de 7 + 3 jogos de 6" */
export function summarizeSizes(sizes: number[]) {
  const groups: { size: number; n: number }[] = [];
  for (const s of sizes) {
    const last = groups[groups.length - 1];
    if (last && last.size === s) last.n++;
    else groups.push({ size: s, n: 1 });
  }
  return groups.map((g) => `${g.n} ${g.n > 1 ? "jogos" : "jogo"} de ${g.size}`).join(" + ");
}
