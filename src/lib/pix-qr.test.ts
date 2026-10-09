import { describe, expect, it } from "vitest";
import { crc16, normalizePixKey, pixPayload } from "./pix-qr";

describe("pix-qr", () => {
  it("calcula o CRC16/CCITT-FALSE (vetor padrão)", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("monta o copia e cola com chave, valor e CRC válido", () => {
    const p = pixPayload({ key: "Ava@Exemplo.com", holder: "Avá Araújo", amount: 180 });
    expect(p.startsWith("000201010211")).toBe(true);
    expect(p).toContain("0014br.gov.bcb.pix0115ava@exemplo.com");
    expect(p).toContain("5406180.00");
    expect(p).toContain("5910AVA ARAUJO");
    expect(p).toContain("5303986");
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)));
  });

  it("normaliza os tipos de chave", () => {
    expect(normalizePixKey(" 123.456.789-09 ")).toBe("12345678909");
    expect(normalizePixKey("12.345.678/0001-95")).toBe("12345678000195");
    expect(normalizePixKey("(11) 99999-8888")).toBe("+5511999998888");
    expect(normalizePixKey("+55 11 99999-8888")).toBe("+5511999998888");
    expect(normalizePixKey("123E4567-E12B-12D1-A456-426655440000")).toBe("123e4567-e12b-12d1-a456-426655440000");
  });
});
