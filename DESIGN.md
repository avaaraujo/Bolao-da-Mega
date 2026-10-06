---
name: Bolão da Mega
description: O bolão da Mega da Virada da firma, impresso como um zine de risografia.
colors:
  paper: "#fbfaf6"
  paper-deep: "#f1efe7"
  riso-pink: "#ff48b0"
  riso-blue: "#0078bf"
  blue-deep: "#005a91"
  riso-yellow: "#ffe800"
  ink: "#1a1a1a"
  ink-soft: "#4a4a48"
typography:
  poster:
    fontFamily: "Anybody, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5cqi"
    fontWeight: 850
    lineHeight: 0.84
    letterSpacing: "normal"
    fontVariation: "'wdth' 60"
  poster-xl:
    fontFamily: "Anybody, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15cqi"
    fontWeight: 900
    lineHeight: 0.84
    fontVariation: "'wdth' 50"
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24cqi"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 62"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 72"
  number:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(22px, 7.4cqi, 30px)"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 85"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.375
    fontFeature: "'tnum'"
  small:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
    fontVariation: "'wdth' 85"
rounded:
  hairline: "2px"
  frame: "3px"
  md: "6px"
  full: "9999px"
spacing:
  grid-gap: "2px"
  xs: "8px"
  sm: "12px"
  gutter: "16px"
  md: "20px"
  lg: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.riso-yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-stamp:
    backgroundColor: "{colors.riso-pink}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.blue-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-solid:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "52px"
  strip:
    backgroundColor: "transparent"
    textColor: "{colors.blue-deep}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  number-chip:
    backgroundColor: "{colors.riso-pink}"
    textColor: "{colors.blue-deep}"
    typography: "{typography.number}"
    rounded: "{rounded.full}"
    size: "40px"
  tab-active:
    backgroundColor: "{colors.riso-yellow}"
    textColor: "{colors.ink}"
    height: "64px"
  tab:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.blue-deep}"
    height: "64px"
---

# Design System: Bolão da Mega

## Overview

**Creative North Star: "O Zine de Risografia da Firma"**

Cada tela é uma folha impressa em risografia: papel quase branco com grão, quatro tintas chapadas (rosa fluo, azul, amarelo e preto) e nenhuma luz, sombra ou vidro. A profundidade vem de passadas de tinta sobrepostas em multiply, com o registro levemente deslocado, e da falha irregular que a tinta deixa no papel. Votar é carimbar: tocar um número pousa um disco de tinta rosa sobre o algarismo azul.

A coluna é de celular (até 480px), densa e direta. Títulos de tela são cartazes ultracondensados que vão de borda a borda; dados são algarismos tabulares semicondensados; estruturas são fios azuis de 2px. O amarelo é reservado para a ação e para o estado ativo; o rosa, para seleção, voto e acúmulo. Recusa o app de loteria verde com bolinhas, gradientes e cards elevados.

**Key Characteristics:**
- Papel #fbfaf6 com ruído fixo em multiply sobre toda a tela.
- Quatro tintas chapadas; sobreposição em multiply é a única forma de "mistura".
- Títulos-cartaz em duas passadas (azul por baixo, rosa por cima, deslocado ~0.045em).
- Grades e contornos em fio azul de 2px; cantos discretos (2–6px).
- Retícula de meio-tom em 5 níveis fixos para intensidade, nunca degradê.
- Carimbo rosa com registro deslocado estável por número como interação assinatura.

## Colors

Quatro tintas de risografia sobre papel, cada uma com um papel fixo; nenhuma cor fora delas.

### Primary
- **Rosa Fluo Riso** (riso-pink): a tinta do voto. Carimbos de seleção no volante, chips de número, retículas do mapa de calor, passada superior dos títulos-cartaz, numerais de passos, badge de pendências, botão "stamp". Também o anel de foco e o cursor de texto. Em fundo leve (rosa a 15%) marca avisos de atenção com texto preto.

### Secondary
- **Azul Riso** (riso-blue): a tinta da estrutura. Fios de 2px de grades, faixas, campos, bordas de bilhete e divisórias; passada inferior (sombra de registro) dos títulos; barra de rolagem.
- **Azul Profundo** (blue-deep): o azul que carrega texto. Algarismos do volante, rótulos de seção, texto de botões contorno, faixas e abas inativas. Existe porque o azul riso puro não sustenta contraste em texto pequeno.

### Tertiary
- **Amarelo Riso** (riso-yellow): a tinta da ação. Botão primário e barra fixa, aba ativa, filtro ativo, cartão "você está no bolão", selo de pagamento aprovado, seleção de texto. Sempre com texto preto.

### Neutral
- **Papel** (paper): fundo de tudo, células do volante, barra de ação (a 95%).
- **Papel Fundo** (paper-deep): hover de células e linhas, caixas de nota recolhidas, estado desativado.
- **Tinta Preta** (ink): texto corrido, valores em display, botão "solid" de confirmação destrutiva, contorno do botão "danger".
- **Tinta Suave** (ink-soft): texto de apoio, dicas, legendas e eixos.

### Named Rules
**The Tinta Não Fala Baixo Rule.** Rosa e amarelo nunca carregam texto pequeno. Aparecem só como display, carimbo, bloco ou fundo; o texto sobre eles é preto (ink) ou azul profundo.

**The Uma Tinta, Um Papel Rule.** Amarelo é ação e estado ativo; rosa é voto, seleção e acúmulo; azul é estrutura e texto de dado; preto é leitura e decisão final. Não troque os papéis.

**The Multiply Rule.** Quando duas tintas se encontram, sobrepõem em `mix-blend-mode: multiply`, como a riso imprime; nunca uma cobre a outra opaca.

## Typography

**Display Font:** Anybody, eixo de largura variável (com Archivo de reserva)
**Body Font:** Archivo, eixo de largura variável (com ui-sans-serif, system-ui)

**Character:** Uma grotesca de cartaz espremida até o limite para os títulos, e a mesma família de texto puxada por largura (62/72/85/100) para dar a cada camada sua voz: display de valor, rótulo, dado, leitura. Todo número é tabular.

### Hierarchy
- **Poster XL** (Anybody 900, wdth 50, 15cqi com auto-ajuste até 2.2×, 0.84): só o título BOLÃO DA MEGA, de borda a borda, em duas passadas de tinta.
- **Poster** (Anybody 850, wdth 60, 12.5cqi ou 9cqi, 0.84, caixa-alta): títulos de tela (MEU BILHETE, PAGUE NO PIX, JOGOS); encolhe para caber numa linha, nunca quebra.
- **Display** (Archivo 900, wdth 62, 0.86, caixa-alta, -0.01em): valores e nomes grandes: total do Pix (24cqi), contador de cotas (26cqi), nome no bilhete (11cqi), numerais de passos (34px, rosa).
- **Label** (Archivo 800, wdth 72, 19px, caixa-alta, 0.01em, azul profundo): cabeçalhos de seção com contador opcional à direita; o mesmo corpo em 18px é o texto dos botões, em 16px os rótulos de campo e links de voltar, em 13px as abas.
- **Number** (Archivo 700, wdth 85, clamp(22px, 7.4cqi, 30px), tabular): algarismos do volante e do mapa de calor; 22px nas listas de jogos.
- **Body** (Archivo 400, 16–18px, leading-snug): texto corrido e explicações; textos de faixa em wdth 85 semibold 15–17px.
- **Small** (Archivo 600, wdth 85, 13–14px, ink-soft): legendas, eixos de custo, notas da barra de ação.

### Named Rules
**The Largura É Hierarquia Rule.** A hierarquia vem do eixo de largura e do peso, não de famílias extras: cartaz em wdth 50–60, display 62, rótulo 72, dado 85, leitura 100.

**The Algarismo Tabular Rule.** `font-variant-numeric: tabular-nums` no corpo inteiro; números sempre com dois dígitos (01–60).

## Layout

Coluna única de celular, com largura máxima de 480px e calha lateral de 16px (até 1023px, inclusive tablet). A tipografia de cartaz e de display escala por container query (`cqi`) da coluna, não pelo viewport. Seções se separam por 32px; blocos internos por 20–24px; pares rótulo/conteúdo por 8–12px. O topo respeita a safe area (mínimo 20px).

A ação principal de cada tela vive numa barra fixa no rodapé, sobre papel a 95%, com botões de altura 56px em largura total e nota opcional acima. No admin, uma barra de 5 abas (64px) fica fixa embaixo. O volante é uma grade 6×10 cujas linhas medem `clamp(44px, (100dvh − 410px)/10, 58px)`, para que a grade inteira caiba no primeiro viewport do celular junto do título e da faixa de status.

**Desktop (≥ 1024px): página dupla de zine.** Cada tela vira duas colunas (5fr / 7fr ou meio a meio, máx. 1280px, calha de 48px, espaço entre colunas `clamp(48px, 6vw, 96px)`). A coluna esquerda é a capa, fixa ao rolar (`sticky`): título, contexto e, por padrão, a ação principal, que deixa de ser barra fixa e vira bloco estático no fim da coluna. A coluna direita é o trabalho: volante, cotas, chave Pix, andamento, lista de jogos. Quando a ação conclui o que está à direita (inscrição, envio do comprovante), ela desce para o fim da coluna direita (`barIn="side"`). Cada coluna é seu próprio container (`cqi`), então títulos e números escalam pela coluna. No volante, as linhas medem `clamp(56px, (100dvh − 190px)/10, 84px)` e os algarismos chegam a 40px; a capa mostra os 6 números escolhidos em discos (vazios tracejados). Telas sem conteúdo lateral ficam numa coluna de 600px. A página dupla tem a altura da tela até 860px (acima disso para em 860px e fica centrada na vertical, com o título-cartaz limitado a um terço dessa altura; máx. 1280px de largura). Quando a peça ancorada e a ação estão na mesma coluna, a peça leva `data-anchor` e as duas descem juntas: as duas colunas dividem uma linha de cima (título, rótulos) e uma linha de baixo, onde sentam a peça principal da capa e a ação (`lg:mt-auto`): o pote e "Entrar" no Início, o canhoto e a ação no Bilhete, o valor do Pix de um lado e "Anexar comprovante" do outro. Início, Entrar, Bilhete e Pix dividem a folha meio a meio (`split="even"`); Volante e Resultado mantêm 5fr/7fr. Nessas capas o título-cartaz empilha em duas linhas (BOLÃO / DA MEGA, MEU / BILHETE) e cresce até a largura da coluna, limitado a um terço da altura da tela; no celular continua numa linha. O nome no canhoto quebra em até duas linhas, nunca corta.

**Área do Avá no desktop.** Trilho lateral fixo de 248px com fio azul à direita (a lombada do zine): título pequeno em duas tintas, "Área do Avá", navegação vertical e o link de volta para a página do bolão no pé. O conteúdo ocupa até 1180px em duas colunas (`even`, `wide-left` ou `wide-right`). Pagamentos viram lista + detalhe: a fila à esquerda (linha selecionada em amarelo) e o comprovante com as ações num painel fixo à direita; as setas ↑ ↓ andam pela fila e, ao aprovar, a seleção passa sozinha para o próximo.

## Elevation & Depth

Sistema plano, sem sombras. A profundidade é de impressão: passadas de tinta sobrepostas em multiply, registro deslocado (título azul 0.045em abaixo e à direita do rosa; carimbos com deslocamento de até ~2px e rotação de até 5°), a máscara de falhas de tinta (`.ink`) e o filtro `#riso-ink` (falhas mais borda levemente deformada) nos títulos. O grão do papel cobre a tela inteira em multiply a 32%.

### Named Rules
**The Sem Sombra Rule.** Nenhum `box-shadow`, nenhum blur de vidro como material. O deslocamento de registro entre duas tintas é a única "sombra" do sistema.

**The Retícula Fixa Rule.** Intensidade (mapa de calor, legenda) só em 5 retículas de meio-tom rosa fixas (pontos em grade de 6px, ~10/30/50/70% e chapado). Nunca degradê contínuo nem opacidade arbitrária.

## Shapes

Formas retas com cantos quase vivos. Faixas, campos, botões e bilhetes em 6px; molduras de grade (volante, mapa de calor, barra de custo) em 3px; marcadores pequenos e selos em 2–3px. O único círculo é a tinta: o carimbo, o chip de número e o badge de pendência são discos rosa com borda falhada. Contornos são sempre 2px; tracejado indica espaço vazio a preencher (upload de comprovante, contagem zero no mapa de calor).

## Components

### Buttons
Blocos de tinta chapada, caixa-alta condensada, firmes ao toque.
- **Shape:** cantos discretos (6px), altura mínima 48px (56px na barra de ação), padding horizontal 20px.
- **Primary:** bloco amarelo com texto preto, Label 18px. Desativado: amarelo a 45%.
- **Stamp:** bloco rosa com texto preto, para a saída comemorativa depois de confirmar o voto.
- **Outline:** fio azul de 2px, texto azul profundo; ação secundária e "cancelar".
- **Danger:** fio preto de 2px, texto preto, menor (44px, 15px), isolado; nunca preenchido até a confirmação.
- **Solid:** bloco preto com texto papel; a confirmação final de uma ação destrutiva ou irreversível.
- **Hover / Active:** contornos ganham a cor do fio a 5%; todos descem 1px ao pressionar (150ms). Foco: anel rosa de 3px com afastamento de 2px.

### Chips
- **NumberChip:** algarismo azul profundo semicondensado sobre um disco rosa carimbado (32/40px ou proporcional à coluna), o rosa em multiply por baixo do número.
- **Selo de pagamento:** caixa-alta condensada 14px, 3px de canto: aprovado em amarelo, em análise em fio azul, aguardando em fio preto a 40%, recusado em bloco preto.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** transparente sobre o papel; nada de superfícies elevadas.
- **Shadow Strategy:** nenhuma (ver Elevation & Depth).
- **Border:** fio azul de 2px (Strip, bilhete, chave Pix); divisórias internas em fio azul. Notas usam papel fundo ou rosa a 15% sem borda.
- **Internal Padding:** 12px × 10px nas faixas; 16px × 14px em linhas clicáveis e bilhetes.

### Upload de comprovante
Área tracejada em fio azul; no desktop aceita arrastar e soltar ("Clique ou arraste o arquivo aqui") e, durante o arraste, o fio fica rosa sobre amarelo a 30%.

### Inputs / Fields
- **Style:** fio azul de 2px, fundo transparente, 52px de altura, 6px de canto, texto 19px semibold wdth 85; rótulo Label 16px acima, dica 14px ink-soft abaixo.
- **Focus:** o fio vira rosa; cursor rosa.

### Navigation
- **Trilho do admin (desktop):** 248px, navegação vertical com itens de 48px (ícone 24px + rótulo 17px caixa-alta), ativo em bloco amarelo; selo de pendências alinhado à direita do item.
- **Abas do admin:** 5 colunas fixas no rodapé, fio azul de 2px no topo, 64px; ícone Phosphor bold 24px sobre rótulo 13px caixa-alta. Ativa: bloco amarelo, texto preto, ícone preenchido. Pendências: disco rosa carimbado no canto do ícone.
- **Voltar:** link condensado azul profundo com seta, caixa-alta 16px, sublinhado no hover.
- **Filtros segmentados:** grade em fio azul de 2px; segmento ativo em amarelo.

### Volante (assinatura)
Grade 6×10 com fios azuis de 2px (o fundo azul aparece entre células de papel). Algarismos azul profundo; tocar carimba um disco rosa (78% da célula) que entra em 260ms com ease-out-expo, crescendo de 1.35× com o registro deslocado e estável por número. Hover em papel fundo; pressão em amarelo a 40%. Só tinta nova anima: números que já estavam carimbados aparecem pousados em toda visita. Soltar um número faz a tinta recuar em 140ms (ease-in, escala 0.86); um 7º toque não carimba, e a célula e o contador "6/6" tremem 3px por 240ms.

**Fecho do voto (momento focal).** Ao confirmar, o bilhete abre e os 6 chips carimbam em sequência (220ms de espera, 90ms entre cada, 260ms cada); depois o visto rosa de "Seus 6 números" pousa. Acontece só na chegada vinda do volante (marca em sessionStorage); nas visitas seguintes o bilhete fica parado. Substitui o toast.

**Fila de Pix.** Decidir um Pix recolhe a linha (220ms, ease-in) e abre o próximo; o toast traz "Desfazer" por 6s. O detalhe da linha no celular cresce da altura zero em 300ms ease-out-expo, no tempo da seta.

### Mapa de Calor
A mesma grade do volante, com cada célula preenchida por uma das 5 retículas rosa; o algarismo fica sobre uma etiqueta de papel a 85% e a contagem num selo de 11px no canto (tracejado azul quando zero). Os números destacados ganham sublinhado de 3px.

### Barra de Custo
Moldura azul de 3px de canto com uma faixa por jogo, largura proporcional ao custo, alternando azul, rosa e amarelo com falhas de tinta. Onde dois jogos grandes (≥4% do total) se encontram, a faixa seguinte invade a anterior 7px e desce 1.5px: a sobreposição imprime a terceira cor.

### Ícone e imagem de compartilhamento
- **Favicon (`app/icon.svg`) e ícone do iPhone (`app/apple-icon.tsx`):** uma célula do volante carimbada: papel, fio azul e o disco rosa levemente fora de registro. Sem texto, legível em 16px.
- **Imagem de OG (`app/opengraph-image.tsx`, 1200×630):** o título-cartaz BOLÃO / DA MEGA em duas passadas (azul deslocado por baixo, rosa por cima) e o volante 1–60 inclinado −4°, sangrando pela borda, com os números carimbados no registro do app. Falhas de tinta são pontos cor de papel por cima de tudo, porque o gerador não tem máscara nem multiply. Fontes em TTF estático em `app/_og/` (Anybody 900 largura 50; Archivo 800 largura 72 e 600 largura 85).

## Do's and Don'ts

### Do:
- **Do** compor cada tela com as quatro tintas sobre papel #fbfaf6 e sobrepor em multiply.
- **Do** abrir as telas com título-cartaz InkTitle (azul por baixo, rosa por cima) cabendo numa linha.
- **Do** usar fio azul de 2px para toda estrutura: grades, faixas, campos, divisórias.
- **Do** colocar a ação principal num bloco amarelo de largura total na barra fixa do rodapé.
- **Do** marcar seleção e voto com carimbo rosa de registro deslocado, determinístico por número.
- **Do** representar intensidade só com as 5 retículas fixas.
- **Do** manter ações destrutivas em contorno preto, isoladas, e confirmar com o bloco preto.
- **Do** respeitar `prefers-reduced-motion`: carimbos aparecem sem animação.
- **Do** animar só o que acabou de acontecer: o carimbo nunca se repete por montagem de tela.

### Don't:
- **Don't** usar rosa ou amarelo para texto pequeno.
- **Don't** usar `box-shadow`, cards elevados, vidro ou brilho.
- **Don't** usar degradê contínuo ou opacidade livre para representar quantidade; os gradientes radiais das retículas são pontos de meio-tom, não rampas.
- **Don't** introduzir verde, bolinhas de loteria ou qualquer cor fora das quatro tintas.
- **Don't** arredondar além de 6px, exceto discos de tinta.
- **Don't** usar outra família tipográfica; varie a largura de Archivo e Anybody.
