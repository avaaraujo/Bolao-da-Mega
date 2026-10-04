# Bolão da Mega

Plataforma mobile-first para o bolão da Mega da Virada da firma: cotas de R$ 60, Pix, comprovante, 6 números por pessoa, ranking dos números e montagem automática dos jogos (maior jogo primeiro, ranking em sequência sem repetir).

No ar (modo demo): https://bolaodamega1.vercel.app

## Rodar

```bash
npm install
npm run dev
```

Testes das regras: `npx vitest run`.

## Modo demo (agora)

Tudo roda com dados fictícios salvos no navegador (localStorage): 44 participantes de exemplo, 102 cotas aprovadas (R$ 6.120). A área do Avá (`/admin`) entra sem senha no modo demo. Em **Edição → Restaurar dados de exemplo** você volta ao estado inicial.

## Ativar o Supabase (dezembro)

1. Criar (ou reativar) um projeto e rodar `supabase/schema.sql`; criar o bucket privado `comprovantes`.
2. Implementar `src/lib/data/supabase.ts` seguindo a interface `DataSource` em `src/lib/data/source.ts`.
3. Variáveis: `NEXT_PUBLIC_DATA_SOURCE=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e service role no servidor para o admin).

As telas não mudam: só a fonte de dados.

## Onde está cada coisa

- `src/lib/rules.ts`: custo dos jogos, divisão gulosa, ranking com desempate, montagem dos jogos.
- `src/lib/data/`: interface de dados, mock (localStorage), seed e stub do Supabase.
- `src/components/riso.tsx`, `volante.tsx`, `jogos.tsx`: o sistema visual riso.
- `src/app/`: telas do participante (`/`, `/entrar`, `/p/[token]`…) e do Avá (`/admin/*`).

## Para agentes de IA

- `Accept: text/markdown` em qualquer página pública devolve Markdown (`src/proxy.ts`, `src/lib/agent/`); caminhos inexistentes dão 404 também em Markdown.
- `/llms.txt`, `/sitemap.xml`, `/robots.txt`, JSON-LD na home e páginas `/about`, `/contact`, `/privacy`, `/developers`.
- Servidor MCP público e somente leitura (Streamable HTTP) em `/mcp` e `/.well-known/mcp`: `get_bolao_info`, `calculate_game_plan`, `calculate_game_cost`.
- Contato público opcional (entra na página de contato e no JSON-LD só se definido): `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_ADDRESS_LOCALITY`, `NEXT_PUBLIC_ADDRESS_COUNTRY` (+ `_STREET`, `_REGION`, `_POSTAL_CODE`).
