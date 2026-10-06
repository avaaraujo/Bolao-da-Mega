import Anthropic from "@anthropic-ai/sdk";
import { reviewReceipt, ReviewError } from "@/lib/server/pix-review";

// Leitura do comprovante pelo Claude pode levar alguns segundos.
export const maxDuration = 60;

/**
 * POST { token }                       — o participante, logo depois de mandar o comprovante.
 * POST { participantId, force? } + Bearer — o organizador, da tela de Pagamentos.
 */
export async function POST(request: Request) {
  let body: { token?: unknown; participantId?: unknown; force?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  try {
    if (typeof body.participantId === "string" && bearer) {
      return Response.json(await reviewReceipt({ participantId: body.participantId, accessToken: bearer, force: body.force === true }));
    }
    if (typeof body.token === "string" && /^[0-9a-f]{24}$/.test(body.token)) {
      return Response.json(await reviewReceipt({ token: body.token }));
    }
    return Response.json({ error: "Informe o participante." }, { status: 400 });
  } catch (err) {
    if (err instanceof ReviewError) return Response.json({ error: err.message }, { status: err.status });
    if (err instanceof Anthropic.RateLimitError) return Response.json({ error: "A IA está ocupada. Tente em um minuto." }, { status: 429 });
    if (err instanceof Anthropic.AuthenticationError) return Response.json({ error: "Chave da API do Claude inválida." }, { status: 503 });
    if (err instanceof Anthropic.APIError) return Response.json({ error: `A IA falhou (${err.status}).` }, { status: 502 });
    console.error("conferir comprovante", err);
    return Response.json({ error: "Não deu para conferir agora." }, { status: 500 });
  }
}
