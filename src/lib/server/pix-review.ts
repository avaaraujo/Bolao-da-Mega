import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { decide, type AiCheck, type AiCheckRecord, type PixExtraction } from "../pix-check";

/**
 * Conferência de comprovante Pix com o Claude. Roda só no servidor (Vercel), com a chave de
 * serviço do Supabase e a chave da API da Anthropic, e só para organizadores em `ai_reviewers`.
 */

export const MODEL = "claude-opus-5-5";
const BUCKET = "comprovantes";

export type ReviewResult =
  | { status: "done"; check: AiCheck; payment: string }
  | { status: "skipped"; reason: "not_configured" | "not_enabled" | "busy" | "not_pending" | "no_receipt" };

export class ReviewError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function reviewConfigured() {
  return !!(process.env.ANTHROPIC_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function service(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const Extraction = z.object({
  isPixReceipt: z.boolean().describe("true só se for comprovante de Pix CONCLUÍDO (não agendado, não boleto, não TED)"),
  amountCents: z.number().int().nullable().describe("valor transferido em centavos; R$ 120,00 = 12000"),
  paidAt: z.string().nullable().describe("data e hora do Pix como impressas, no formato AAAA-MM-DDTHH:mm (horário de Brasília)"),
  recipientName: z.string().nullable().describe("nome de quem RECEBEU, exatamente como impresso"),
  recipientKey: z.string().nullable().describe("chave Pix ou documento do destinatário, como impresso (pode estar mascarado)"),
  recipientInstitution: z.string().nullable().describe("banco ou instituição do destinatário"),
  payerName: z.string().nullable().describe("nome de quem PAGOU"),
  transactionId: z.string().nullable().describe("ID da transação / código E2E / autenticação, sem espaços"),
  recipientMatch: z.enum(["sim", "nao", "incerto"]).describe("o destinatário é o organizador esperado?"),
  editingSigns: z.boolean().describe("true se houver sinais de montagem ou edição na imagem"),
  notes: z.string().describe("observação curta em português sobre algo estranho; vazio se nada"),
});

const SYSTEM = `Você confere comprovantes de Pix de um bolão entre amigos. Sua tarefa é LER o comprovante e extrair os campos pedidos, sem decidir aprovação.

Regras de leitura:
- Distinga com cuidado quem pagou (origem) e quem recebeu (destino). Em comprovantes brasileiros o destino aparece como "Para", "Destino", "Recebedor" ou "Dados de quem recebeu".
- Valor em centavos, sem arredondar.
- Data e hora como aparecem no comprovante; converta para AAAA-MM-DDTHH:mm. Se não houver hora, use null em paidAt.
- recipientMatch: compare o destinatário com o organizador informado. Bancos abreviam nomes e mascaram CPF ("***.456.789-**"); isso não é divergência. Use "nao" só quando o nome ou a chave forem claramente de outra pessoa.
- editingSigns: fontes misturadas no mesmo bloco, números desalinhados, recortes, sobreposições, valores com tipografia diferente. Fotos tortas ou com reflexo NÃO são edição.
- Campo ilegível vira null. Não invente.`;

type Media = { kind: "image"; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" } | { kind: "pdf" };

function sniff(bytes: Uint8Array, declared: string): Media | null {
  const head = Array.from(bytes.slice(0, 12));
  const ascii = String.fromCharCode(...head);
  if (ascii.startsWith("%PDF")) return { kind: "pdf" };
  if (head[0] === 0xff && head[1] === 0xd8) return { kind: "image", mediaType: "image/jpeg" };
  if (head[0] === 0x89 && ascii.slice(1, 4) === "PNG") return { kind: "image", mediaType: "image/png" };
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return { kind: "image", mediaType: "image/webp" };
  if (ascii.startsWith("GIF8")) return { kind: "image", mediaType: "image/gif" };
  if (declared === "application/pdf") return { kind: "pdf" };
  return null;
}

async function extract(bytes: Uint8Array, media: Media, expected: { holder: string; key: string; cents: number }) {
  const client = new Anthropic();
  const data = Buffer.from(bytes).toString("base64");
  const file: Anthropic.ContentBlockParam =
    media.kind === "pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: media.mediaType, data } };

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: zodOutputFormat(Extraction) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          file,
          {
            type: "text",
            text: `Organizador esperado (destinatário): ${expected.holder || "(não cadastrado)"}\nChave Pix do organizador: ${expected.key || "(não cadastrada)"}\nValor esperado: ${(expected.cents / 100).toFixed(2)} reais`,
          },
        ],
      },
    ],
  });

  // Recusa do modelo ou resposta fora do formato: ninguém decide no escuro, vai para o organizador.
  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  return response.parsed_output satisfies PixExtraction;
}

async function sameTransaction(db: SupabaseClient, bolaoId: string, selfId: string, txid: string | null) {
  if (!txid || txid.length < 8) return null;
  const { data } = await db
    .from("participants")
    .select("name")
    .eq("bolao_id", bolaoId)
    .neq("id", selfId)
    .eq("ai_check->extracted->>transactionId", txid)
    .limit(1);
  return (data?.[0]?.name as string | undefined) ?? null;
}

type Target = { token: string } | { participantId: string; accessToken: string; force?: boolean };

/**
 * O participante só vê o veredito e uma frase. O checklist completo (com o nome de quem
 * já mandou o mesmo Pix, por exemplo) é só do organizador.
 */
function forParticipant(check: AiCheck, rejectReason: string | null): AiCheck {
  const summary =
    check.verdict === "aprovado"
      ? "Conferido na hora: conta, valor e horário batem."
      : check.verdict === "recusado"
        ? (rejectReason ?? "O comprovante não bateu com o Pix do bolão.")
        : "Recebido. O organizador vai dar uma olhada e confirmar.";
  return { ...check, summary, items: [], extracted: null };
}

export async function reviewReceipt(target: Target): Promise<ReviewResult> {
  const result = await review(target);
  if (result.status !== "done" || !("token" in target)) return result;
  const reason = result.check.verdict === "recusado" ? result.check.summary : null;
  return { ...result, check: forParticipant(result.check, reason) };
}

async function review(target: Target): Promise<ReviewResult> {
  if (!reviewConfigured()) return { status: "skipped", reason: "not_configured" };
  const db = service();

  const query = db.from("participants").select("*, bolaos!inner(id, owner_id, quota_price, pix_key, pix_holder)");
  const { data: row, error } =
    "token" in target
      ? await query.eq("token", target.token).maybeSingle()
      : await query.eq("id", target.participantId).maybeSingle();
  if (error) throw new ReviewError(error.message, 500);
  if (!row) throw new ReviewError("Participante não encontrado.", 404);
  const bolao = row.bolaos as { id: string; owner_id: string; quota_price: number; pix_key: string; pix_holder: string };

  // Pedido do organizador: o token de sessão tem que ser do dono desta sala.
  const force = "participantId" in target && !!target.force;
  if ("accessToken" in target) {
    const { data: auth } = await db.auth.getUser(target.accessToken);
    if (auth.user?.id !== bolao.owner_id) throw new ReviewError("Sem permissão para este bolão.", 403);
  }

  const { data: reviewer } = await db.from("ai_reviewers").select("user_id").eq("user_id", bolao.owner_id).maybeSingle();
  if (!reviewer) return { status: "skipped", reason: "not_enabled" };

  const path = row.receipt_path as string | null;
  if (!path) return { status: "skipped", reason: "no_receipt" };
  if (row.payment !== "em_analise" && !force) return { status: "skipped", reason: "not_pending" };

  const { data: claimed, error: claimErr } = await db.rpc("claim_ai_check", { p_id: row.id, p_path: path, p_force: force });
  if (claimErr) throw new ReviewError(claimErr.message, 500);
  if (!claimed) {
    const current = row.ai_check as AiCheckRecord | null;
    if (current?.state === "done" && current.path === path) return { status: "done", check: current, payment: row.payment };
    return { status: "skipped", reason: "busy" };
  }

  const expectedCents = Number(row.quotas) * Number(bolao.quota_price) * 100;
  let check: AiCheck;
  try {
    const file = await db.storage.from(BUCKET).download(path);
    if (file.error) throw file.error;
    const bytes = new Uint8Array(await file.data.arrayBuffer());
    const media = sniff(bytes, String(row.receipt_type ?? ""));
    const extraction = media ? await extract(bytes, media, { holder: bolao.pix_holder, key: bolao.pix_key, cents: expectedCents }) : null;

    if (!extraction) {
      check = {
        state: "done",
        path,
        verdict: "manual",
        summary: media ? "A IA não conseguiu ler este comprovante." : "Formato de arquivo que a IA não lê.",
        items: [],
        extracted: null,
        checkedAt: new Date().toISOString(),
        model: MODEL,
      };
    } else {
      const decision = decide({
        extraction,
        expectedCents,
        pixHolder: bolao.pix_holder,
        joinedAt: String(row.created_at),
        uploadedAt: String(row.receipt_uploaded_at ?? new Date().toISOString()),
        duplicateOf: await sameTransaction(db, bolao.id, row.id, extraction.transactionId),
      });
      check = {
        state: "done",
        path,
        verdict: decision.verdict,
        summary: decision.summary,
        items: decision.items,
        extracted: extraction,
        checkedAt: new Date().toISOString(),
        model: MODEL,
      };
      // Decisão automática só se ninguém mexeu no pagamento enquanto a IA lia.
      if (decision.verdict !== "manual") {
        await db
          .from("participants")
          .update({ payment: decision.verdict, reject_reason: decision.rejectReason })
          .eq("id", row.id)
          .eq("receipt_path", path)
          .eq("payment", "em_analise");
      }
    }
  } catch (err) {
    // Libera a reserva para dar para tentar de novo.
    await db.from("participants").update({ ai_check: null }).eq("id", row.id).eq("receipt_path", path);
    throw err;
  }

  await db.from("participants").update({ ai_check: check }).eq("id", row.id).eq("receipt_path", path);
  const { data: after } = await db.from("participants").select("payment").eq("id", row.id).maybeSingle();
  return { status: "done", check, payment: String(after?.payment ?? row.payment) };
}
