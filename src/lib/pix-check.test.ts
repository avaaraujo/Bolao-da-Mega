import { describe, expect, it } from "vitest";
import { decide, namesMatch, parseBrasilia, type DecideInput, type PixExtraction } from "./pix-check";

const good: PixExtraction = {
  isPixReceipt: true,
  amountCents: 12000,
  paidAt: "2026-12-10T14:32",
  recipientName: "AVA A ARAUJO",
  recipientKey: "***.456.789-**",
  recipientInstitution: "Nubank",
  payerName: "Maria Souza",
  transactionId: "E1234567820261210143200000000001",
  recipientMatch: "sim",
  editingSigns: false,
  notes: "",
};

function input(over: Partial<PixExtraction> = {}, rest: Partial<DecideInput> = {}): DecideInput {
  return {
    extraction: { ...good, ...over },
    expectedCents: 12000,
    pixHolder: "Avá Araújo",
    joinedAt: "2026-12-10T17:25:00Z", // 14:25 em Brasília
    uploadedAt: "2026-12-10T17:35:00Z", // 14:35 em Brasília
    duplicateOf: null,
    ...rest,
  };
}

describe("namesMatch", () => {
  it("aceita abreviações e acentos", () => {
    expect(namesMatch("Avá Araújo", "AVA A ARAUJO")).toBe(true);
    expect(namesMatch("Avá Araújo", "Ava Araujo da Silva")).toBe(true);
    expect(namesMatch("Avá Araújo", "AVA")).toBe(true);
  });
  it("recusa outro nome", () => {
    expect(namesMatch("Avá Araújo", "Bruno Araujo")).toBe(false);
    expect(namesMatch("Avá Araújo", "Ava Pereira")).toBe(false);
  });
});

describe("parseBrasilia", () => {
  it("interpreta como UTC-3", () => {
    expect(parseBrasilia("2026-12-10T14:32")?.toISOString()).toBe("2026-12-10T17:32:00.000Z");
  });
  it("rejeita formatos estranhos", () => {
    expect(parseBrasilia("10/12/2026 14:32")).toBeNull();
    expect(parseBrasilia(null)).toBeNull();
  });
});

describe("decide", () => {
  it("aprova quando tudo bate", () => {
    expect(decide(input()).verdict).toBe("aprovado");
  });

  it("recusa valor a menos", () => {
    const d = decide(input({ amountCents: 6000 }));
    expect(d.verdict).toBe("recusado");
    expect(d.rejectReason).toMatch(/R\$\s?60,00/);
  });

  it("recusa conta errada", () => {
    const d = decide(input({ recipientName: "Bruno Lima", recipientMatch: "nao" }));
    expect(d.verdict).toBe("recusado");
  });

  it("recusa o que não é Pix", () => {
    expect(decide(input({ isPixReceipt: false })).verdict).toBe("recusado");
  });

  it("manda para conferência: valor a mais", () => {
    expect(decide(input({ amountCents: 24000 })).verdict).toBe("manual");
  });

  it("manda para conferência: print antigo", () => {
    expect(decide(input({ paidAt: "2026-11-20T09:00" })).verdict).toBe("manual");
  });

  it("manda para conferência: horário no futuro", () => {
    expect(decide(input({ paidAt: "2026-12-10T18:00" })).verdict).toBe("manual");
  });

  it("aceita Pix feito pouco antes da inscrição", () => {
    expect(decide(input({ paidAt: "2026-12-10T13:00" })).verdict).toBe("aprovado");
  });

  it("manda para conferência: comprovante repetido, mesmo com outro erro", () => {
    expect(decide(input({}, { duplicateOf: "João" })).verdict).toBe("manual");
    expect(decide(input({ amountCents: 100 }, { duplicateOf: "João" })).verdict).toBe("manual");
  });

  it("manda para conferência: sinais de edição, nome incerto ou ilegível", () => {
    expect(decide(input({ editingSigns: true })).verdict).toBe("manual");
    expect(decide(input({ recipientName: "Fulano", recipientMatch: "incerto" })).verdict).toBe("manual");
    expect(decide(input({ amountCents: null })).verdict).toBe("manual");
    expect(decide(input({ paidAt: null })).verdict).toBe("manual");
  });
});
