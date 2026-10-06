import { describe, expect, it } from "vitest";
import { classifyRoute, normalizePath, prefersMarkdown } from "./negotiate";

describe("prefersMarkdown", () => {
  it.each([
    ["text/markdown", true],
    ["text/markdown, text/html;q=0.9", true],
    ["text/markdown, */*", true],
    ["text/html;q=0.5, text/markdown;q=0.9", true],
    ["TEXT/Markdown;Q=1", true],
    ["text/markdown, text/html", true], // empate explícito: vale o primeiro
    ["text/html, text/markdown", false],
    ["text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", false],
    ["*/*", false],
    ["text/*", false],
    ["text/html", false],
    ["text/markdown;q=0", false],
    ["text/markdown;q=0.5, text/html", false],
    ["application/json", false],
    ["", false],
    [null, false],
    [undefined, false],
  ])("%s -> %s", (accept, expected) => {
    expect(prefersMarkdown(accept)).toBe(expected);
  });
});

describe("classifyRoute", () => {
  const has = (p: string) => ["/", "/about"].includes(p);
  it("separa markdown, rotas do app e inexistentes", () => {
    expect(classifyRoute("/", has)).toBe("markdown");
    expect(classifyRoute("/about/", has)).toBe("markdown");
    expect(classifyRoute("/b/FIRMA-7K3Q/entrar", has)).toBe("pass");
    expect(classifyRoute("/b/FIRMA-7K3Q/admin/ranking", has)).toBe("pass");
    expect(classifyRoute("/b/FIRMA-7K3Q/p/abc123/volante", has)).toBe("pass");
    expect(classifyRoute("/mcp", has)).toBe("pass");
    expect(classifyRoute("/.well-known/mcp", has)).toBe("pass");
    expect(classifyRoute("/sitemap.xml", has)).toBe("pass");
    expect(classifyRoute("/__ora-404-probe-wsk27qql", has)).toBe("unknown");
    expect(classifyRoute("/b/FIRMA-7K3Q/admin/outra", has)).toBe("unknown");
  });
  it("normaliza barra final", () => {
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/about//")).toBe("/about");
  });
});
