import { describe, expect, it } from "vitest";
import { buildGames, gameCost, planGames, rankNumbers } from "./rules";
import type { Participant } from "./types";

function voter(id: string, numbers: number[], at: string, payment: Participant["payment"] = "aprovado"): Participant {
  return {
    id,
    token: id,
    name: id,
    contact: "",
    quotas: 1,
    numbers,
    numbersAt: at,
    receipt: null,
    payment,
    rejectReason: null,
    createdAt: at,
  };
}

describe("gameCost", () => {
  it("segue a tabela da Mega a R$ 6", () => {
    expect(gameCost(6, 6)).toBe(6);
    expect(gameCost(7, 6)).toBe(42);
    expect(gameCost(9, 6)).toBe(504);
    expect(gameCost(12, 6)).toBe(5544);
    expect(gameCost(20, 6)).toBe(232560);
  });
});

describe("planGames", () => {
  it("reproduz o exemplo de 102 cotas", () => {
    const { sizes, leftover } = planGames(102 * 60, 6);
    expect(sizes).toEqual([12, 9, 7, 6, 6, 6, 6, 6]);
    expect(leftover).toBe(0);
  });

  it("sempre zera com cotas de R$ 60", () => {
    for (let q = 1; q <= 400; q++) expect(planGames(q * 60, 6).leftover).toBe(0);
  });

  it("uma cota vira um jogo de 7 e três de 6", () => {
    expect(planGames(60, 6).sizes).toEqual([7, 6, 6, 6]);
  });
});

describe("rankNumbers", () => {
  it("ordena por votos e desempata pelo primeiro voto", () => {
    const ranking = rankNumbers([
      voter("a", [1, 2, 3, 4, 5, 6], "2026-12-01T10:00:00Z"),
      voter("b", [7, 8, 9, 10, 11, 6], "2026-12-01T09:00:00Z"),
      voter("c", [12, 13, 14, 15, 16, 1], "2026-12-02T09:00:00Z"),
    ]);
    // 6 (2 votos, primeiro às 09h) vem antes de 1 (2 votos, primeiro às 10h)
    expect(ranking.slice(0, 2).map((r) => r.number)).toEqual([6, 1]);
    // empate em 1 voto: os de "b" (09h) antes dos de "a" (10h)
    expect(ranking[2].number).toBe(7);
  });

  it("ignora quem não teve o pagamento aprovado", () => {
    const ranking = rankNumbers([
      voter("a", [1, 2, 3, 4, 5, 6], "2026-12-01T10:00:00Z", "aguardando"),
      voter("b", [7, 8, 9, 10, 11, 12], "2026-12-01T10:00:00Z", "recusado"),
    ]);
    expect(ranking).toEqual([]);
  });
});

describe("buildGames", () => {
  it("consome o ranking em sequência sem repetir", () => {
    const ranking = Array.from({ length: 60 }, (_, i) => 60 - i);
    const games = buildGames(ranking, [12, 9], 6);
    expect(games[0].numbers).toEqual([49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60]);
    expect(games[1].numbers).toEqual([40, 41, 42, 43, 44, 45, 46, 47, 48]);
  });

  it("volta ao começo quando o ranking acaba", () => {
    const games = buildGames([10, 20, 30, 40, 50, 60, 1, 2], [6, 6], 6);
    expect(games[0].numbers).toEqual([10, 20, 30, 40, 50, 60]);
    expect(games[1].numbers).toEqual([1, 2, 10, 20, 30, 40]);
  });

  it("completa com não votados quando o ranking é curto demais", () => {
    const games = buildGames([5, 9, 33], [6], 6);
    expect(games[0].numbers).toEqual([1, 2, 3, 5, 9, 33]);
  });
});
