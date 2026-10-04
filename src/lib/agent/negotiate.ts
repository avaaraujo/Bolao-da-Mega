/** Negociação de conteúdo Accept: text/markdown (acceptmarkdown.com, RFC 9110 §12.5.1). */

type Range = { type: string; q: number; index: number };

function parseAccept(header: string): Range[] {
  return header
    .split(",")
    .map((part, index): Range | null => {
      const [type, ...params] = part.trim().split(";");
      if (!type.trim()) return null;
      let q = 1;
      for (const p of params) {
        const [k, v] = p.split("=").map((s) => s.trim());
        if (k?.toLowerCase() === "q") {
          const n = Number(v);
          q = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
        }
      }
      return { type: type.trim().toLowerCase(), q, index };
    })
    .filter((r): r is Range => r !== null);
}

/** Qualidade e especificidade (2 exato, 1 text/*, 0 qualquer) com que o cliente aceita um tipo. */
function match(ranges: Range[], type: string): { q: number; specificity: number; index: number } {
  const group = `${type.split("/")[0]}/*`;
  let best = { q: 0, specificity: -1, index: Infinity };
  for (const r of ranges) {
    const specificity = r.type === type ? 2 : r.type === group ? 1 : r.type === "*/*" ? 0 : -1;
    if (specificity > best.specificity) best = { q: r.q, specificity, index: r.index };
  }
  return best;
}

/**
 * Verdadeiro quando o cliente prefere Markdown a HTML. Curingas (`*` / `*` e `text/*`) não
 * bastam: um navegador ou curl sem Accept continua recebendo HTML.
 */
export function prefersMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  const ranges = parseAccept(accept);
  const md = match(ranges, "text/markdown");
  if (md.specificity < 2 || md.q <= 0) return false;
  const html = match(ranges, "text/html");
  if (html.q < md.q) return true;
  if (html.q > md.q) return false;
  // Mesma qualidade: vale o mais específico; se os dois são explícitos, o que veio primeiro.
  return html.specificity < md.specificity || (html.specificity === md.specificity && md.index < html.index);
}

/**
 * Como o proxy trata cada caminho quando o cliente pede Markdown:
 * - "markdown": rota pública com versão em Markdown;
 * - "pass": rota que existe (app, arquivos de metadados, endpoints) e segue como está;
 * - "unknown": não existe, responde 404 em Markdown.
 */
export type RouteKind = "markdown" | "pass" | "unknown";

const APP_ROUTES: RegExp[] = [
  /^\/entrar$/,
  /^\/resultado$/,
  /^\/admin(\/(pagamentos|ranking|jogos|edicao))?$/,
  /^\/p\/[^/]+(\/(pagamento|volante))?$/,
  /^\/(opengraph-image|apple-icon|mcp|llms\.txt|robots\.txt|sitemap\.xml|icon\.svg)$/,
  /^\/\.well-known\/mcp$/,
];

export function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") || "/" : pathname;
}

export function classifyRoute(pathname: string, hasMarkdown: (path: string) => boolean): RouteKind {
  const path = normalizePath(pathname);
  if (hasMarkdown(path)) return "markdown";
  return APP_ROUTES.some((r) => r.test(path)) ? "pass" : "unknown";
}
