import { CONTACT, SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "../site";

/** Conteúdo público do site: uma fonte só para o HTML, o Markdown, o llms.txt e o sitemap. */

export const STEPS = [
  { title: "Escolha as cotas", text: "Quantas quiser, R$ 60 cada." },
  { title: "Faça o Pix", text: "O valor exato aparece na hora." },
  { title: "Mande o comprovante", text: "Foto ou PDF, direto aqui." },
  { title: "Marque 6 números", text: "Os mais votados do grupo viram os jogos." },
];

export const RULES = [
  "Cada cota custa R$ 60 e cada pessoa compra quantas quiser.",
  "Cada pessoa escolhe 6 números de 1 a 60, uma única vez. O voto não pesa pelas cotas: quem tem 5 cotas vota igual a quem tem 1.",
  "O ranking vai do número mais escolhido ao menos escolhido. Em caso de empate, fica na frente o número escolhido primeiro.",
  "Só entram no ranking os votos de quem teve o Pix aprovado pelo Avá.",
  "Um jogo de n números custa C(n,6) × R$ 6, porque equivale a C(n,6) apostas simples. Um jogo de 7 números custa R$ 42; um de 12, R$ 5.544.",
  "Com o dinheiro das cotas, faz-se o maior jogo que cabe e repete-se até não sobrar valor para uma aposta simples.",
  "Os jogos consomem o ranking em sequência, sem repetir números; se o ranking acabar, volta ao começo.",
  "Os números de cada participante ficam em segredo até as apostas serem feitas.",
];

export type Section = { heading: string; paragraphs?: string[]; items?: string[] };
export type InfoPageContent = {
  path: string;
  title: string;
  /** Título curto no cartaz (HTML). */
  headline: string;
  description: string;
  sections: Section[];
};

export const ABOUT: InfoPageContent = {
  path: "/about",
  title: "Sobre",
  headline: "SOBRE",
  description: "O que é o Bolão da Mega, quem organiza e como o dinheiro e os jogos são tratados.",
  sections: [
    {
      heading: "O que é",
      paragraphs: [
        "O Bolão da Mega é o site do bolão da Mega da Virada de um grupo de colegas de trabalho. Ele substitui o processo manual de Pix, comprovante por mensagem e planilha que o Avá fazia todo fim de ano: cada pessoa entra, paga, manda o comprovante e escolhe seus 6 números num lugar só.",
        "O Avá é o organizador e o único administrador: ele confere cada pagamento, acompanha o ranking dos números, monta os jogos e registra as apostas.",
      ],
    },
    {
      heading: "Como o dinheiro e os jogos funcionam",
      paragraphs: [
        "O Pix vai direto para a conta pessoal do Avá, com o valor exato das cotas. As apostas são registradas por ele na lotérica ou no aplicativo da Caixa. O site calcula as contas, mas a palavra final é do Avá.",
        "Os jogos não são sorteados nem escolhidos por uma pessoa: saem do voto coletivo do grupo, seguindo as regras abaixo.",
      ],
      items: RULES,
    },
    {
      heading: "O que o Bolão da Mega não é",
      paragraphs: [
        "Não é casa de apostas, não vende palpites nem intermedia apostas, e não tem ligação com a Caixa Econômica Federal. É uma ferramenta de organização para um grupo fechado que já se conhece.",
        "As inscrições abrem em dezembro e o sorteio é a Mega da Virada, em 31/12. Enquanto isso, o site funciona em modo demo, com dados fictícios.",
      ],
    },
  ],
};

export const CONTACT_PAGE: InfoPageContent = {
  path: "/contact",
  title: "Contato",
  headline: "CONTATO",
  description: "Como falar com o Avá, organizador do Bolão da Mega, sobre pagamentos, números e dúvidas.",
  sections: [
    {
      heading: "Fale com o Avá",
      paragraphs: [
        "O Bolão da Mega tem uma única pessoa responsável: o Avá, que organiza o bolão. Dúvidas sobre cotas, Pix, comprovantes ou sobre os seus 6 números devem ir direto para ele, pelo mesmo grupo de mensagens onde o link do bolão foi compartilhado.",
        ...(CONTACT.email ? [`Contato por e-mail: ${CONTACT.email}.`] : []),
      ],
    },
    {
      heading: "Antes de escrever",
      items: [
        "Pagamento recusado: abra o seu bilhete pelo link pessoal; o motivo informado pelo Avá aparece lá, e dá para enviar um novo comprovante.",
        "Perdeu o link do bilhete: peça o link de novo no grupo, informando o nome com que se inscreveu.",
        "Erro no valor do Pix: o valor exato (R$ 60 por cota) aparece na tela de pagamento antes de você pagar.",
        "Quer corrigir ou apagar seus dados: veja a página de privacidade e fale com o Avá.",
      ],
    },
    {
      heading: "Para agentes e desenvolvedores",
      paragraphs: [
        "Há um servidor MCP público e somente leitura, o llms.txt e a negociação de conteúdo em Markdown. Tudo está descrito na página para desenvolvedores.",
      ],
    },
  ],
};

export const PRIVACY: InfoPageContent = {
  path: "/privacy",
  title: "Privacidade",
  headline: "PRIVACIDADE",
  description: "Quais dados o Bolão da Mega usa, onde ficam e quem pode vê-los.",
  sections: [
    {
      heading: "Quais dados",
      paragraphs: [
        "Para participar, o Bolão da Mega usa o seu nome, um contato opcional, a quantidade de cotas, os 6 números que você escolhe e o comprovante do Pix (imagem ou PDF). Não pedimos documentos, endereço nem dados bancários além do que aparece no comprovante.",
      ],
    },
    {
      heading: "Para que servem",
      paragraphs: [
        "Os dados servem apenas para organizar o bolão: o Avá confere o seu pagamento, monta o ranking dos números e os jogos, e registra as apostas. Nada é vendido, usado para publicidade ou compartilhado com terceiros.",
      ],
    },
    {
      heading: "Onde ficam e quem vê",
      items: [
        "Hoje, em modo demo, os dados são fictícios e ficam só no navegador de quem usa (localStorage), sem ir para um servidor.",
        "Quando as inscrições abrirem em dezembro, os dados passam para um banco de dados e um armazenamento privado de comprovantes, acessíveis apenas ao Avá.",
        "Os outros participantes não veem seus números nem o ranking até as apostas serem feitas.",
        "O site não usa cookies de rastreamento nem ferramentas de análise de audiência. A hospedagem na Vercel registra dados técnicos de acesso, como qualquer servidor web.",
      ],
    },
    {
      heading: "Seus direitos",
      paragraphs: [
        "Pela Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode pedir acesso, correção ou exclusão dos seus dados. Faça o pedido ao Avá, pelo grupo do bolão ou pelo contato indicado na página de contato.",
      ],
    },
  ],
};

export const DEVELOPERS: InfoPageContent = {
  path: "/developers",
  title: "Desenvolvedores",
  headline: "PARA AGENTES",
  description: "Servidor MCP, llms.txt e Markdown do Bolão da Mega para agentes de IA e desenvolvedores.",
  sections: [
    {
      heading: "Recursos para agentes",
      paragraphs: [
        "O Bolão da Mega publica recursos legíveis por máquina. Todos são públicos, gratuitos e somente leitura: nenhum deles acessa dados de participantes.",
      ],
      items: [
        `Servidor MCP (Streamable HTTP, sem autenticação): ${absoluteUrl("/mcp")}. Também responde em ${absoluteUrl("/.well-known/mcp")}.`,
        `llms.txt, com quando usar este site: ${absoluteUrl("/llms.txt")}.`,
        `Sitemap: ${absoluteUrl("/sitemap.xml")}.`,
        "Markdown: peça qualquer página pública com o cabeçalho Accept: text/markdown e a resposta vem em Markdown, com Vary: Accept.",
      ],
    },
    {
      heading: "Ferramentas do servidor MCP",
      items: [
        "get_bolao_info: regras do bolão, preço da cota e como participar.",
        "calculate_game_plan: dado o número de cotas (ou o total em reais), devolve os jogos que o bolão faria, do maior ao menor, e a sobra.",
        "calculate_game_cost: custo em reais de um jogo com n números (de 6 a 20).",
      ],
    },
    {
      heading: "Quando usar",
      paragraphs: [
        "Use estes recursos para explicar como funciona o bolão da Mega da Virada do Avá ou para conferir as contas de um bolão com cotas de R$ 60. Eles não registram inscrições, não confirmam pagamentos e não mostram números de participantes.",
      ],
    },
  ],
};

export const INFO_PAGES: InfoPageContent[] = [ABOUT, CONTACT_PAGE, PRIVACY, DEVELOPERS];

/** Rotas públicas do app (HTML) que têm um resumo em Markdown. */
const HOME_PATH = "/";

function section(s: Section): string {
  const out = [`## ${s.heading}`];
  if (s.paragraphs?.length) out.push(s.paragraphs.join("\n\n"));
  if (s.items?.length) out.push(s.items.map((i) => `- ${i}`).join("\n"));
  return out.join("\n\n");
}

export function infoPageMarkdown(page: InfoPageContent): string {
  return [`# ${page.title} · ${SITE_NAME}`, `> ${page.description}`, ...page.sections.map(section), footerLinks()].join("\n\n") + "\n";
}

function footerLinks(): string {
  return [
    "## Links",
    [
      `- [Início](${absoluteUrl("/")})`,
      ...INFO_PAGES.map((p) => `- [${p.title}](${absoluteUrl(p.path)})`),
      `- [llms.txt](${absoluteUrl("/llms.txt")})`,
      `- [Sitemap](${absoluteUrl("/sitemap.xml")})`,
    ].join("\n"),
  ].join("\n\n");
}

export function homeMarkdown(): string {
  return (
    [
      `# ${SITE_NAME}`,
      `> ${SITE_DESCRIPTION}`,
      "Mega da Virada: sorteio em 31/12, inscrições abertas em dezembro. O site está em modo demo, com dados fictícios, até a edição abrir.",
      "## Como funciona",
      STEPS.map((s, i) => `${i + 1}. **${s.title}**: ${s.text}`).join("\n"),
      "## Regras do bolão",
      RULES.map((r) => `- ${r}`).join("\n"),
      "## Participar",
      `Quem recebeu o convite entra em [${absoluteUrl("/entrar")}](${absoluteUrl("/entrar")}), faz o Pix e envia o comprovante. O organizador é o Avá.`,
      footerLinks(),
    ].join("\n\n") + "\n"
  );
}

export function notFoundMarkdown(pathname: string): string {
  return (
    [
      "# 404: página não encontrada",
      `O caminho \`${pathname.replace(/[`\r\n]/g, "")}\` não existe em ${SITE_NAME}. Confira o endereço ou comece por uma das páginas abaixo.`,
      footerLinks(),
    ].join("\n\n") + "\n"
  );
}

/** Markdown de uma rota pública, ou null se a rota não tem versão em Markdown. */
export function markdownForPath(pathname: string): string | null {
  if (pathname === HOME_PATH) return homeMarkdown();
  const page = INFO_PAGES.find((p) => p.path === pathname);
  return page ? infoPageMarkdown(page) : null;
}
