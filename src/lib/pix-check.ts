/**
 * Conferência automática de comprovantes Pix.
 * O Claude só LÊ o comprovante (extração); quem decide são as regras abaixo, que são
 * determinísticas e testadas. Na dúvida, a decisão é sempre "manual" (o organizador confere).
 */

export type PixExtraction = {
  /** A imagem é mesmo um comprovante de transferência Pix concluída. */
  isPixReceipt: boolean;
  amountCents: number | null;
  /** Data e hora impressas no comprovante, no horário de Brasília: "AAAA-MM-DDTHH:mm". */
  paidAt: string | null;
  recipientName: string | null;
  recipientKey: string | null;
  recipientInstitution: string | null;
  payerName: string | null;
  transactionId: string | null;
  /** Leitura do próprio modelo: o destinatário bate com o organizador esperado? */
  recipientMatch: "sim" | "nao" | "incerto";
  /** Sinais de montagem/edição (fontes diferentes, números desalinhados, recortes). */
  editingSigns: boolean;
  notes: string;
};

export type CheckStatus = "ok" | "alerta" | "erro";
export type CheckItemId = "pix" | "destinatario" | "valor" | "data" | "duplicado" | "integridade";
export type CheckItem = { id: CheckItemId; status: CheckStatus; label: string; detail: string };
export type AiVerdict = "aprovado" | "recusado" | "manual";

export type AiCheck = {
  state: "done";
  path: string;
  verdict: AiVerdict;
  summary: string;
  items: CheckItem[];
  extracted: PixExtraction | null;
  checkedAt: string;
  model: string;
};

/** O que fica salvo em `participants.ai_check`. */
export type AiCheckRecord = AiCheck | { state: "running"; path: string; startedAt: string };

export type DecideInput = {
  extraction: PixExtraction;
  expectedCents: number;
  pixHolder: string;
  joinedAt: string; // ISO
  uploadedAt: string; // ISO
  /** Nome de outro participante que já mandou um Pix com o mesmo ID de transação. */
  duplicateOf: string | null;
};

export type Decision = { verdict: AiVerdict; summary: string; items: CheckItem[]; rejectReason: string | null };

/** Tolerâncias de horário: Pix feito até 2 h antes da inscrição e no máximo 48 h antes do envio do print. */
const BEFORE_JOIN_MS = 2 * 3600_000;
const MAX_AGE_MS = 48 * 3600_000;
const CLOCK_SKEW_MS = 15 * 60_000;

const STOP = new Set(["de", "da", "do", "das", "dos", "e"]);

function tokens(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
}

/**
 * Compara o titular cadastrado com o nome impresso no comprovante.
 * Bancos costumam abreviar ("AVA A ARAUJO") ou cortar o sobrenome, então exigimos o primeiro
 * nome igual e, havendo sobrenomes dos dois lados, pelo menos um em comum (ou a inicial dele).
 */
export function namesMatch(holder: string, printed: string): boolean {
  const h = tokens(holder);
  const p = tokens(printed);
  if (!h.length || !p.length || h[0] !== p[0]) return false;
  if (h.length === 1 || p.length === 1) return true;
  return h.slice(1).some((t) => p.slice(1).some((r) => r === t || (r.length === 1 && t.startsWith(r))));
}

/** "AAAA-MM-DDTHH:mm" no horário de Brasília (UTC-3, sem horário de verão desde 2019). */
export function parseBrasilia(local: string | null): Date | null {
  if (!local || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(local)) return null;
  const d = new Date(`${local.length === 16 ? `${local}:00` : local}-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const money = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const when = (d: Date) =>
  d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function decide(input: DecideInput): Decision {
  const { extraction: x, expectedCents, pixHolder, duplicateOf } = input;
  const items: CheckItem[] = [];

  items.push(
    x.isPixReceipt
      ? { id: "pix", status: "ok", label: "É um Pix", detail: x.recipientInstitution ? `Comprovante de ${x.recipientInstitution}` : "Comprovante de Pix concluído" }
      : { id: "pix", status: "erro", label: "Não é um Pix", detail: "A imagem não parece um comprovante de Pix concluído." },
  );

  // Destinatário: o nome tem que bater com o titular cadastrado no bolão.
  const printed = x.recipientName?.trim() ?? "";
  if (!pixHolder.trim()) {
    items.push({ id: "destinatario", status: "alerta", label: "Destinatário", detail: "O bolão não tem titular do Pix cadastrado para comparar." });
  } else if (!printed) {
    items.push({ id: "destinatario", status: "alerta", label: "Destinatário", detail: "Não deu para ler o nome de quem recebeu." });
  } else if (namesMatch(pixHolder, printed) || x.recipientMatch === "sim") {
    items.push({ id: "destinatario", status: "ok", label: "Destinatário", detail: `Foi para ${printed}` });
  } else if (x.recipientMatch === "nao") {
    items.push({ id: "destinatario", status: "erro", label: "Destinatário", detail: `Foi para ${printed}, não para ${pixHolder}.` });
  } else {
    items.push({ id: "destinatario", status: "alerta", label: "Destinatário", detail: `Nome no comprovante: ${printed}. Confira se é a sua conta.` });
  }

  // Valor: exatamente o total das cotas. A menos recusa; a mais vai para conferência.
  if (x.amountCents === null) {
    items.push({ id: "valor", status: "alerta", label: "Valor", detail: "Não deu para ler o valor." });
  } else if (x.amountCents === expectedCents) {
    items.push({ id: "valor", status: "ok", label: "Valor", detail: `${money(x.amountCents)}, como esperado` });
  } else if (x.amountCents < expectedCents) {
    items.push({ id: "valor", status: "erro", label: "Valor", detail: `Pagou ${money(x.amountCents)}; as cotas somam ${money(expectedCents)}.` });
  } else {
    items.push({ id: "valor", status: "alerta", label: "Valor", detail: `Pagou ${money(x.amountCents)}, mais que ${money(expectedCents)}. Pode ser Pix de mais de uma pessoa.` });
  }

  // Data e hora: perto da inscrição e do envio. Print antigo é o golpe mais comum.
  const paid = parseBrasilia(x.paidAt);
  const joined = new Date(input.joinedAt).getTime();
  const uploaded = new Date(input.uploadedAt).getTime();
  if (!paid) {
    items.push({ id: "data", status: "alerta", label: "Data e hora", detail: "Não deu para ler a data do Pix." });
  } else if (paid.getTime() > uploaded + CLOCK_SKEW_MS) {
    items.push({ id: "data", status: "alerta", label: "Data e hora", detail: `Pix com horário no futuro (${when(paid)}).` });
  } else if (paid.getTime() < joined - BEFORE_JOIN_MS || uploaded - paid.getTime() > MAX_AGE_MS) {
    items.push({ id: "data", status: "alerta", label: "Data e hora", detail: `Pix de ${when(paid)}, bem antes da inscrição. Pode ser um print antigo.` });
  } else {
    items.push({ id: "data", status: "ok", label: "Data e hora", detail: `Pix de ${when(paid)}` });
  }

  items.push(
    duplicateOf
      ? { id: "duplicado", status: "erro", label: "Comprovante repetido", detail: `O mesmo Pix já foi enviado por ${duplicateOf}.` }
      : { id: "duplicado", status: "ok", label: "Comprovante único", detail: x.transactionId ? "ID da transação não se repete" : "Sem ID de transação para comparar" },
  );

  items.push(
    x.editingSigns
      ? { id: "integridade", status: "alerta", label: "Sinais de edição", detail: x.notes || "A imagem parece montada ou editada." }
      : { id: "integridade", status: "ok", label: "Sem sinais de edição", detail: "Nada estranho na imagem" },
  );

  // Recusa automática só para o que é objetivo (não é Pix, conta errada, valor a menos).
  // Suspeitas (repetido, antigo, editado, ilegível) sempre vão para o organizador.
  const hard = items.filter((i) => i.status === "erro" && (i.id === "pix" || i.id === "destinatario" || i.id === "valor"));
  const soft = items.filter((i) => i.status !== "ok" && !hard.includes(i));
  if (hard.length && !soft.some((i) => i.id === "duplicado")) {
    return {
      verdict: "recusado",
      summary: hard.map((i) => i.detail).join(" "),
      items,
      rejectReason: hard.map((i) => i.detail).join(" "),
    };
  }
  if (hard.length || soft.length) {
    const first = [...hard, ...soft][0];
    return { verdict: "manual", summary: `Precisa do seu olho: ${first.detail}`, items, rejectReason: null };
  }
  return { verdict: "aprovado", summary: "Tudo bate: conta, valor, horário.", items, rejectReason: null };
}
