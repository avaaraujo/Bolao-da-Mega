import type { Snapshot } from "./source";
import type { Participant, PaymentStatus } from "../types";

export const DEMO_CODE = "DEMO-2026";

// Dados fictícios para o modo demo. Nomes inventados.
const NAMES = [
  "Marina Lopes", "Caio Ferraz", "Bia Nogueira", "Duda Campos", "Rafa Teixeira", "Lu Barreto",
  "Thiago Sales", "Nina Prado", "Gabi Moura", "Pedro Antunes", "Juju Rezende", "Leo Quintas",
  "Carol Vidal", "Dani Pacheco", "Tati Simões", "Vini Castro", "Mari Duarte", "Bruno Lacerda",
  "Isa Fontes", "Fê Medeiros", "Guto Rangel", "Lari Peixoto", "Nando Aguiar", "Paulinha Reis",
  "Rô Bittencourt", "Sabrina Coelho", "Tom Valença", "Vivi Assis", "Zé Malta", "Aline Brito",
  "Beto Furtado", "Clara Junqueira", "Dudu Sampaio", "Elisa Matos", "Fábio Novaes", "Gi Toledo",
  "Hugo Paixão", "Iara Mendes", "Jonas Leal", "Kika Ribas", "Lucas Paiva", "Manu Serra",
  "Otávio Brandão", "Pri Cardoso",
];

// Cotas dos 40 aprovados somam 102 (o exemplo do Avá: R$ 6.120).
const APPROVED_QUOTAS = [
  5, 3, 2, 1, 4, 2, 3, 1, 2, 5, 2, 3, 1, 2, 4, 2, 1, 3, 2, 2,
  5, 1, 2, 3, 2, 4, 1, 2, 3, 2, 1, 2, 4, 3, 2, 3, 5, 2, 2, 3,
];

// Números "da sorte" aparecem com mais frequência, para o ranking ter forma.
const FAVORITES: Record<number, number> = { 10: 6, 7: 5, 13: 5, 23: 4, 4: 4, 42: 4, 33: 3, 17: 3, 53: 3, 5: 3, 31: 2, 44: 2, 1: 2, 60: 2 };

function prng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSix(rand: () => number): number[] {
  const weights = Array.from({ length: 60 }, (_, i) => FAVORITES[i + 1] ?? 1);
  const out: number[] = [];
  while (out.length < 6) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = rand() * total;
    for (let i = 0; i < 60; i++) {
      r -= weights[i];
      if (r <= 0) {
        out.push(i + 1);
        weights[i] = 0;
        break;
      }
    }
  }
  return out.sort((a, b) => a - b);
}

export function seedSnapshot(): Snapshot {
  const rand = prng(2026);
  const start = Date.parse("2026-12-01T09:00:00-03:00");
  const participants: Participant[] = NAMES.map((name, i) => {
    const createdAt = new Date(start + i * 3.7 * 3600_000).toISOString();
    const numbersAt = new Date(start + i * 3.7 * 3600_000 + 20 * 60_000).toISOString();
    let payment: PaymentStatus = "aprovado";
    if (i === 40 || i === 41) payment = "em_analise";
    if (i === 42) payment = "aguardando";
    if (i === 43) payment = "recusado";
    const quotas = i < 40 ? APPROVED_QUOTAS[i] : [2, 1, 3, 1][i - 40];
    const hasNumbers = payment !== "aguardando";
    return {
      id: `p${String(i + 1).padStart(3, "0")}`,
      token: `demo-${(i + 1).toString(36)}${Math.floor(rand() * 1e8).toString(36)}`,
      name,
      contact: "",
      quotas,
      numbers: hasNumbers ? pickSix(rand) : [],
      numbersAt: hasNumbers ? numbersAt : null,
      receipt:
        payment === "aguardando"
          ? null
          : { name: `comprovante-pix-${i + 1}.jpg`, type: "image/demo", dataUrl: null, uploadedAt: createdAt },
      payment,
      rejectReason: payment === "recusado" ? "O valor do Pix não bate com as cotas (R$ 50 para 1 cota)." : null,
      createdAt,
    };
  });

  return {
    edition: {
      id: "demo",
      code: DEMO_CODE,
      name: "Bolão da Firma (demo)",
      quotaPrice: 60,
      betPrice: 6,
      pixKey: "bolao.demo@exemplo.com",
      pixHolder: "Avá (demo)",
      deadline: "2026-12-29",
      drawDate: "2026-12-31",
      status: "aberta",
    },
    participants,
    games: null,
    isOwner: true,
  };
}
