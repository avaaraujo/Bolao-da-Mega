import { describe, expect, it } from "vitest";
import { approvedTotals, planGames, rankNumbers } from "../rules";
import { seedSnapshot } from "./seed";

describe("seedSnapshot", () => {
  it("reproduz o exemplo de 102 cotas aprovadas", () => {
    const { edition, participants } = seedSnapshot();
    const totals = approvedTotals(participants, edition.quotaPrice);
    expect(totals.quotas).toBe(102);
    expect(totals.total).toBe(6120);
    expect(planGames(totals.total, edition.betPrice).sizes).toEqual([12, 9, 7, 6, 6, 6, 6, 6]);
  });

  it("é determinístico e tem números válidos", () => {
    const a = seedSnapshot();
    const b = seedSnapshot();
    expect(a.participants.map((p) => p.numbers)).toEqual(b.participants.map((p) => p.numbers));
    for (const p of a.participants) {
      expect(new Set(p.numbers).size).toBe(p.numbers.length);
      expect(p.numbers.every((n) => n >= 1 && n <= 60)).toBe(true);
    }
    expect(rankNumbers(a.participants).length).toBeGreaterThan(30);
  });
});
