import { describe, expect, it } from "vitest";
import { isLate, reminderText, reminderUrl, whatsappNumber } from "./cobranca";
import type { Participant } from "./types";

const base: Participant = {
  id: "1",
  token: "t",
  name: "Otávio Brandão",
  contact: "(11) 99999-8888",
  quotas: 3,
  numbers: [],
  numbersAt: null,
  receipt: null,
  payment: "aguardando",
  rejectReason: null,
  createdAt: "2026-12-01T10:00:00Z",
};

describe("cobranca", () => {
  it("reconhece telefones e ignora e-mails", () => {
    expect(whatsappNumber("(11) 99999-8888")).toBe("5511999998888");
    expect(whatsappNumber("+55 11 99999-8888")).toBe("5511999998888");
    expect(whatsappNumber("ava@exemplo.com")).toBeNull();
    expect(whatsappNumber("@ava")).toBeNull();
    expect(whatsappNumber("")).toBeNull();
  });

  it("só atrasa quem está sem Pix há mais de 2 dias", () => {
    const now = new Date("2026-12-04T10:00:00Z").getTime();
    expect(isLate(base, now)).toBe(true);
    expect(isLate(base, new Date("2026-12-02T10:00:00Z").getTime())).toBe(false);
    expect(isLate({ ...base, payment: "em_analise" }, now)).toBe(false);
  });

  it("monta a mensagem e o link do WhatsApp", () => {
    const text = reminderText(base, 60, "Bolão da Firma", "https://x.app/b/A/p/t/pagamento");
    expect(text).toContain("Oi, Otávio!");
    expect(text).toContain("R$ 180");
    expect(reminderUrl(base, text)).toMatch(/^https:\/\/wa\.me\/5511999998888\?text=/);
    expect(reminderUrl({ ...base, contact: "ava@exemplo.com" }, text)).toBeNull();
  });
});
