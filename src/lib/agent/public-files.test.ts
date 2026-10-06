import { describe, expect, it } from "vitest";
import { ABOUT, CONTACT_PAGE, DEVELOPERS, INFO_PAGES, PRIVACY, infoPageMarkdown, markdownForPath } from "./content";
import { homeJsonLd, jsonLdString } from "./jsonld";
import { llmsTxt } from "./llms";
import robots from "../../app/robots";
import sitemap from "../../app/sitemap";

const textLength = (page: (typeof INFO_PAGES)[number]) =>
  page.sections.flatMap((s) => [...(s.paragraphs ?? []), ...(s.items ?? [])]).join(" ").length;

describe("páginas de confiança", () => {
  it.each([ABOUT, CONTACT_PAGE, PRIVACY])("$path tem pelo menos 500 caracteres", (page) => {
    expect(textLength(page)).toBeGreaterThanOrEqual(500);
  });
  it("todas têm Markdown", () => {
    for (const p of INFO_PAGES) expect(markdownForPath(p.path)).toBe(infoPageMarkdown(p));
    expect(markdownForPath("/")).toMatch(/^# Bolão da Mega/);
    expect(markdownForPath("/nada")).toBeNull();
  });
  it("a página de desenvolvedores cita MCP e llms.txt", () => {
    expect(JSON.stringify(DEVELOPERS)).toMatch(/\/mcp/);
    expect(JSON.stringify(DEVELOPERS)).toMatch(/llms\.txt/);
  });
});

describe("llms.txt", () => {
  const txt = llmsTxt();
  it("segue o formato llmstxt.org", () => {
    const lines = txt.split("\n");
    expect(lines[0]).toBe("# Bolão da Mega");
    expect(txt).toMatch(/\n> .+/);
    expect(txt.match(/^## /gm)?.length).toBeGreaterThanOrEqual(3);
    // todo item de lista de links é um link Markdown absoluto
    for (const line of lines.filter((l) => l.startsWith("- [")))
      expect(line).toMatch(/^- \[[^\]]+\]\(https?:\/\/[^)]+\)/);
  });
  it("tem seção de quando usar e cita as ferramentas", () => {
    expect(txt).toMatch(/## When to use this/);
    for (const tool of ["get_bolao_info", "calculate_game_plan", "calculate_game_cost"]) expect(txt).toContain(tool);
    expect(txt).toContain("/mcp");
  });
});

describe("JSON-LD", () => {
  const graph = homeJsonLd();
  it("traz Organization, WebSite e SoftwareApplication", () => {
    expect(graph["@context"]).toBe("https://schema.org");
    expect(graph["@graph"].map((n) => n["@type"])).toEqual(["Organization", "WebSite", "SoftwareApplication"]);
    expect(graph["@graph"][2]).toMatchObject({ name: "Bolão da Mega", operatingSystem: "Web", offers: { price: "0", priceCurrency: "BRL" } });
  });
  it("não inventa contato nem endereço", () => {
    const org = graph["@graph"][0];
    expect(org).not.toHaveProperty("contactPoint");
    expect(org).not.toHaveProperty("address");
  });
  it("escapa < na serialização", () => {
    expect(jsonLdString({ a: "</script>" })).not.toContain("</script>");
    expect(JSON.parse(jsonLdString({ a: "</script>" }))).toEqual({ a: "</script>" });
  });
});

describe("sitemap e robots", () => {
  it("sitemap lista as páginas públicas com lastModified e URLs absolutas", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    for (const u of urls) expect(u).toMatch(/^https?:\/\//);
    for (const path of ["/", "/about", "/contact", "/privacy", "/developers"]) {
      expect(urls.some((u) => u.endsWith(path))).toBe(true);
    }
    expect(urls.some((u) => u.includes("/admin") || u.includes("/b/"))).toBe(false);
    expect(entries.every((e) => e.lastModified)).toBe(true);
  });
  it("robots aponta para o sitemap", () => {
    expect(robots().sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
