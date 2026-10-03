# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js + Supabase (banco, storage dos comprovantes, auth só do admin), deploy na Vercel. Mesma base dos outros projetos do Avá (ava.cheap, refs.avaaraujo.com).

## Users

- **Participantes:** colegas de trabalho de uma agência/estúdio criativo (design, publicidade, tecnologia), clima descontraído. Entram uma vez por ano, quase sempre pelo celular, a partir de um link mandado no grupo. Tarefa: entrar no bolão, pagar via Pix, mandar o comprovante, escolher 6 números e acompanhar o status.
- **Admin (o Avá, organizador do bolão e único usuário com login):** valida os pagamentos, vê o ranking dos números, calcula e monta os jogos, registra as apostas e publica o resultado. Também usa principalmente no celular.

## Product Purpose

Substituir o processo manual (Pix + comprovante por mensagem + planilha) do bolão da Mega da Virada que o Avá faz todo fim de ano. Sucesso significa todo mundo entrar e pagar sem atrito, o Avá validar tudo num lugar só, e os jogos saírem montados corretamente pelas regras do bolão.

## Positioning

Não é um bolão genérico: os jogos são montados pelo voto coletivo do grupo. Os números mais escolhidos alimentam, em sequência, jogos cada vez menores, com o maior jogo possível primeiro, até zerar o caixa.

## Operating Context

- Inscrições abrem só em dezembro; o sorteio é a Mega da Virada (31/12).
- Pagamento por Pix para a conta pessoal do Avá; o participante envia o comprovante (imagem/PDF).
- As apostas são registradas pelo Avá na lotérica ou no app da Caixa.
- Uso por edição anual (2026, 2027…).

## Capabilities and Constraints

- Cota = R$ 60; cada pessoa compra quantas quiser.
- Cada pessoa escolhe 6 números (1–60) uma vez só. **O voto não pesa pelas cotas.**
- Ranking: do mais ao menos escolhido; empate → fica na frente o número escolhido primeiro (por ordem de envio).
- Custo de um jogo de n números = C(n,6) × R$ 6 (configurável). Distribuição gulosa: o maior jogo que cabe no valor restante, repetido até zerar (como R$ 60 = 10 jogos simples, sempre zera).
- Montagem: os jogos consomem o ranking **em sequência, sem repetir**; se o ranking acabar, volta ao começo.
- Participantes **não veem** os números dos outros nem o ranking até as apostas serem feitas.
- Visão mobile é prioridade em toda a plataforma (participante e admin).
- Em aberto (fases futuras): QR Code Pix com valor, página pública de transparência, conferência do resultado e divisão do prêmio, leitura dos comprovantes pelo Claude.

## Brand Commitments

Nome: **Bolão da Mega**. O organizador é o Avá (apelido); nos textos, sempre "o Avá", nunca "a organizadora". Nenhum logo ou identidade existente.

## Evidence on Hand

Nenhum dado real ainda. Exemplo de referência do próprio Avá: 102 cotas → R$ 6.120 → jogo de 12 (R$ 5.544) + jogo de 9 (R$ 504) + jogo de 7 (R$ 42) + 5 jogos de 6 (R$ 30). Nomes de participantes em mocks devem ser sintéticos.

## Product Principles

1. Confiança acima de tudo: dinheiro de colegas, então cada regra e cada número têm que ser verificáveis.
2. Zero atrito no celular: entrar, pagar e escolher os números em poucos toques.
3. O voto do grupo é o coração do bolão: o ranking e a montagem dos jogos são o momento central.
4. O Avá decide, a plataforma calcula: automatizar as contas sem tirar dele a palavra final.
