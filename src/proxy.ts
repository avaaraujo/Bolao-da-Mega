import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { markdownForPath, notFoundMarkdown } from "@/lib/agent/content";
import { classifyRoute, normalizePath, prefersMarkdown } from "@/lib/agent/negotiate";

const MARKDOWN_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "Cache-Control": "public, max-age=0, must-revalidate",
  "X-Content-Type-Options": "nosniff",
};

/**
 * Negociação de conteúdo: com `Accept: text/markdown` as páginas públicas respondem em Markdown
 * e caminhos inexistentes dão 404 também em Markdown. Todo o resto segue em HTML, com `Vary: Accept`
 * para caches não misturarem as duas versões.
 */
export function proxy(request: NextRequest) {
  if (prefersMarkdown(request.headers.get("accept"))) {
    const pathname = normalizePath(request.nextUrl.pathname);
    const kind = classifyRoute(pathname, (p) => markdownForPath(p) !== null);
    if (kind === "markdown") {
      return new NextResponse(markdownForPath(pathname), { status: 200, headers: MARKDOWN_HEADERS });
    }
    if (kind === "unknown") {
      return new NextResponse(notFoundMarkdown(pathname), { status: 404, headers: MARKDOWN_HEADERS });
    }
  }
  const response = NextResponse.next();
  response.headers.append("Vary", "Accept");
  return response;
}

export const config = {
  // Tudo, menos os arquivos do build: os endpoints e arquivos públicos conhecidos passam direto
  // (ver APP_ROUTES) e só caminhos inexistentes ganham 404 em Markdown.
  matcher: ["/((?!_next/).*)"],
};
