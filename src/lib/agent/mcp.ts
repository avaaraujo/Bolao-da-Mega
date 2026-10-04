import { MAX_GAME, MIN_GAME, binomial, gameCost, planGames } from "../rules";
import { RULES, STEPS } from "./content";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "../site";

/**
 * Servidor MCP mínimo, sem estado, sobre Streamable HTTP (somente POST com resposta JSON).
 * Especificação: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
 */

export const SERVER_VERSION = "1.0.0";
export const LATEST_PROTOCOL_VERSION = "2025-06-18";
export const SUPPORTED_PROTOCOL_VERSIONS = [LATEST_PROTOCOL_VERSION, "2025-03-26", "2024-11-05"];

const QUOTA_PRICE = 60;
const BET_PRICE = 6;
const MAX_QUOTAS = 100_000;

export const INSTRUCTIONS =
  `${SITE_NAME}: ${SITE_DESCRIPTION} ` +
  "Use get_bolao_info para explicar as regras, calculate_game_plan para saber quais jogos um número de cotas rende " +
  "e calculate_game_cost para o preço de um jogo de n números. As ferramentas são públicas e somente leitura: " +
  "não registram inscrições, não confirmam pagamentos e não expõem dados de participantes.";

type Json = Record<string, unknown>;
type ToolResult = { text: string; structured: Json };
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Json;
  annotations: Json;
  run: (args: Json) => ToolResult;
};

class ToolInputError extends Error {}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

function intArg(args: Json, key: string, min: number, max: number): number | undefined {
  const v = args[key];
  if (v === undefined) return undefined;
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) {
    throw new ToolInputError(`"${key}" deve ser um inteiro entre ${min} e ${max}.`);
  }
  return v;
}

const brlText = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

const TOOLS: Tool[] = [
  {
    name: "get_bolao_info",
    title: "Regras e como participar do Bolão da Mega",
    description:
      "Devolve as regras do Bolão da Mega (cotas de R$ 60, 6 números por pessoa, ranking, montagem dos jogos), os passos para participar e os links públicos. Use para explicar como o bolão funciona.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { title: "Regras do Bolão da Mega", ...READ_ONLY },
    run: () => {
      const structured = {
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: absoluteUrl("/"),
        quotaPriceBRL: QUOTA_PRICE,
        simpleBetPriceBRL: BET_PRICE,
        numbersPerPerson: 6,
        numberRange: [1, 60],
        drawDate: "31/12 (Mega da Virada)",
        steps: STEPS.map((s) => `${s.title}: ${s.text}`),
        rules: RULES,
        joinUrl: absoluteUrl("/entrar"),
      };
      const text = [
        `${SITE_NAME}: ${SITE_DESCRIPTION}`,
        "",
        "Como funciona:",
        ...STEPS.map((s, i) => `${i + 1}. ${s.title}: ${s.text}`),
        "",
        "Regras:",
        ...RULES.map((r) => `- ${r}`),
        "",
        `Participar: ${structured.joinUrl}`,
      ].join("\n");
      return { text, structured };
    },
  },
  {
    name: "calculate_game_plan",
    title: "Calcular os jogos de um bolão",
    description:
      "Dado o número de cotas (R$ 60 cada) ou o total arrecadado em reais, calcula como o Bolão da Mega divide o dinheiro: o maior jogo que cabe, repetido até sobrar menos que uma aposta simples (R$ 6). Informe `quotas` ou `totalBRL`.",
    inputSchema: {
      type: "object",
      properties: {
        quotas: { type: "integer", minimum: 1, maximum: MAX_QUOTAS, description: "Número de cotas confirmadas (R$ 60 cada)." },
        totalBRL: { type: "integer", minimum: 6, maximum: MAX_QUOTAS * QUOTA_PRICE, description: "Total em reais, se preferir informá-lo direto." },
      },
      additionalProperties: false,
    },
    annotations: { title: "Calcular os jogos", ...READ_ONLY },
    run: (args) => {
      const quotas = intArg(args, "quotas", 1, MAX_QUOTAS);
      const totalArg = intArg(args, "totalBRL", BET_PRICE, MAX_QUOTAS * QUOTA_PRICE);
      if ((quotas === undefined) === (totalArg === undefined)) {
        throw new ToolInputError('Informe exatamente um entre "quotas" e "totalBRL".');
      }
      const total = quotas !== undefined ? quotas * QUOTA_PRICE : (totalArg as number);
      const { sizes, leftover } = planGames(total, BET_PRICE);
      const counts = new Map<number, number>();
      for (const s of sizes) counts.set(s, (counts.get(s) ?? 0) + 1);
      const games = [...counts.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([size, count]) => ({ numbers: size, count, costEachBRL: gameCost(size, BET_PRICE) }));
      const structured = { totalBRL: total, games, gamesCount: sizes.length, leftoverBRL: leftover, sizes };
      const lines = games.map((g) => `${g.count} × jogo de ${g.numbers} números (${brlText(g.costEachBRL)} cada)`);
      const text = `Total ${brlText(total)}: ${lines.join("; ")}. Sobra ${brlText(leftover)}.`;
      return { text, structured };
    },
  },
  {
    name: "calculate_game_cost",
    title: "Custo de um jogo",
    description:
      "Custo em reais de um jogo com n números (de 6 a 20): C(n,6) apostas simples de R$ 6 cada.",
    inputSchema: {
      type: "object",
      properties: { numbers: { type: "integer", minimum: MIN_GAME, maximum: MAX_GAME, description: "Quantidade de números marcados no jogo." } },
      required: ["numbers"],
      additionalProperties: false,
    },
    annotations: { title: "Custo de um jogo", ...READ_ONLY },
    run: (args) => {
      const n = intArg(args, "numbers", MIN_GAME, MAX_GAME);
      if (n === undefined) throw new ToolInputError('"numbers" é obrigatório.');
      const bets = binomial(n, 6);
      const cost = gameCost(n, BET_PRICE);
      return {
        text: `Um jogo de ${n} números equivale a ${bets.toLocaleString("pt-BR")} apostas simples e custa ${brlText(cost)}.`,
        structured: { numbers: n, simpleBets: bets, costBRL: cost },
      };
    },
  },
];

export function toolDefinitions() {
  return TOOLS.map((tool) => ({ name: tool.name, title: tool.title, description: tool.description, inputSchema: tool.inputSchema, annotations: tool.annotations }));
}

/** Documento de descoberta servido em GET /.well-known/mcp. */
export function serverCard() {
  return {
    name: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    version: SERVER_VERSION,
    protocolVersion: LATEST_PROTOCOL_VERSION,
    transport: { type: "streamable-http", url: absoluteUrl("/mcp") },
    endpoints: [absoluteUrl("/mcp"), absoluteUrl("/.well-known/mcp")],
    authentication: { required: false },
    capabilities: { tools: { listChanged: false } },
    tools: toolDefinitions().map((t) => ({ name: t.name, description: t.description })),
    instructions: INSTRUCTIONS,
    documentation: absoluteUrl("/developers"),
  };
}

// --- JSON-RPC 2.0 ---------------------------------------------------------------------------

export const ERR = { parse: -32700, invalidRequest: -32600, methodNotFound: -32601, invalidParams: -32602, internal: -32603 };

type RpcId = string | number | null;
type RpcReply = { jsonrpc: "2.0"; id: RpcId; result?: unknown; error?: { code: number; message: string; data?: unknown } };

const fail = (id: RpcId, code: number, message: string): RpcReply => ({ jsonrpc: "2.0", id, error: { code, message } });
const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

/** Trata uma mensagem. Devolve null para notificações e respostas do cliente (sem retorno). */
function handleMessage(msg: unknown): RpcReply | null {
  if (!isObject(msg) || msg.jsonrpc !== "2.0") return fail(null, ERR.invalidRequest, "Mensagem JSON-RPC 2.0 inválida.");

  const hasId = "id" in msg;
  if (typeof msg.method !== "string") {
    // Resposta do cliente a uma requisição do servidor (o servidor não faz nenhuma): ignora.
    if (hasId && ("result" in msg || "error" in msg)) return null;
    return fail(null, ERR.invalidRequest, "Mensagem sem método.");
  }
  if (!hasId) return null; // notificação (ex.: notifications/initialized)

  const id = msg.id as RpcId;
  if (typeof id !== "string" && typeof id !== "number") return fail(null, ERR.invalidRequest, "O id deve ser string ou número.");
  const params = msg.params === undefined ? {} : msg.params;
  if (!isObject(params)) return fail(id, ERR.invalidParams, "params deve ser um objeto.");

  switch (msg.method) {
    case "initialize": {
      const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : LATEST_PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "bolao-da-mega", title: SITE_NAME, version: SERVER_VERSION },
          instructions: INSTRUCTIONS,
        },
      };
    }
    case "ping":
      return { jsonrpc: "2.0", id, result: {} };
    case "tools/list":
      return { jsonrpc: "2.0", id, result: { tools: toolDefinitions() } };
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === params.name);
      if (!tool) return fail(id, ERR.invalidParams, `Ferramenta desconhecida: ${String(params.name)}.`);
      const args = params.arguments === undefined ? {} : params.arguments;
      if (!isObject(args)) return fail(id, ERR.invalidParams, "arguments deve ser um objeto.");
      try {
        const { text, structured } = tool.run(args);
        return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text }], structuredContent: structured, isError: false } };
      } catch (e) {
        if (e instanceof ToolInputError) {
          return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: e.message }], isError: true } };
        }
        return fail(id, ERR.internal, "Erro interno.");
      }
    }
    default:
      return fail(id, ERR.methodNotFound, `Método não suportado: ${msg.method}.`);
  }
}

export type McpResult = { status: number; body?: unknown };

/** Processa o corpo de um POST: uma mensagem ou um lote. */
export function handleMcpBody(raw: string): McpResult {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { status: 400, body: fail(null, ERR.parse, "JSON inválido.") };
  }
  if (Array.isArray(payload)) {
    if (payload.length === 0) return { status: 400, body: fail(null, ERR.invalidRequest, "Lote vazio.") };
    const replies = payload.map(handleMessage).filter((r): r is RpcReply => r !== null);
    return replies.length ? { status: 200, body: replies } : { status: 202 };
  }
  const reply = handleMessage(payload);
  if (reply === null) return { status: 202 };
  // Mensagem malformada (sem id válido) é erro de requisição; o restante é 200 com JSON-RPC.
  return { status: reply.error && reply.id === null ? 400 : 200, body: reply };
}
