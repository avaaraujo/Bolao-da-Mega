"use client";

import { useState } from "react";
import { CaretDown, FilePdf, ImageBroken } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AdminSheet } from "@/components/admin";
import { useBolao } from "@/components/bolao-provider";
import { Button, cx } from "@/components/riso";
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

  return (
    <AdminSheet title="PAGAMENTOS">
      <div role="tablist" aria-label="Filtrar pagamentos" className="mt-4 grid grid-cols-4 overflow-hidden rounded-md border-2 border-blue">
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
        <ul className="mt-3">
          {list.map((p) => (
            <PaymentRow
              key={p.id}
              p={p}
              quotaPrice={edition.quotaPrice}
              open={open === p.id}
              onToggle={() => setOpen((cur) => (cur === p.id ? null : p.id))}
            />
          ))}
        </ul>
      )}
    </AdminSheet>
  );
}

function PaymentRow({ p, quotaPrice, open, onToggle }: { p: Participant; quotaPrice: number; open: boolean; onToggle: () => void }) {
  const { ds } = useBolao();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function set(status: PaymentStatus) {
    setBusy(true);
    try {
      await ds.setPayment(p.id, status, reason);
      toast.success(status === "aprovado" ? `${p.name}: Pix aprovado.` : status === "recusado" ? `${p.name}: Pix recusado.` : "Status atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu para salvar.");
    } finally {
      setBusy(false);
      setRejecting(false);
      setReason("");
    }
  }

  return (
    <li className="border-t border-blue/40 first:border-t-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-16 w-full items-center gap-3 py-2.5 text-left"
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
        <CaretDown size={20} weight="bold" aria-hidden="true" className={cx("shrink-0 text-blue-deep transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="flex flex-col gap-4 pb-5">
          <Receipt p={p} />
          <p className="semi text-[16px] text-ink-soft">
            Números:{" "}
            <span className="font-bold text-blue-deep">{p.numbers.length ? p.numbers.map(pad2).join(" ") : "ainda não marcou"}</span>
            {p.contact && (
              <>
                {" "}· Contato: <span className="font-bold text-ink">{p.contact}</span>
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
                <Button variant="danger" className="self-start min-h-11 text-[15px]" onClick={() => setRejecting(true)}>
                  {p.payment === "aprovado" ? "Desfazer e recusar" : "Recusar"}
                </Button>
              )}
            </div>
          )}

          {!p.receipt && <p className="text-[15px] text-ink-soft">Ainda não mandou comprovante.</p>}
        </div>
      )}
    </li>
  );
}

function Receipt({ p }: { p: Participant }) {
  const r = p.receipt;
  if (!r) return null;
  if (r.dataUrl && r.type.startsWith("image")) {
    return (
      <a href={r.dataUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border-2 border-blue">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={r.dataUrl} alt={`Comprovante de ${p.name}`} className="max-h-[42dvh] w-full bg-paper-deep object-contain" />
      </a>
    );
  }
  if (r.dataUrl) {
    return (
      <a
        href={r.dataUrl}
        download={r.name}
        className="flex items-center gap-3 rounded-md border-2 border-blue px-4 py-3 text-blue-deep"
      >
        <FilePdf size={28} weight="bold" aria-hidden="true" />
        <span className="semi text-[17px] font-bold underline underline-offset-4">Abrir {r.name}</span>
      </a>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-md bg-paper-deep px-4 py-3 text-ink-soft">
      <ImageBroken size={26} weight="bold" aria-hidden="true" />
      <span className="text-[15px] leading-snug">
        {r.name} · imagem de exemplo do modo demo (sem arquivo real)
      </span>
    </div>
  );
}
