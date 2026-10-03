"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminSheet } from "@/components/admin";
import { useBolao } from "@/components/bolao-provider";
import { Button, cx, Field, Label } from "@/components/riso";
import { STATUS_LABEL } from "@/lib/labels";
import type { Edition, EditionStatus } from "@/lib/types";

const FLOW: EditionStatus[] = ["rascunho", "aberta", "fechada", "apostada"];
const HELP: Record<EditionStatus, string> = {
  rascunho: "Ninguém consegue se inscrever ainda.",
  aberta: "Pessoas entram, pagam e marcam números.",
  fechada: "Sem novas inscrições; números travados.",
  apostada: "Ranking e jogos visíveis para todos.",
};

export default function EdicaoPage() {
  const { snapshot, ds } = useBolao();
  const [draft, setDraft] = useState<Partial<Edition>>({});
  const [confirmReset, setConfirmReset] = useState(false);

  if (!snapshot) return null;
  const edition = snapshot.edition;
  const form: Edition = { ...edition, ...draft, status: edition.status };
  const dirty = JSON.stringify(form) !== JSON.stringify(edition);

  const set = <K extends keyof Edition>(k: K, v: Edition[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function setStatus(status: EditionStatus) {
    await ds.updateEdition({ status });
    toast.success(STATUS_LABEL[status]);
  }

  async function save() {
    const { status: _ignored, ...rest } = form;
    void _ignored;
    await ds.updateEdition(rest);
    setDraft({});
    toast.success("Edição salva.");
  }

  return (
    <AdminSheet
      title={`EDIÇÃO ${edition.year}`}
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
        <ol className="mt-2.5 flex flex-col gap-2">
          {FLOW.map((s) => {
            const active = edition.status === s;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => !active && setStatus(s)}
                  aria-pressed={active}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-md border-2 px-3.5 py-3 text-left transition-colors",
                    active ? "border-yellow bg-yellow text-ink" : "border-blue text-ink hover:bg-paper-deep",
                  )}
                >
                  <span className="flex flex-col">
                    <span className="condensed text-[18px] font-extrabold uppercase leading-tight">{STATUS_LABEL[s]}</span>
                    <span className="text-[14px] leading-snug text-ink-soft">{HELP[s]}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
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
