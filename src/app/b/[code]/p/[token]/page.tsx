"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, LinkSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { NotFound } from "@/components/not-found";
import { PAYMENT_LABEL, useParticipant } from "@/components/participant";
import { ActionBar, BackLink, ButtonLink, cx, InkTitle, Label, Loading, NumberChip, Sheet } from "@/components/riso";
import { brlShort, dateTime, dayMonth, pad2, plural } from "@/lib/format";
import type { Participant } from "@/lib/types";

type Step = { done: boolean; title: string; detail: string; href?: string; action?: string; justStamped?: boolean };

// O fecho do voto: na chegada vinda do volante, os 6 números carimbam um a um e depois o passo ganha o visto.
const STAMP_LEAD = 220;
const STAMP_GAP = 90;
const CHECK_DELAY = STAMP_LEAD + 5 * STAMP_GAP + 200;

function readJustStamped(token: string) {
  try {
    return sessionStorage.getItem(`bolao:carimbo:${token}`) === "1";
  } catch {
    return false;
  }
}

function steps(p: Participant, base: string, token: string, editable: boolean, justStamped: boolean): Step[] {
  return [
    {
      done: p.payment !== "aguardando" && p.payment !== "recusado",
      title: "Pix e comprovante",
      detail:
        p.payment === "aguardando"
          ? "Falta pagar e mandar o comprovante."
          : p.payment === "recusado"
            ? "Comprovante recusado. Mande outro."
            : `Enviado em ${dateTime(p.receipt!.uploadedAt)}.`,
      href: `${base}/p/${token}/pagamento`,
      action: p.payment === "aguardando" || p.payment === "recusado" ? "Pagar" : "Ver",
    },
    {
      done: p.numbers.length === 6,
      title: "Seus 6 números",
      detail:
        p.numbers.length === 6
          ? `${justStamped ? "Carimbados agora. " : ""}${editable ? "Dá para trocar até fechar as inscrições." : "Números travados."}`
          : "Ainda não marcados.",
      justStamped: justStamped && p.numbers.length === 6,
      href: `${base}/p/${token}/volante`,
      action: p.numbers.length === 6 ? (editable ? "Trocar" : "Ver") : "Marcar",
    },
    {
      done: p.payment === "aprovado",
      title: "Confirmação do organizador",
      detail:
        p.payment === "aprovado"
          ? "Pagamento confirmado. Você está dentro."
          : p.payment === "em_analise"
            ? "Comprovante na fila de conferência."
            : "Acontece depois do comprovante.",
    },
  ];
}

export default function Bilhete() {
  const { token, snapshot, participant, base } = useParticipant();
  // Lido uma vez por chegada; a marca sai do sessionStorage para a próxima visita ficar parada.
  const [justStamped] = useState(() => typeof window !== "undefined" && readJustStamped(token));
  useEffect(() => {
    try {
      sessionStorage.removeItem(`bolao:carimbo:${token}`);
    } catch {}
  }, [token]);

  if (!snapshot) return <Loading />;
  if (!participant) return <NotFound />;

  const { edition } = snapshot;
  const editable = edition.status === "aberta";
  const list = steps(participant, base, token, editable, justStamped);
  const next = list.find((s) => !s.done && s.href);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link do bilhete copiado.");
    } catch {
      toast.error("Não deu para copiar. Copie o endereço da barra do navegador.");
    }
  }

  const bar =
    edition.status === "apostada" ? (
      <ButtonLink href={`${base}/resultado`}>
        Ver ranking e jogos <ArrowRight size={20} weight="bold" aria-hidden="true" />
      </ButtonLink>
    ) : next ? (
      <ButtonLink href={next.href!}>
        {next.title === "Seus 6 números" ? "Marcar meus números" : "Pagar e mandar comprovante"}
        <ArrowRight size={20} weight="bold" aria-hidden="true" />
      </ButtonLink>
    ) : null;

  return (
    <Sheet
      split="even"
      bar={bar ? <ActionBar>{bar}</ActionBar> : undefined}
      side={
        <>
          <section className="mt-8 lg:mt-0">
            <Label>Andamento</Label>
            <ol className="mt-2">
              {list.map((s) => (
                <li key={s.title} className="flex items-center gap-3 border-t border-blue/40 py-3 first:border-t-0">
                  <span
                    aria-hidden="true"
                    style={s.justStamped ? ({ "--delay": `${CHECK_DELAY}ms` } as React.CSSProperties) : undefined}
                    className={cx(
                      "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      !s.done && "border-2 border-blue/50",
                      s.justStamped && "stamp stamp-in",
                    )}
                  >
                    {s.done && (
                      <>
                        <span className="ink absolute inset-0 rounded-full bg-pink" />
                        <Check size={18} weight="bold" className="relative text-ink" />
                      </>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="condensed text-[18px] font-extrabold uppercase leading-tight text-ink">
                      {s.title}
                      <span className="sr-only">{s.done ? " (feito)" : " (pendente)"}</span>
                    </span>
                    <span className="text-[15px] leading-snug text-ink-soft">{s.detail}</span>
                  </span>
                  {s.href && s.action && (
                    <Link
                      href={s.href}
                      className="condensed min-h-11 shrink-0 content-center px-1 text-[16px] font-extrabold uppercase text-blue-deep underline underline-offset-4"
                    >
                      {s.action}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {participant.payment === "recusado" && participant.rejectReason && (
            <p className="mt-4 rounded-md bg-pink/15 px-3 py-2.5 text-[15px] leading-snug text-ink">
              <strong className="font-bold">Motivo da recusa:</strong> {participant.rejectReason}
            </p>
          )}

          <div className="lg:mt-auto lg:pt-10">
            <section className="mt-8 flex items-start gap-3 rounded-md bg-paper-deep px-4 py-3.5 lg:mt-0">
              <LinkSimple size={22} weight="bold" className="mt-0.5 shrink-0 text-blue-deep" aria-hidden="true" />
              <div className="flex flex-col gap-2">
                <p className="text-[15px] leading-snug text-ink">
                  Este link é o seu bilhete. Guarde para acompanhar, principalmente se trocar de celular.
                </p>
                <button
                  type="button"
                  onClick={copyLink}
                  className="condensed flex min-h-11 items-center gap-1.5 self-start text-[16px] font-extrabold uppercase text-blue-deep"
                >
                  <Copy size={18} weight="bold" aria-hidden="true" /> Copiar link
                </button>
              </div>
            </section>

            <p className="mt-6 text-[14px] text-ink-soft">
              Inscrição de {plural(participant.quotas, "cota", "cotas")} feita em {dateTime(participant.createdAt)}. Os números de todo mundo
              aparecem depois que as apostas forem registradas.
            </p>
          </div>
        </>
      }
    >
      <BackLink href={base}>Início</BackLink>
      {justStamped && participant.numbers.length === 6 && (
        <p role="status" className="sr-only">
          Números carimbados no seu bilhete.
        </p>
      )}
      <InkTitle size="lg" stack className="mt-3">
        {"MEU\nBILHETE"}
      </InkTitle>

      {/* O bilhete: um canhoto impresso, com picote. */}
      {/* No desktop o canhoto senta no pé da capa, logo acima da ação. */}
      <article data-anchor className="mt-6 rounded-md border-2 border-blue lg:mt-auto">
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div className="min-w-0">
            <p className="display line-clamp-2 text-[11cqi] [overflow-wrap:anywhere] text-ink">{participant.name}</p>
          </div>
          <span
            className={cx(
              "condensed shrink-0 rounded-[3px] px-2 py-1 text-[14px] font-extrabold uppercase",
              participant.payment === "aprovado" && "bg-yellow text-ink",
              participant.payment === "em_analise" && "border-2 border-blue text-blue-deep",
              participant.payment === "aguardando" && "border-2 border-ink/40 text-ink-soft",
              participant.payment === "recusado" && "bg-ink text-paper",
            )}
          >
            {PAYMENT_LABEL[participant.payment]}
          </span>
        </div>
        <dl className="semi mt-4 grid grid-cols-3 gap-px border-y-2 border-blue bg-blue/50">
          {[
            ["Cotas", pad2(participant.quotas)],
            ["Valor", brlShort(participant.quotas * edition.quotaPrice)],
            ["Sorteio", dayMonth(edition.drawDate)],
          ].map(([k, v]) => (
            <div key={k} className="bg-paper px-3 py-2.5">
              <dt className="condensed text-[13px] font-extrabold uppercase text-blue-deep">{k}</dt>
              <dd className="text-[20px] font-bold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="relative px-4 py-4">
          {participant.numbers.length === 6 ? (
            <div className="flex flex-wrap justify-between gap-1">
              {participant.numbers.map((n, i) => (
                <NumberChip key={n} n={n} size="lg" fresh={justStamped} delay={STAMP_LEAD + i * STAMP_GAP} />
              ))}
            </div>
          ) : (
            <Link href={`${base}/p/${token}/volante`} className="semi block text-[17px] font-bold text-blue-deep underline underline-offset-4">
              Marque seus 6 números
            </Link>
          )}
        </div>
      </article>
    </Sheet>
  );
}
