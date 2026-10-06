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
  "Só entram no ranking os votos de quem teve o Pix aprovado pelo organizador do bolão.",
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
  description: "O que é o Bolão da Mega, quem organiza cada bolão e como o dinheiro e os jogos são tratados.",
  sections: [
    {
      heading: "O que é",
      paragraphs: [
        "O Bolão da Mega é uma ferramenta para grupos de amigos e colegas organizarem o bolão da Mega da Virada sem planilha nem comprovante perdido no WhatsApp: cada pessoa entra, paga, manda o comprovante e escolhe seus 6 números num lugar só.",
        "Qualquer pessoa pode criar uma conta de organizador e abrir o seu bolão. Cada bolão é uma sala separada, com código próprio, valores próprios e participantes próprios. Quem está numa sala não vê as outras.",
      ],
    },
    {
      heading: "Quem organiza e como o dinheiro funciona",
      paragraphs: [
        "O organizador de cada bolão é quem criou a sala: ele define o valor da cota e a chave Pix, confere cada pagamento, acompanha o ranking dos números, monta os jogos e registra as apostas.",
        "O Pix vai direto para a conta do organizador, com o valor exato das cotas. O site não recebe, guarda nem repassa dinheiro. As apostas são registradas pelo organizador na lotérica ou no aplicativo da Caixa. O site faz as contas, mas a palavra final é de quem organiza.",
        "Os jogos não são sorteados nem escolhidos por uma pessoa: saem do voto coletivo do grupo, seguindo as regras abaixo.",
      ],
      items: RULES,
    },
    {
      heading: "O que o Bolão da Mega não é",
      paragraphs: [
        "Não é casa de apostas, não vende palpites nem intermedia apostas, e não tem ligação com a Caixa Econômica Federal. É uma ferramenta de organização para grupos fechados que já se conhecem, e a confiança entre organizador e participantes continua sendo de quem participa.",
        "O sorteio da Mega da Virada é em 31/12. Cada organizador define até quando as inscrições do seu bolão ficam abertas.",
      ],
    },
  ],
};

export const CONTACT_PAGE: InfoPageContent = {
  path: "/contact",
  title: "Contato",
  headline: "CONTATO",
  description: "Com quem falar sobre pagamentos, números e dados: o organizador do seu bolão ou quem mantém o site.",
  sections: [
    {
      heading: "Fale com o organizador do seu bolão",
      paragraphs: [
        "Cada bolão tem uma pessoa responsável, quem criou a sala e te passou o código ou o link. Dúvidas sobre cotas, Pix, comprovantes ou sobre os seus 6 números devem ir direto para ela, pelo mesmo grupo de mensagens onde o convite foi compartilhado.",
        "O site não tem atendimento sobre pagamentos: o Pix vai para a conta do organizador, então só ele consegue conferir, corrigir ou devolver um valor.",
      ],
    },
    {
      heading: "Antes de escrever",
      items: [
        "Pagamento recusado: abra o seu bilhete pelo link pessoal; o motivo informado pelo organizador aparece lá, e dá para enviar um novo comprovante.",
        "Perdeu o link do bilhete: peça o link de novo no grupo, informando o nome com que se inscreveu. No mesmo aparelho, a página do bolão mostra o seu bilhete.",
        "Erro no valor do Pix: o valor exato aparece na tela de pagamento antes de você pagar.",
        "Quer corrigir ou apagar seus dados: veja a página de privacidade e peça ao organizador do seu bolão.",
      ],
    },
    {
      heading: "Problemas com o site",
      paragraphs: [
        "Para erros do site, dúvidas sobre privacidade da plataforma ou denúncias, fale com quem mantém o Bolão da Mega.",
        ...(CONTACT.email
          ? [`Contato por e-mail: ${CONTACT.email}.`]
          : ["O endereço de contato da plataforma ainda não está publicado nesta página; enquanto isso, use o grupo do seu bolão."]),
        "Há também um servidor MCP público, o llms.txt e a negociação de conteúdo em Markdown, descritos na página para desenvolvedores.",
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
        "Participante: o seu nome, um contato opcional, a quantidade de cotas, os 6 números que você escolhe e o comprovante do Pix (imagem ou PDF). Você não cria conta nem senha; o acesso ao seu bilhete é pelo link pessoal, que é secreto.",
        "Organizador: e-mail e senha da conta, e os dados do bolão (nome, valores, chave Pix, datas e jogos). Não pedimos documentos nem endereço.",
      ],
    },
    {
      heading: "Para que servem",
      paragraphs: [
        "Os dados servem apenas para organizar o bolão: o organizador confere o seu pagamento, monta o ranking dos números e os jogos, e registra as apostas. Nada é vendido, usado para publicidade ou compartilhado com terceiros além da infraestrutura descrita abaixo.",
      ],
    },
    {
      heading: "Onde ficam e quem vê",
      items: [
        "Os dados ficam num banco de dados e num armazenamento privado de comprovantes (Supabase, servidores em São Paulo). A hospedagem do site é a Vercel, que registra dados técnicos de acesso, como qualquer servidor web.",
        "Cada bolão é isolado: o organizador só vê os participantes e comprovantes do próprio bolão, e ninguém vê o de outro. Os comprovantes ficam em armazenamento privado, acessíveis só ao organizador daquela sala.",
        "Quem tem o código do bolão vê a lista de nomes, a quantidade de cotas e se o Pix foi confirmado. O seu contato e o seu comprovante não aparecem para os outros participantes.",
        "Os números de cada participante ficam em segredo, inclusive dos outros participantes, até o organizador marcar o bolão como apostado. Cada pessoa vê os próprios números pelo link pessoal.",
        "Modo demo: os dados são fictícios e ficam só no navegador, sem ir para um servidor.",
        "O site não usa cookies de rastreamento nem ferramentas de análise de audiência.",
      ],
    },
    {
      heading: "Seus direitos",
      paragraphs: [
        "Pela Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode pedir acesso, correção ou exclusão dos seus dados. Como o organizador do seu bolão decide para que os dados da turma são usados, faça o pedido a ele, pelo grupo do bolão. Para dados de conta de organizador ou questões da plataforma, use o contato indicado na página de contato.",
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
        "Use estes recursos para explicar como funciona o bolão da Mega da Virada ou para conferir as contas de um bolão com cotas de R$ 60. Eles não registram inscrições, não confirmam pagamentos e não mostram números de participantes.",
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
      "Mega da Virada: sorteio em 31/12. Cada organizador cria o seu bolão, uma sala separada com código próprio, e define o valor da cota e o prazo das inscrições.",
      "## Como funciona",
      STEPS.map((s, i) => `${i + 1}. **${s.title}**: ${s.text}`).join("\n"),
      "## Regras do bolão",
      RULES.map((r) => `- ${r}`).join("\n"),
      "## Participar",
      `Quem recebeu o convite digita o código do bolão em [${absoluteUrl("/")}](${absoluteUrl("/")}) (ou abre o link da sala), faz o Pix e envia o comprovante. Cada bolão tem seu organizador.`,
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
