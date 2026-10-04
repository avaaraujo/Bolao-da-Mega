import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { BolaoProvider } from "./bolao-provider";
import { Home } from "./home";

/** O HTML do servidor (sem JavaScript) precisa ter conteúdo de verdade. */
describe("home sem JavaScript", () => {
  const html = renderToString(
    <BolaoProvider>
      <Home />
    </BolaoProvider>,
  );
  const text = html
    .replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  it("tem mais de 500 caracteres de texto", () => {
    expect(text.length).toBeGreaterThan(500);
  });
  it("tem um único h1 e só h2 abaixo dele", () => {
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>[\s\S]*BOLÃO[\s\S]*<\/h1>/);
    expect(html).toContain("<h2");
    expect(html).not.toMatch(/<h[3-6][ >]/);
  });
  it("mostra como funciona, regras e links de confiança", () => {
    expect(text).toContain("Escolha as cotas");
    expect(text).toContain("Regras do bolão");
    for (const href of ["/about", "/contact", "/privacy"]) expect(html).toContain(`href="${href}"`);
  });
});
