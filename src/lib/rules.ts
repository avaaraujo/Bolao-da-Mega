import type { Game, Participant } from "./types";

export const MIN_GAME = 6;
export const MAX_GAME = 20;
export const PICK = 6;
export const NUMBERS = 60;

export function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/** Custo de um jogo com n números: C(n,6) apostas simples. */
export function gameCost(size: number, betPrice: number): number {
  return binomial(size, PICK) * betPrice;
}

/**
 * Método do maior jogo primeiro: com o valor restante, faz o maior jogo que cabe,
 * e repete até não sobrar dinheiro para nem uma aposta simples.
 */
export function planGames(total: number, betPrice: number): { sizes: number[]; leftover: number } {
  const sizes: number[] = [];
  let remaining = total;
  while (remaining >= betPrice) {
    let size = MIN_GAME;
    for (let n = MAX_GAME; n >= MIN_GAME; n--) {
      if (gameCost(n, betPrice) <= remaining) {
        size = n;
        break;
      }
    }
    sizes.push(size);
    remaining -= gameCost(size, betPrice);
  }
  return { sizes, leftover: remaining };
}

export type RankEntry = {
  number: number;
  votes: number;
  firstVoteAt: string;
};

/**
 * Ranking dos números votados por quem teve o pagamento aprovado.
 * Desempate: fica na frente o número cujo primeiro voto chegou antes.
 */
export function rankNumbers(participants: Participant[]): RankEntry[] {
  const map = new Map<number, RankEntry>();
  for (const p of participants) {
    if (p.payment !== "aprovado" || !p.numbersAt || p.numbers.length !== PICK) continue;
    for (const n of p.numbers) {
      const entry = map.get(n);
      if (!entry) map.set(n, { number: n, votes: 1, firstVoteAt: p.numbersAt });
      else {
        entry.votes += 1;
        if (p.numbersAt < entry.firstVoteAt) entry.firstVoteAt = p.numbersAt;
      }
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      b.votes - a.votes ||
      a.firstVoteAt.localeCompare(b.firstVoteAt) ||
      a.number - b.number,
  );
}

/**
 * Monta os jogos consumindo o ranking em sequência, sem repetir;
 * quando o ranking acaba, volta ao começo. Se o ranking tiver menos números
 * do que um jogo precisa, completa com os não votados em ordem crescente.
 */
export function buildGames(ranking: number[], sizes: number[], betPrice: number): Game[] {
  let cursor = 0;
  return sizes.map((size, index) => {
    const picked: number[] = [];
    const pool = ranking.length > 0 ? ranking : [];
    const take = Math.min(size, pool.length);
    for (let i = 0; i < take; i++) {
      picked.push(pool[cursor % pool.length]);
      cursor++;
    }
    for (let n = 1; picked.length < size && n <= NUMBERS; n++) {
      if (!picked.includes(n)) picked.push(n);
    }
    return { index, size, cost: gameCost(size, betPrice), numbers: picked.sort((a, b) => a - b) };
  });
}

export function approvedTotals(participants: Participant[], quotaPrice: number) {
  const approved = participants.filter((p) => p.payment === "aprovado");
  const quotas = approved.reduce((s, p) => s + p.quotas, 0);
  return { people: approved.length, quotas, total: quotas * quotaPrice };
}

/** Cinco níveis fixos de retícula para o mapa de calor (0 = sem voto). */
export function heatLevel(votes: number, maxVotes: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (votes <= 0 || maxVotes <= 0) return 0;
  const ratio = votes / maxVotes;
  if (ratio > 0.8) return 5;
  if (ratio > 0.6) return 4;
  if (ratio > 0.4) return 3;
  if (ratio > 0.2) return 2;
  return 1;
}
