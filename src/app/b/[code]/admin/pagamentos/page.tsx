"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CaretDown, FilePdf, ImageBroken } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AdminSheet } from "@/components/admin";
import { useAdminUser, useBolao } from "@/components/bolao-provider";
import { gsap, reduced } from "@/components/motion";
import { AiReport, AiTag } from "@/components/pix-ai";
import { Button, collapse, cx, useReveal } from "@/components/riso";
import { brlShort, dateTime, pad2, plural } from "@/lib/format";
import { isLate, reminderText, reminderUrl } from "@/lib/cobranca";
import type { Participant, PaymentStatus } from "@/lib/types";

const FILTERS: { id: PaymentStatus; label: string }[] = [
  { id: "em_analise", label: "Conferir" },
  { id: "aguardando", label: "Sem Pix" },
  { id: "aprovado", label: "Aprovados" },
  { id: "recusado", label: "Recusados" },
];

type Ai = { enabled: boolean; running: ReadonlySet<string>; run: (id: string, force?: boolean) => void };
const AiContext = createContext<Ai>({ enabled: false, running: new Set(), run: () => {} });

/**
 * Conferência por IA na fila de Pix. Só aparece para organizadores liberados (tabela ai_reviewers).
 * Comprovantes "em análise" ainda sem leitura são lidos sozinhos, um por vez, ao abrir a tela:
 * cobre quem mandou o Pix e fechou o celular antes de a IA terminar.
 */
function useAiQueue(participants: Participant[]): Ai {
  const { ds } = useBolao();
  const { user, platform } = useAdminUser();
  const [enabled, setEnabled] = useState(false);
  const [running, setRunning] = useState<ReadonlySet<string>>(new Set());
  const tried = useRef(new Set<string>());
  const stopped = useRef(false);

  useEffect(() => {
    if (!user || !platform.aiReviewEnabled || !ds.recheckReceipt) return;
    let alive = true;
    platform
      .aiReviewEnabled()
      .then((on) => alive && setEnabled(on))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user, platform, ds]);

  const run = useCallback(
    (id: string, force = false) => {
      if (!ds.recheckReceipt) return;
      setRunning((r) => new Set(r).add(id));
      ds.recheckReceipt(id, force)
        .then((res) => {
          // Sem chave no servidor ou IA fora do ar: para a fila automática e avisa uma vez.
          if (res.status === "error" || (res.status === "skipped" && res.reason === "not_configured")) {
            stopped.current = true;
            toast.error(
              res.status === "error" ? `Conferência por IA: ${res.message}` : "Conferência por IA sem chave configurada no servidor.",
              { id: "ia-erro" },
            );
          }
        })
        .finally(() =>
          setRunning((r) => {
            const next = new Set(r);
            next.delete(id);
            return next;
          }),
        );
    },
    [ds],
  );

  useEffect(() => {
    if (!enabled || stopped.current || running.size > 0) return;
    const next = participants.find((p) => p.payment === "em_analise" && p.receipt && !p.aiCheck && !tried.current.has(p.id));
    if (!next) return;
    tried.current.add(next.id);
    run(next.id);
  }, [enabled, participants, running, run]);

  return useMemo(() => ({ enabled, running, run }), [enabled, running, run]);
}

/** O painel aponta para cá com ?filtro=recusado, ?filtro=aguardando etc. */
function initialFilter(): PaymentStatus {
  if (typeof window === "undefined") return "em_analise";
  const wanted = new URLSearchParams(location.search).get("filtro");
  return FILTERS.find((f) => f.id === wanted)?.id ?? "em_analise";
}

export default function Pagamentos() {
  const { snapshot } = useBolao();
  const [filter, setFilter] = useState<PaymentStatus>(initialFilter);
  const [open, setOpen] = useState<string | null>(null);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const ai = useAiQueue(snapshot?.participants ?? []);
  const pill = useRef<HTMLSpanElement>(null);
  const filterIndex = FILTERS.findIndex((f) => f.id === filter);
  const loaded = !!snapshot;
  // O marcador amarelo do filtro desliza até a aba escolhida, como um cursor de tinta.
  useEffect(() => {
    if (!pill.current) return;
    if (reduced()) gsap.set(pill.current, { xPercent: filterIndex * 100 });
    else gsap.to(pill.current, { xPercent: filterIndex * 100, duration: 0.45, ease: "expo.out" });
  }, [filterIndex, loaded]);
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
    <AiContext.Provider value={ai}>
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
        className="relative mt-4 grid grid-cols-4 lg:mt-0 overflow-hidden rounded-md border-2 border-blue"
      >
        <span ref={pill} aria-hidden="true" className="absolute inset-y-0 left-0 w-1/4 bg-yellow" />
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
                setPicked(new Set());
              }}
              className={cx(
                // O primeiro filho é o marcador amarelo; a primeira aba é o segundo.
                "condensed relative flex min-h-14 flex-col items-center justify-center border-l-2 border-blue text-[14px] font-extrabold uppercase leading-tight [&:nth-child(2)]:border-l-0",
                active ? "text-ink" : "text-blue-deep hover:bg-paper-deep/70",
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
          {filter === "em_analise" && (
            <BulkApprove
              list={list.filter((p) => p.receipt)}
              picked={picked}
              setPicked={setPicked}
              quotaPrice={edition.quotaPrice}
            />
          )}
          <ul className="mt-3">
            {list.map((p) => (
              <PaymentRow
                key={p.id}
                p={p}
                pick={
                  filter === "em_analise" && p.receipt
                    ? {
                        checked: picked.has(p.id),
                        toggle: () =>
                          setPicked((cur) => {
                            const next = new Set(cur);
                            if (!next.delete(p.id)) next.add(p.id);
                            return next;
                          }),
                      }
                    : undefined
                }
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
    </AiContext.Provider>
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
  pick,
  quotaPrice,
  open,
  selected,
  onDecided,
  onToggle,
}: {
  p: Participant;
  pick?: { checked: boolean; toggle: () => void };
  quotaPrice: number;
  open: boolean;
  selected: boolean;
  onDecided: (id: string) => void;
  onToggle: () => void;
}) {
  return (
    <li id={`pix-${p.id}`} className="border-t border-blue/40 first:border-t-0">
      <div className="flex items-center">
      {pick && (
        <input
          type="checkbox"
          checked={pick.checked}
          onChange={pick.toggle}
          aria-label={`Selecionar ${p.name}`}
          className="mr-1 size-6 shrink-0 cursor-pointer accent-blue-deep lg:ml-3"
        />
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-current={selected ? "true" : undefined}
        className={cx(
          "flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2.5 text-left lg:rounded-md lg:px-3 lg:hover:bg-paper-deep",
          selected && "lg:bg-yellow lg:hover:bg-yellow",
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="semi truncate text-[18px] font-bold text-ink">{p.name}</span>
          <span className="text-[14px] text-ink-soft">
            {p.receipt ? `Comprovante ${dateTime(p.receipt.uploadedAt)}` : `Inscrição ${dateTime(p.createdAt)}`}
            <AiTag check={p.aiCheck} />
            {isLate(p) && " · atrasado"}
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
      </div>

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
  const ai = useContext(AiContext);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  // Se a IA apontou um problema objetivo, o motivo da recusa já vem sugerido.
  const aiReason =
    p.aiCheck?.state === "done" && p.aiCheck.verdict !== "aprovado"
      ? p.aiCheck.items.filter((i) => i.status === "erro").map((i) => i.detail).join(" ")
      : "";
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
      {p.receipt && <AiReport check={p.aiCheck} running={ai.running.has(p.id)} enabled={ai.enabled} onRun={(force) => ai.run(p.id, force)} />}
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
            <Button
              variant="danger"
              className="min-h-11 self-start text-[15px]"
              onClick={() => {
                if (!reason && aiReason) setReason(aiReason);
                setRejecting(true);
              }}
            >
              Recusar
            </Button>
          )}
        </div>
      )}

      {!p.receipt && (
        <>
          <p className="text-[15px] text-ink-soft">Ainda não mandou comprovante.</p>
          <Reminder p={p} />
        </>
      )}
    </div>
  );
}

function Receipt({ p }: { p: Participant }) {
  const { ds } = useBolao();
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
      <span className="text-[15px] leading-snug">
        {r.name} ·{" "}
        {ds.kind === "mock" ? "imagem de exemplo do modo demo (sem arquivo real)" : "não deu para abrir o arquivo. Recarregue a página."}
      </span>
    </div>
  );
}

/** Cobrança de quem ainda não pagou: abre o WhatsApp com a mensagem pronta, ou copia o texto. */
function Reminder({ p }: { p: Participant }) {
  const { snapshot, base } = useBolao();
  if (!snapshot) return null;
  const text = reminderText(p, snapshot.edition.quotaPrice, snapshot.edition.name, `${location.origin}${base}/p/${p.token}/pagamento`);
  const url = reminderUrl(p, text);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Mensagem copiada. Cole no WhatsApp ou onde preferir.");
    } catch {
      toast.error("Não deu para copiar.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {url && (
        <Button className="min-h-12" onClick={() => window.open(url, "_blank", "noopener")}>
          Cobrar no WhatsApp
        </Button>
      )}
      <Button variant="outline" className="min-h-12" onClick={copy}>
        Copiar mensagem de cobrança
      </Button>
      {!url && <p className="text-[14px] text-ink-soft">O contato dessa pessoa não é um telefone, então não dá para abrir o WhatsApp.</p>}
    </div>
  );
}

/** Aprovação em lote: marque vários comprovantes e aprove de uma vez, com desfazer. */
function BulkApprove({
  list,
  picked,
  setPicked,
  quotaPrice,
}: {
  list: Participant[];
  picked: ReadonlySet<string>;
  setPicked: (s: ReadonlySet<string>) => void;
  quotaPrice: number;
}) {
  const { ds } = useBolao();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  if (list.length < 2) return null;

  const chosen = list.filter((p) => picked.has(p.id));
  const total = chosen.reduce((sum, p) => sum + p.quotas * quotaPrice, 0);
  const all = chosen.length === list.length;

  async function approve() {
    setBusy(true);
    const done: string[] = [];
    try {
      for (const p of chosen) {
        await ds.setPayment(p.id, "aprovado");
        done.push(p.id);
      }
      toast.success(`${plural(done.length, "Pix aprovado", "Pix aprovados")}.`, {
        duration: 8000,
        action: {
          label: "Desfazer",
          onClick: () => {
            Promise.all(done.map((id) => ds.setPayment(id, "em_analise"))).catch(() =>
              toast.error("Não deu para desfazer tudo. Confira a aba Aprovados."),
            );
          },
        },
      });
    } catch (err) {
      toast.error(`${err instanceof Error ? err.message : "Não deu para salvar."} ${done.length} de ${chosen.length} foram aprovados.`);
    } finally {
      setBusy(false);
      setConfirming(false);
      setPicked(new Set());
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-md border-2 border-blue px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <label className="semi flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] font-bold text-ink">
          <input
            type="checkbox"
            checked={all}
            onChange={() => setPicked(all ? new Set() : new Set(list.map((p) => p.id)))}
            className="size-6 accent-blue-deep"
          />
          Selecionar todos
        </label>
        {!confirming && (
          <Button variant="outline" className="min-h-11 !w-auto px-4 text-[15px]" disabled={chosen.length === 0} onClick={() => setConfirming(true)}>
            {chosen.length === 0 ? "Aprovar vários" : `Aprovar ${chosen.length} · ${brlShort(total)}`}
          </Button>
        )}
      </div>
      {confirming && (
        <>
          <p className="text-[15px] leading-snug text-ink">
            Aprovar {plural(chosen.length, "Pix", "Pix")} ({brlShort(total)}) sem abrir os comprovantes um por um?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="min-h-12" onClick={() => setConfirming(false)} disabled={busy}>
              Voltar
            </Button>
            <Button className="min-h-12" onClick={approve} disabled={busy}>
              {busy ? "Aprovando…" : "Sim, aprovar"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
