import { describe, expect, it } from "vitest";
import { checksSpent, MAX_CHECKS_PER_BOLAO } from "./pix-review";

describe("limite de conferências por bolão", () => {
  it("soma as leituras de todos os participantes", () => {
    expect(checksSpent([{ ai_checks_count: 2 }, { ai_checks_count: 0 }, { ai_checks_count: null }, { ai_checks_count: 5 }])).toBe(7);
    expect(checksSpent([])).toBe(0);
  });

  it("tem um teto padrão positivo", () => {
    expect(MAX_CHECKS_PER_BOLAO).toBeGreaterThan(0);
  });
});
