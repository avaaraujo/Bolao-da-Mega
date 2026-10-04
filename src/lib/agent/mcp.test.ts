import { describe, expect, it } from "vitest";
import { LATEST_PROTOCOL_VERSION, handleMcpBody, serverCard } from "./mcp";
import { mcpDiscovery, mcpMethodNotAllowed, mcpOptions, mcpPost } from "./mcp-http";

const call = (msg: unknown) => handleMcpBody(JSON.stringify(msg));
const rpc = (method: string, params?: unknown, id: unknown = 1) => ({ jsonrpc: "2.0", id, method, params });
type Reply = { id: unknown; result: Record<string, any>; error: { code: number } }; // eslint-disable-line @typescript-eslint/no-explicit-any
const reply = (msg: unknown) => call(msg).body as Reply;

describe("MCP: handshake", () => {
  it("initialize devolve versão, capacidades e serverInfo", () => {
    const { status, body } = call(rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t", version: "1" } }));
    expect(status).toBe(200);
    const r = body as Reply;
    expect(r.id).toBe(1);
    expect(r.result.protocolVersion).toBe("2025-03-26");
    expect(r.result.capabilities).toEqual({ tools: { listChanged: false } });
    expect(r.result.serverInfo).toMatchObject({ name: "bolao-da-mega", version: expect.any(String) });
    expect(typeof r.result.instructions).toBe("string");
  });

  it("versão desconhecida cai na mais recente", () => {
    expect(reply(rpc("initialize", { protocolVersion: "1999-01-01" })).result.protocolVersion).toBe(LATEST_PROTOCOL_VERSION);
  });

  it("notificações e respostas do cliente dão 202 sem corpo", () => {
    expect(call({ jsonrpc: "2.0", method: "notifications/initialized" })).toEqual({ status: 202 });
    expect(call({ jsonrpc: "2.0", id: 9, result: {} })).toEqual({ status: 202 });
  });

  it("ping responde objeto vazio", () => {
    expect(reply(rpc("ping"))).toEqual({ jsonrpc: "2.0", id: 1, result: {} });
  });
});

describe("MCP: ferramentas", () => {
  it("tools/list traz as 3 ferramentas com schema e anotações", () => {
    const tools = reply(rpc("tools/list")).result.tools as { name: string; inputSchema: { type: string }; annotations: { readOnlyHint: boolean } }[];
    expect(tools.map((t) => t.name)).toEqual(["get_bolao_info", "calculate_game_plan", "calculate_game_cost"]);
    for (const t of tools) {
      expect(t.inputSchema.type).toBe("object");
      expect(t.annotations.readOnlyHint).toBe(true);
    }
  });

  it("calculate_game_plan reproduz o exemplo do produto: 102 cotas", () => {
    const r = reply(rpc("tools/call", { name: "calculate_game_plan", arguments: { quotas: 102 } })).result;
    expect(r.isError).toBe(false);
    expect(r.structuredContent).toMatchObject({ totalBRL: 6120, sizes: [12, 9, 7, 6, 6, 6, 6, 6], leftoverBRL: 0 });
  });

  it("calculate_game_plan aceita totalBRL", () => {
    const r = reply(rpc("tools/call", { name: "calculate_game_plan", arguments: { totalBRL: 60 } })).result;
    expect(r.structuredContent).toMatchObject({ sizes: [7, 6, 6, 6], leftoverBRL: 0 });
  });

  it("calculate_game_cost", () => {
    const r = reply(rpc("tools/call", { name: "calculate_game_cost", arguments: { numbers: 7 } })).result;
    expect(r.structuredContent).toMatchObject({ simpleBets: 7, costBRL: 42 });
  });

  it("get_bolao_info traz regras e passos", () => {
    const r = reply(rpc("tools/call", { name: "get_bolao_info", arguments: {} })).result;
    expect(r.structuredContent.quotaPriceBRL).toBe(60);
    expect(r.content[0].text).toContain("Regras");
  });

  it.each([
    ["calculate_game_plan", {}],
    ["calculate_game_plan", { quotas: 1, totalBRL: 60 }],
    ["calculate_game_plan", { quotas: 0 }],
    ["calculate_game_plan", { quotas: 1.5 }],
    ["calculate_game_cost", {}],
    ["calculate_game_cost", { numbers: 21 }],
    ["calculate_game_cost", { numbers: "7" }],
  ])("argumentos inválidos em %s %j viram isError", (name, args) => {
    const res = call(rpc("tools/call", { name, arguments: args }));
    expect(res.status).toBe(200);
    expect((res.body as Reply).result.isError).toBe(true);
  });

  it("ferramenta desconhecida é erro JSON-RPC -32602", () => {
    expect(reply(rpc("tools/call", { name: "nope" })).error.code).toBe(-32602);
  });
});

describe("MCP: erros JSON-RPC", () => {
  it("JSON inválido: -32700 e HTTP 400", () => {
    const res = handleMcpBody("{oops");
    expect(res.status).toBe(400);
    expect((res.body as Reply).error.code).toBe(-32700);
  });
  it("método desconhecido: -32601", () => {
    expect(reply(rpc("resources/list")).error.code).toBe(-32601);
  });
  it("mensagem inválida: -32600", () => {
    expect(call({ id: 1, method: "ping" }).status).toBe(400);
    expect(call(rpc("ping", undefined, {})).status).toBe(400);
  });
  it("lote: responde só às requisições; lote só de notificações dá 202", () => {
    const res = call([rpc("ping", undefined, 1), { jsonrpc: "2.0", method: "notifications/initialized" }, rpc("ping", undefined, "b")]);
    expect(res.status).toBe(200);
    expect((res.body as unknown[]).length).toBe(2);
    expect(call([{ jsonrpc: "2.0", method: "notifications/initialized" }]).status).toBe(202);
    expect(call([]).status).toBe(400);
  });
});

describe("MCP: HTTP", () => {
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    mcpPost(new Request("https://x.test/mcp", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } }));

  it("POST devolve application/json", async () => {
    const res = await post(rpc("ping"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^application\/json/);
    expect(await res.json()).toEqual({ jsonrpc: "2.0", id: 1, result: {} });
  });
  it("notificação: 202 sem corpo", async () => {
    const res = await post({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(res.status).toBe(202);
    expect(await res.text()).toBe("");
  });
  it("MCP-Protocol-Version desconhecida: 400", async () => {
    expect((await post(rpc("ping"), { "mcp-protocol-version": "1999-01-01" })).status).toBe(400);
    expect((await post(rpc("ping"), { "mcp-protocol-version": LATEST_PROTOCOL_VERSION })).status).toBe(200);
  });
  it("corpo grande demais: 413", async () => {
    const res = await mcpPost(new Request("https://x.test/mcp", { method: "POST", body: "x".repeat(100_001) }));
    expect(res.status).toBe(413);
  });
  it("GET e DELETE: 405 com Allow", () => {
    const res = mcpMethodNotAllowed();
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toContain("POST");
  });
  it("OPTIONS libera CORS", () => {
    const res = mcpOptions();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
  it("discovery descreve o servidor", async () => {
    const card = await mcpDiscovery().json();
    expect(card).toMatchObject({ name: "Bolão da Mega", authentication: { required: false }, transport: { type: "streamable-http" } });
    expect(card.tools).toHaveLength(serverCard().tools.length);
  });
});
