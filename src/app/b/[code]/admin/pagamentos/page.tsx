"use client";

import { useEffect, useState } from "react";
import { CaretDown, FilePdf, ImageBroken } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AdminSheet } from "@/components/admin";
import { useBolao } from "@/components/bolao-provider";
import { Button, collapse, cx, useReveal } from "@/components/riso";
import { brlShort, dateTime, pad2, plural } from "@/lib/format";
import type { Participant, PaymentStatus } from "@/lib/types";

const FILTERS: { id: PaymentStatus; label: string }[] = [
  { id: "em_analise", label: "Conferir" },
  { id: "aguardando", label: "Sem Pix" },
  { id: "aprovado", label: "Aprovados" },
  { id: "recusado", label: "Recusados" },
];

export default function Pagamentos() {
  const { snapshot } = useBolao();
  const [filter, setFilter] = useState<PaymentStatus>("em_analise");
  const [open, setOpen] = useState<string | null>(null);
  if (!snapshot) return null;

  const { participants, edition } = snapshot;
  const list = participants
    .filter((p) => p.payment === filter)
    .sort((a, b) => (a.receipt?.uploadedAt ?? a.createdAt).localeCompare(b.receipt?.uploadedAt ?? b.createdAt));
  // No desktop sempre há um selecionado. Ao decidir um Pix ele sai deste filtro,
  // então a fila anda sozinha para o próximo (no celular, o próximo já abre).
  const selected = list.find((p) => p.id === open) ?? list[0] ?? null;
  function advance(id: string) {
    const i = list.findIndex((p) => p.id === id);
    setOpen((list[i + 1] ?? list[i - 1])?.id ?? null);
  }

  return (
    <AdminSheet
      title="PAGAMENTOS"
      split="wide-right"
      stickySide
      side={
        <div className="hidden lg:block">
          {selected ? (
            <div className="rounded-md border-2 border-blue p-6">
              <div className="mb-5 flex items-baseline justify-between gap-4 border-b-2 border-blue pb-4">
                <div className="min-w-0">
                  <p className="display truncate text-[44px] text-ink">{selected.name}</p>
                  <p className="text-[15px] text-ink-soft">
                    {selected.receipt
                      ? `Comprovante ${dateTime(selected.receipt.uploadedAt)}`
                      : `Inscrição ${dateTime(selected.createdAt)}`}
                  </p>
                </div>
                <p className="semi shrink-0 text-right">
                  <span className="block text-[28px] font-bold tabular-nums text-ink">
                    {brlShort(selected.quotas * edition.quotaPrice)}
                  </span>
                  <span className="text-[15px] text-ink-soft">{plural(selected.quotas, "cota", "cotas")}</span>
                </p>
              </div>
              <PaymentDetail key={selected.id} p={selected} quotaPrice={edition.quotaPrice} onDecided={advance} />
            </div>
          ) : (
            <p className="text-[17px] text-ink-soft">Nada para mostrar neste filtro.</p>
          )}
        </div>
      }
    >
      <KeyboardQueue list={list} selectedId={selected?.id ?? null} onSelect={setOpen} />
      <div
        role="tablist"
        aria-label="Filtrar pagamentos"
        className="mt-4 grid grid-cols-4 lg:mt-0 overflow-hidden rounded-md border-2 border-blue"
      >
        {FILTERS.map((f) => {
          const n = participants.filter((p) => p.payment === f.id).length;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setFilter(f.id);
                setOpen(null);
              }}
              className={cx(
                "condensed flex min-h-14 flex-col items-center justify-center border-l-2 border-blue text-[14px] font-extrabold uppercase leading-tight first:border-l-0",
                active ? "bg-yellow text-ink" : "text-blue-deep hover:bg-paper-deep",
              )}
            >
              {f.label}
              <span className="text-[18px] tabular-nums">{n}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="mt-10 text-center text-[17px] text-ink-soft">
          {filter === "em_analise" ? "Nenhum comprovante esperando. Tudo em dia." : "Ninguém aqui."}
        </p>
      ) : (
        <>
          <ul className="mt-3">
            {list.map((p) => (
              <PaymentRow
                key={p.id}
                p={p}
                quotaPrice={edition.quotaPrice}
                open={open === p.id}
                selected={selected?.id === p.id}
                onDecided={advance}
                onToggle={() => setOpen((cur) => (cur === p.id && !isDesktop() ? null : p.id))}
              />
            ))}
          </ul>
          <p className="mt-4 hidden text-[14px] text-ink-soft lg:block">
            Dica: use as setas <kbd className="semi rounded border border-blue/50 px-1.5 font-bold">↑</kbd>{" "}
            <kbd className="semi rounded border border-blue/50 px-1.5 font-bold">↓</kbd> do teclado para andar pela fila.
          </p>
        </>
      )}
    </AdminSheet>
  );
}

function isDesktop() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
}

/** Setas para cima e para baixo andam pela fila no desktop (fora de campos de texto). */
function KeyboardQueue({ list, selectedId, onSelect }: { list: Participant[]; selectedId: string | null; onSelect: (id: string) => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isDesktop() || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
      if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
      const i = list.findIndex((p) => p.id === selectedId);
      const next = list[Math.min(list.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)))];
      if (next) {
        e.preventDefault();
        onSelect(next.id);
        document.getElementById(`pix-${next.id}`)?.scrollIntoView({ block: "nearest" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [list, selectedId, onSelect]);
  return null;
}

function PaymentRow({
  p,
  quotaPrice,
  open,
  selected,
  onDecided,
  onToggle,
}: {
  p: Participant;
  quotaPrice: number;
  open: boolean;
  selected: boolean;
  onDecided: (id: string) => void;
  onToggle: () => void;
}) {
  return (
    <li id={`pix-${p.id}`} className="border-t border-blue/40 first:border-t-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-current={selected ? "true" : undefined}
        className={cx(
          "flex min-h-16 w-full items-center gap-3 py-2.5 text-left lg:rounded-md lg:px-3 lg:hover:bg-paper-deep",
          selected && "lg:bg-yellow lg:hover:bg-yellow",
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="semi truncate text-[18px] font-bold text-ink">{p.name}</span>
          <span className="text-[14px] text-ink-soft">
            {p.receipt ? `Comprovante ${dateTime(p.receipt.uploadedAt)}` : `Inscrição ${dateTime(p.createdAt)}`}
          </span>
        </span>
        <span className="semi flex flex-col items-end">
          <span className="text-[19px] font-bold tabular-nums text-ink">{brlShort(p.quotas * quotaPrice)}</span>
          <span className="text-[14px] text-ink-soft">{plural(p.quotas, "cota", "cotas")}</span>
        </span>
        <CaretDown
          size={20}
          weight="bold"
          aria-hidden="true"
          className={cx("shrink-0 text-blue-deep transition-transform duration-300 ease-out-expo lg:hidden", open && "rotate-180")}
        />
      </button>

      {open && <RowDetail p={p} quotaPrice={quotaPrice} onDecided={onDecided} />}
    </li>
  );
}

/** O detalhe aberto dentro da linha, no celular: cresce no lugar, no mesmo tempo da seta. */
function RowDetail({ p, quotaPrice, onDecided }: { p: Participant; quotaPrice: number; onDecided: (id: string) => void }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="lg:hidden">
      <div className="pb-5">
        <PaymentDetail p={p} quotaPrice={quotaPrice} onDecided={onDecided} />
      </div>
    </div>
  );
}

const DONE: Partial<Record<PaymentStatus, string>> = {
  aprovado: "Pix aprovado",
  recusado: "Pix recusado",
  em_analise: "de volta para conferir",
};

function PaymentDetail({ p, quotaPrice, onDecided }: { p: Participant; quotaPrice: number; onDecided: (id: string) => void }) {
  const { ds } = useBolao();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function set(status: PaymentStatus) {
    setBusy(true);
    const before = { status: p.payment, reason: p.rejectReason ?? undefined };
    // A linha sai da fila antes de sumir dos dados; se salvar falhar, ela volta.
    const restore = await collapse(document.getElementById(`pix-${p.id}`));
    try {
      await ds.setPayment(p.id, status, reason);
      onDecided(p.id);
      toast.success(`${p.name}: ${DONE[status] ?? "status atualizado"}.`, {
        duration: 6000,
        action: {
          label: "Desfazer",
          onClick: () => {
            ds.setPayment(p.id, before.status, before.reason).catch(() => toast.error("Não deu para desfazer. Mude o status na lista."));
          },
        },
      });
    } catch (err) {
      restore();
      toast.error(err instanceof Error ? err.message : "Não deu para salvar.");
    } finally {
      setBusy(false);
      setRejecting(false);
      setReason("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Receipt p={p} />
      <p className="semi text-[16px] text-ink-soft">
        Números: <span className="font-bold text-blue-deep">{p.numbers.length ? p.numbers.map(pad2).join(" ") : "ainda não marcou"}</span>
        {p.contact && (
          <>
            {" "}
            · Contato: <span className="font-bold text-ink">{p.contact}</span>
          </>
        )}
      </p>
      {p.payment === "recusado" && p.rejectReason && (
        <p className="text-[15px] text-ink">
          <strong>Motivo:</strong> {p.rejectReason}
        </p>
      )}

      {p.payment !== "aprovado" && p.receipt && !rejecting && (
        <Button className="min-h-14" onClick={() => set("aprovado")} disabled={busy}>
          Aprovar {brlShort(p.quotas * quotaPrice)}
        </Button>
      )}

      {/* Corrigir uma decisão não pede motivo: o Pix só volta para a fila de conferência. */}
      {(p.payment === "aprovado" || p.payment === "recusado") && p.receipt && !rejecting && (
        <Button variant="outline" onClick={() => set("em_analise")} disabled={busy}>
          Voltar para conferir
        </Button>
      )}

      {/* Recusar fica isolado, só em contorno, e pede confirmação com motivo. */}
      {p.payment !== "recusado" && p.receipt && (
        <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-ink/30 pt-4">
          {rejecting ? (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="condensed text-[15px] font-extrabold uppercase text-ink">Motivo (a pessoa vai ver)</span>
                <input
                  autoFocus
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex.: valor diferente das cotas"
                  className="h-12 rounded-md border-2 border-ink bg-transparent px-3 text-[17px] focus:border-pink focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setRejecting(false)}>
                  Cancelar
                </Button>
                <Button variant="solid" onClick={() => set("recusado")} disabled={busy || !reason.trim()}>
                  Confirmar recusa
                </Button>
              </div>
            </>
          ) : (
            <Button variant="danger" className="min-h-11 self-start text-[15px]" onClick={() => setRejecting(true)}>
              Recusar
            </Button>
          )}
        </div>
      )}

      {!p.receipt && <p className="text-[15px] text-ink-soft">Ainda não mandou comprovante.</p>}
    </div>
  );
}

function Receipt({ p }: { p: Participant }) {
  const r = p.receipt;
  if (!r) return null;
  if (r.dataUrl && r.type.startsWith("image")) {
    return (
      <a href={r.dataUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border-2 border-blue">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={r.dataUrl}
          alt={`Comprovante de ${p.name}`}
          className="max-h-[42dvh] w-full bg-paper-deep object-contain lg:max-h-[52dvh]"
        />
      </a>
    );
  }
  if (r.dataUrl) {
    return (
      <a href={r.dataUrl} download={r.name} className="flex items-center gap-3 rounded-md border-2 border-blue px-4 py-3 text-blue-deep">
        <FilePdf size={28} weight="bold" aria-hidden="true" />
        <span className="semi text-[17px] font-bold underline underline-offset-4">Abrir {r.name}</span>
      </a>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-md bg-paper-deep px-4 py-3 text-ink-soft">
      <ImageBroken size={26} weight="bold" aria-hidden="true" />
      <span className="text-[15px] leading-snug">{r.name} · imagem de exemplo do modo demo (sem arquivo real)</span>
    </div>
  );
}
