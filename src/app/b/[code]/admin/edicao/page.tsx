"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminSheet } from "@/components/admin";
import { useBolao } from "@/components/bolao-provider";
import { Check } from "@phosphor-icons/react";
import { Button, ButtonLink, cx, Field, Label } from "@/components/riso";
import { STATUS_LABEL } from "@/lib/labels";
import type { Edition, EditionStatus } from "@/lib/types";

const FLOW: EditionStatus[] = ["rascunho", "aberta", "fechada", "apostada"];
const HELP: Record<EditionStatus, string> = {
  rascunho: "Ninguém consegue se inscrever ainda.",
  aberta: "Pessoas entram, pagam e marcam números.",
  fechada: "Sem novas inscrições; números travados.",
  apostada: "Ranking e jogos visíveis para todos.",
};

/** Cada mudança de momento é um passo só, com o que ela causa dito antes da confirmação. */
type Move = { to: EditionStatus; label: string; yes: string; warning: string };
const FORWARD: Partial<Record<EditionStatus, Move>> = {
  rascunho: { to: "aberta", label: "Abrir inscrições", yes: "Sim, abrir", warning: "Quem tiver o link já consegue entrar, pagar e marcar números." },
  aberta: { to: "fechada", label: "Fechar inscrições", yes: "Sim, fechar", warning: "Ninguém mais entra e os números de todo mundo ficam travados." },
};
const BACK: Partial<Record<EditionStatus, Move>> = {
  aberta: { to: "rascunho", label: "Voltar para rascunho", yes: "Sim, voltar", warning: "O link para de aceitar inscrições até você abrir de novo." },
  fechada: { to: "aberta", label: "Reabrir inscrições", yes: "Sim, reabrir", warning: "Volta a aceitar gente nova e troca de números." },
  apostada: { to: "fechada", label: "Esconder o resultado", yes: "Sim, esconder", warning: "Todo mundo deixa de ver o ranking e os jogos." },
};

export default function EdicaoPage() {
  const { snapshot, ds, base } = useBolao();
  const [draft, setDraft] = useState<Partial<Edition>>({});
  const [confirmReset, setConfirmReset] = useState(false);
  const [pending, setPending] = useState<Move | null>(null);

  if (!snapshot) return null;
  const edition = snapshot.edition;
  const form: Edition = { ...edition, ...draft, status: edition.status };
  const dirty = JSON.stringify(form) !== JSON.stringify(edition);

  const set = <K extends keyof Edition>(k: K, v: Edition[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function move(m: Move) {
    try {
      await ds.updateEdition({ status: m.to });
      toast.success(STATUS_LABEL[m.to]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu para mudar o momento.");
    } finally {
      setPending(null);
    }
  }
  const forward = FORWARD[edition.status];
  const back = BACK[edition.status];
  const at = FLOW.indexOf(edition.status);

  async function save() {
    const { status: _ignored, ...rest } = form;
    void _ignored;
    await ds.updateEdition(rest);
    setDraft({});
    toast.success("Edição salva.");
  }

  return (
    <AdminSheet
      title={edition.name.toUpperCase()}
      split="wide-right"
      side={
        <>
          <section className="mt-8 flex flex-col gap-5 lg:mt-0">
            <Label>Dados da edição</Label>
            <Field label="Chave Pix" value={form.pixKey} onChange={(e) => set("pixKey", e.target.value)} />
            <Field label="Nome que aparece no Pix" value={form.pixHolder} onChange={(e) => set("pixHolder", e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prazo" type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
              <Field label="Sorteio" type="date" value={form.drawDate} onChange={(e) => set("drawDate", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Cota (R$)"
                type="number"
                inputMode="numeric"
                min={1}
                value={form.quotaPrice}
                onChange={(e) => set("quotaPrice", Math.max(1, Number(e.target.value) || 0))}
              />
              <Field
                label="Aposta simples (R$)"
                type="number"
                inputMode="decimal"
                min={1}
                step="0.5"
                value={form.betPrice}
                onChange={(e) => set("betPrice", Math.max(0.5, Number(e.target.value) || 0))}
              />
            </div>
            <Button onClick={save} disabled={!dirty} className="min-h-14">
              Salvar edição
            </Button>
          </section>
        </>
      }
    >
      <section className="mt-5 lg:mt-0">
        <Label>Momento do bolão</Label>
        {/* O caminho do bolão é só leitura: mudar de momento acontece embaixo, um passo por vez e confirmado. */}
        <ol className="mt-2.5 flex flex-col gap-2">
          {FLOW.map((s, i) => {
            const active = i === at;
            return (
              <li
                key={s}
                aria-current={active ? "step" : undefined}
                className={cx(
                  "flex items-center gap-3 rounded-md border-2 px-3.5 py-3",
                  active ? "border-yellow bg-yellow text-ink" : "border-blue/40 text-ink",
                  i > at && "border-dashed",
                )}
              >
                <span aria-hidden="true" className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                  {i < at ? (
                    <>
                      <span className="ink absolute inset-0 rounded-full bg-pink" />
                      <Check size={14} weight="bold" className="relative" />
                    </>
                  ) : (
                    <span className={cx("h-full w-full rounded-full border-2", active ? "border-ink" : "border-blue/50")} />
                  )}
                </span>
                <span className="flex flex-col">
                  <span className="condensed text-[18px] font-extrabold uppercase leading-tight">{STATUS_LABEL[s]}</span>
                  <span className="text-[14px] leading-snug text-ink-soft">{HELP[s]}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex flex-col gap-2">
          {pending ? (
            <>
              <p className="semi text-[16px] font-semibold leading-snug text-ink">
                {pending.label}? {pending.warning}
              </p>
              <div className="grid grid-cols-2 gap-2 [&>*]:min-h-14">
                <Button variant="outline" onClick={() => setPending(null)}>
                  Cancelar
                </Button>
                <Button variant="solid" onClick={() => move(pending)}>
                  {pending.yes}
                </Button>
              </div>
            </>
          ) : (
            <>
              {forward && (
                <Button className="min-h-14" onClick={() => setPending(forward)}>
                  {forward.label}
                </Button>
              )}
              {/* Liberar o resultado só existe em Jogos, depois de confirmar os jogos e fazer as apostas. */}
              {edition.status === "fechada" && (
                <ButtonLink href={`${base}/admin/jogos`} className="min-h-14">
                  Montar jogos e liberar o resultado
                </ButtonLink>
              )}
              {back && (
                <Button variant="outline" onClick={() => setPending(back)}>
                  {back.label}
                </Button>
              )}
            </>
          )}
        </div>
      </section>

      <section className="mt-12 border-t-2 border-dashed border-ink/30 pt-5">
        <Label>Modo demo</Label>
        <p className="mt-2 text-[15px] leading-snug text-ink-soft">
          Os dados ficam só neste navegador. Restaurar volta aos 44 participantes de exemplo (102 cotas aprovadas).
        </p>
        {confirmReset ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Cancelar
            </Button>
            <Button
              variant="solid"
              onClick={async () => {
                await ds.reset?.();
                setDraft({});
                setConfirmReset(false);
                toast.success("Dados de exemplo restaurados.");
              }}
            >
              Restaurar
            </Button>
          </div>
        ) : (
          <Button variant="danger" className="mt-3 min-h-11 text-[15px]" onClick={() => setConfirmReset(true)}>
            Restaurar dados de exemplo
          </Button>
        )}
      </section>
    </AdminSheet>
  );
}
