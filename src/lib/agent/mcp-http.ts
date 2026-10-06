import { ERR, SUPPORTED_PROTOCOL_VERSIONS, handleMcpBody, serverCard } from "./mcp";

const MAX_BODY = 100_000;

// Servidor público, somente leitura e sem cookies nem credenciais: qualquer origem pode chamar.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};
const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status: number, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...CORS, ...NO_STORE, ...extra } });
}

export function mcpOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function mcpPost(request: Request) {
  const version = request.headers.get("mcp-protocol-version");
  if (version && !SUPPORTED_PROTOCOL_VERSIONS.includes(version)) {
    return json(
      { jsonrpc: "2.0", id: null, error: { code: ERR.invalidRequest, message: `Versão do protocolo não suportada: ${version}.` } },
      400,
    );
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY) {
    return json({ jsonrpc: "2.0", id: null, error: { code: ERR.invalidRequest, message: "Corpo grande demais." } }, 413);
  }
  const { status, body } = handleMcpBody(raw);
  if (body === undefined) return new Response(null, { status, headers: { ...CORS, ...NO_STORE } });
  return json(body, status);
}

/** GET/DELETE em /mcp: sem fluxo SSE nem sessões, o transporte manda 405. */
export function mcpMethodNotAllowed() {
  return new Response(null, { status: 405, headers: { ...CORS, ...NO_STORE, Allow: "POST, OPTIONS" } });
}

/** GET em /.well-known/mcp: documento de descoberta do servidor. */
export function mcpDiscovery() {
  return json(serverCard(), 200, { "Cache-Control": "public, max-age=3600" });
}
