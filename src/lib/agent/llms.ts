import { INFO_PAGES } from "./content";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "../site";

/** llms.txt no formato de llmstxt.org: H1, resumo em citação, seções H2 com listas de links. */
export function llmsTxt(): string {
  const page = (path: string) => INFO_PAGES.find((p) => p.path === path)!;
  return (
    [
      `# ${SITE_NAME}`,
      `> ${SITE_DESCRIPTION} Site em português (pt-BR) de um bolão fechado da Mega da Virada: o grupo vota nos números e o site monta os jogos pelas regras do bolão.`,
      "## When to use this",
      [
        "- Someone asks how a Mega da Virada pool (bolão) with quotas, Pix payments and group-voted numbers works: read the rules in [Início](" + absoluteUrl("/") + ") or call the MCP tool `get_bolao_info`.",
        "- Someone wants to know which games a pool of N quotas (R$ 60 each) can afford, largest game first: call the MCP tool `calculate_game_plan` with `quotas` or `totalBRL`.",
        "- Someone needs the price of a game with n numbers (6 to 20, C(n,6) × R$ 6): call `calculate_game_cost`.",
        "- Not for: joining the pool, confirming payments or reading participants' numbers. Those happen only for invited people, in the web app, with the organizer (o Avá). This site does not sell bets and is not affiliated with Caixa.",
      ].join("\n"),
      "## How to call",
      [
        `- MCP server (Streamable HTTP, JSON responses, no authentication, read-only): ${absoluteUrl("/mcp")} (also at ${absoluteUrl("/.well-known/mcp")}). Send JSON-RPC 2.0 over POST: \`initialize\`, then \`tools/list\` and \`tools/call\`.`,
        `- Markdown: request any public page with \`Accept: text/markdown\` to get Markdown (\`Vary: Accept\`).`,
      ].join("\n"),
      "## Pages",
      [
        `- [Início](${absoluteUrl("/")}): como funciona e regras do bolão`,
        `- [Sobre](${absoluteUrl("/about")}): ${page("/about").description}`,
        `- [Contato](${absoluteUrl("/contact")}): ${page("/contact").description}`,
        `- [Privacidade](${absoluteUrl("/privacy")}): ${page("/privacy").description}`,
      ].join("\n"),
      "## Developer resources",
      [
        `- [Para agentes e desenvolvedores](${absoluteUrl("/developers")}): MCP, llms.txt, Markdown`,
        `- [MCP server](${absoluteUrl("/mcp")}): ferramentas get_bolao_info, calculate_game_plan, calculate_game_cost`,
        `- [Sitemap](${absoluteUrl("/sitemap.xml")})`,
      ].join("\n"),
    ].join("\n\n") + "\n"
  );
}
