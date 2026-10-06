import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const get = (path: string, accept?: string) =>
  proxy(new NextRequest(`https://bolaodamega.avaaraujo.com${path}`, { headers: accept ? { accept } : {} }));

describe("proxy: Markdown", () => {
  it("home em Markdown com Vary: Accept", async () => {
    const res = get("/", "text/markdown");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^text\/markdown/);
    expect(res.headers.get("vary")).toBe("Accept");
    const body = await res.text();
    expect(body).toMatch(/^# Bolão da Mega/);
    expect(body).not.toMatch(/<html|<div/i);
    expect(body.length).toBeGreaterThan(500);
  });

  it("páginas de confiança em Markdown", async () => {
    for (const path of ["/about", "/contact", "/privacy", "/developers"]) {
      const res = get(path, "text/markdown");
      expect(res.status).toBe(200);
      expect(await res.text()).toMatch(/^# /);
    }
  });

  it("404 em Markdown com explicação e links", async () => {
    const res = get("/__ora-404-probe-wsk27qql", "text/markdown");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toMatch(/^text\/markdown/);
    expect(res.headers.get("vary")).toBe("Accept");
    const body = await res.text();
    expect(body.length).toBeGreaterThan(20);
    expect(body).toContain("/llms.txt");
    expect(body).toContain("/sitemap.xml");
  });

  it("o caminho não quebra o Markdown", async () => {
    const res = get("/a%60b", "text/markdown");
    const body = await res.text();
    expect(body).not.toContain("a`b");
  });

  it("rotas do app e endpoints seguem adiante mesmo pedindo Markdown", () => {
    for (const path of ["/b/FIRMA-7K3Q/entrar", "/admin", "/b/FIRMA-7K3Q/p/abc", "/mcp", "/llms.txt", "/.well-known/mcp"]) {
      const res = get(path, "text/markdown");
      expect(res.headers.get("x-middleware-next")).toBe("1");
    }
  });
});

describe("proxy: HTML", () => {
  it.each([undefined, "text/html", "*/*", "text/html,application/xhtml+xml,*/*;q=0.8"])("segue para o HTML com Accept %s", (accept) => {
    const res = get("/", accept);
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(res.headers.get("vary")).toContain("Accept");
  });
});
