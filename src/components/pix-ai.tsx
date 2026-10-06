"use client";

import { useRef } from "react";
import { Check, FilePdf, Sparkle, Warning, X } from "@phosphor-icons/react";
import { cx, Label } from "./riso";
import { gsap, MOTION_OK, splash, useGSAP } from "./motion";
import { brl, dateTime } from "@/lib/format";
import { parseBrasilia, type AiCheck, type AiCheckRecord, type AiVerdict, type CheckStatus } from "@/lib/pix-check";
import type { Receipt } from "@/lib/types";

const READING = ["Lendo o valor…", "Conferindo quem recebeu…", "Checando data e hora…", "Procurando sinais de edição…", "Comparando com os outros Pix…"];

/** O comprovante passando pelo leitor: faixa de retícula rosa varre a folha, marcas de corte nos cantos. */
export function ReceiptScanner({ receipt, reading = true, children }: { receipt: Receipt; reading?: boolean; children?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!reading) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo("[data-scan]", { yPercent: -110 }, { yPercent: 560, duration: 1.5, ease: "sine.inOut", repeat: -1, yoyo: true });
        gsap.to("[data-crop]", { scale: 0.86, duration: 0.6, ease: "sine.inOut", repeat: -1, yoyo: true, stagger: 0.15 });
        // As frases trocam como tipos móveis: a antiga sobe, a nova chega por baixo.
        const line = ref.current?.querySelector<HTMLElement>("[data-reading]");
        if (line) {
          let i = 0;
          const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.1 });
          tl.to(line, { yPercent: -100, opacity: 0, duration: 0.25, ease: "power2.in" })
            .call(() => {
              i = (i + 1) % READING.length;
              line.textContent = READING[i];
            })
            .fromTo(line, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: "back.out(2)" });
        }
      });
    },
    { scope: ref },
  );

  const isImage = receipt.dataUrl && receipt.type.startsWith("image");
  return (
    <div ref={ref} className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-md border-2 border-blue bg-paper-deep">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={receipt.dataUrl!} alt="Seu comprovante" className="max-h-[46dvh] w-full object-contain" />
        ) : (
          <div className="flex h-56 items-center justify-center text-blue-deep">
            <FilePdf size={64} weight="bold" aria-hidden="true" />
          </div>
        )}
        {reading && (
        <span
          data-scan
          aria-hidden="true"
          className="screen-3 ink pointer-events-none absolute inset-x-0 top-0 h-[18%] opacity-70 [mask-image:linear-gradient(transparent,black_45%,black_55%,transparent)]"
        />
        )}
        {(["top-2 left-2 border-t-[3px] border-l-[3px]", "top-2 right-2 border-t-[3px] border-r-[3px]", "bottom-2 left-2 border-b-[3px] border-l-[3px]", "bottom-2 right-2 border-b-[3px] border-r-[3px]"] as const).map((c) => (
          <span key={c} data-crop aria-hidden="true" className={cx("absolute h-6 w-6 border-blue", c)} />
        ))}
        {children}
      </div>
      {reading && (
        <>
          <p role="status" className="sr-only">
            Conferindo seu comprovante.
          </p>
          <div aria-hidden="true" className="h-7 overflow-hidden">
            <p data-reading className="condensed flex items-center gap-2 text-[19px] font-extrabold uppercase text-blue-deep">
              {READING[0]}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

const STAMP: Record<AiVerdict, { text: string; cls: string; ink: string }> = {
  aprovado: { text: "Pix confirmado", cls: "bg-yellow text-ink", ink: "var(--color-yellow)" },
  recusado: { text: "Recusado", cls: "bg-ink text-paper", ink: "var(--color-ink)" },
  manual: { text: "Em análise", cls: "border-[5px] border-blue bg-paper/80 text-blue-deep", ink: "var(--color-blue)" },
};

/** O carimbo do veredito: cai do alto, bate no papel, a folha treme e a tinta respinga. */
export function VerdictStamp({ verdict, className }: { verdict: AiVerdict; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const s = STAMP[verdict];
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const sheet = el.closest("[data-sheet-shake]");
        const tl = gsap
          .timeline({ delay: 0.1 })
          .from(el, { scale: 3.2, rotate: -28, opacity: 0, duration: 0.42, ease: "power4.in" })
          .add(() => splash(el, s.ink));
        if (sheet) tl.to(sheet, { keyframes: { x: [0, -7, 6, -4, 2, 0] }, duration: 0.4, ease: "none", clearProps: "transform" }, "<");
      });
    },
    { dependencies: [verdict] },
  );
  return (
    <span
      ref={ref}
      className={cx(
        "display ink pointer-events-none inline-block -rotate-6 rounded-[4px] px-4 py-2 text-[11cqi] leading-none whitespace-nowrap shadow-[0_0_0_3px_var(--color-paper)]",
        s.cls,
        className,
      )}
    >
      {s.text}
    </span>
  );
}

const STATUS_ICON: Record<CheckStatus, { icon: typeof Check; cls: string; label: string }> = {
  ok: { icon: Check, cls: "bg-pink text-ink", label: "ok" },
  alerta: { icon: Warning, cls: "bg-yellow text-ink", label: "atenção" },
  erro: { icon: X, cls: "bg-ink text-paper", label: "problema" },
};

const VERDICT_CHIP: Record<AiVerdict, { text: string; cls: string }> = {
  aprovado: { text: "IA aprovou", cls: "bg-yellow text-ink" },
  recusado: { text: "IA recusou", cls: "bg-ink text-paper" },
  manual: { text: "IA pede seu olho", cls: "border-2 border-blue text-blue-deep" },
};

/** Marquinha da IA na linha da fila de Pix. */
export function AiTag({ check }: { check: AiCheckRecord | null | undefined }) {
  if (!check) return null;
  if (check.state === "running") {
    return <span className="condensed ml-2 inline-flex items-center gap-1 text-[13px] font-extrabold uppercase text-blue-deep motion-safe:animate-pulse">· IA lendo</span>;
  }
  const t = { aprovado: "· IA ok", recusado: "· IA recusou", manual: "· IA: conferir" }[check.verdict];
  return <span className="condensed ml-2 text-[13px] font-extrabold uppercase text-blue-deep">{t}</span>;
}

/** Relatório da IA no detalhe do Pix: veredito, checklist e o que foi lido. */
export function AiReport({
  check,
  running,
  enabled,
  onRun,
}: {
  check: AiCheckRecord | null | undefined;
  running: boolean;
  enabled: boolean;
  onRun: (force: boolean) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const done = check?.state === "done" ? (check as AiCheck) : null;
  useGSAP(
    () => {
      if (!done) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline()
          .from("[data-chip]", { scale: 1.8, rotate: -10, opacity: 0, duration: 0.45, ease: "back.out(2.4)", clearProps: "transform,opacity" })
          .from("[data-item]", { x: -12, opacity: 0, duration: 0.35, stagger: 0.06, ease: "power3.out", clearProps: "transform,opacity" }, "-=0.2")
          .from("[data-item-icon]", { scale: 0, rotate: -90, duration: 0.4, stagger: 0.06, ease: "back.out(3)", clearProps: "transform" }, "<");
      });
    },
    { scope: ref, dependencies: [done?.checkedAt] },
  );

  const busy = running || check?.state === "running";
  if (!enabled && !done) return null;

  return (
    <section ref={ref} className="rounded-md border-2 border-dashed border-blue/70 p-4" aria-busy={busy}>
      <div className="flex items-center justify-between gap-3">
        <Label>
          <span className="inline-flex items-center gap-1.5">
            <Sparkle size={18} weight="fill" aria-hidden="true" /> Leitura da IA
          </span>
        </Label>
        {done && !busy && (
          <span data-chip className={cx("condensed inline-block shrink-0 rounded-[3px] px-2 py-1 text-[14px] font-extrabold uppercase", VERDICT_CHIP[done.verdict].cls)}>
            {VERDICT_CHIP[done.verdict].text}
          </span>
        )}
      </div>

      {busy ? (
        <p className="semi mt-3 text-[16px] font-semibold text-ink-soft motion-safe:animate-pulse">A IA está lendo o comprovante…</p>
      ) : done ? (
        <>
          <p className="mt-2 text-[16px] leading-snug text-ink">{done.summary}</p>
          {done.items.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {done.items.map((it) => {
                const s = STATUS_ICON[it.status];
                const Icon = s.icon;
                return (
                  <li key={it.id} data-item className="flex items-start gap-2.5">
                    <span data-item-icon className={cx("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", s.cls)}>
                      <Icon size={14} weight="bold" aria-hidden="true" />
                      <span className="sr-only">{s.label}</span>
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="condensed text-[15px] font-extrabold uppercase leading-tight text-ink">{it.label}</span>
                      <span className="text-[14px] leading-snug text-ink-soft">{it.detail}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {done.extracted && <Extracted x={done.extracted} />}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] text-ink-soft">Lido em {dateTime(done.checkedAt)}</span>
            {enabled && (
              <button type="button" onClick={() => onRun(true)} className="condensed min-h-11 text-[15px] font-extrabold uppercase text-blue-deep underline underline-offset-4">
                Ler de novo
              </button>
            )}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => onRun(false)}
          className="condensed mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border-2 border-blue px-4 text-[16px] font-extrabold uppercase text-blue-deep hover:bg-paper-deep"
        >
          <Sparkle size={18} weight="fill" aria-hidden="true" /> Conferir com IA
        </button>
      )}
    </section>
  );
}

function Extracted({ x }: { x: NonNullable<AiCheck["extracted"]> }) {
  const paid = parseBrasilia(x.paidAt);
  const rows: [string, string | null][] = [
    ["Valor", x.amountCents === null ? null : brl(x.amountCents / 100)],
    ["Quando", paid ? dateTime(paid.toISOString()) : x.paidAt],
    ["Para", [x.recipientName, x.recipientKey].filter(Boolean).join(" · ") || null],
    ["Banco", x.recipientInstitution],
    ["De", x.payerName],
    ["ID", x.transactionId],
  ];
  return (
    <dl className="semi mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-blue/30 pt-3 text-[14px]">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="condensed font-extrabold uppercase text-blue-deep">{k}</dt>
            <dd className="min-w-0 font-semibold [overflow-wrap:anywhere] text-ink">{v}</dd>
          </div>
        ))}
    </dl>
  );
}
