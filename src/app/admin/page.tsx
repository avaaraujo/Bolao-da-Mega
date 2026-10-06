"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Copy } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAdminUser } from "@/components/bolao-provider";
import { Button, Field, InkTitle, Label, Sheet } from "@/components/riso";
import { STATUS_LABEL } from "@/lib/labels";
import type { Edition } from "@/lib/types";

const thisYear = new Date().getFullYear();

export default function MeusBoloes() {
  const { user, platform } = useAdminUser();
  const router = useRouter();
  const [list, setList] = useState<Edition[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quotaPrice: "60",
    betPrice: "6",
    pixKey: "",
    pixHolder: "",
    deadline: `${thisYear}-12-29`,
    drawDate: `${thisYear}-12-31`,
  });

  const refresh = useCallback(() => platform.listMyBolaos().then(setList).catch(() => setList([])), [platform]);
  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const b = await platform.createBolao({
        name: form.name.trim(),
        quotaPrice: Number(form.quotaPrice),
        betPrice: Number(form.betPrice),
        pixKey: form.pixKey.trim(),
        pixHolder: form.pixHolder.trim(),
        deadline: form.deadline,
        drawDate: form.drawDate,
      });
      toast.success(`Bolão criado: ${b.code}`);
      router.push(`/b/${b.code}/admin`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu para criar o bolão.");
      setBusy(false);
    }
  }

  async function copyInvite(code: string) {
    try {
      await navigator.clipboard.writeText(`${location.origin}/b/${code}`);
      toast.success("Link do bolão copiado.");
    } catch {
      toast.error(`Não deu para copiar. Código: ${code}`);
    }
  }

  return (
    <Sheet>
      <InkTitle size="lg" stack className="mt-6">
        {"MEUS\nBOLÕES"}
      </InkTitle>

      <div className="mt-6 flex items-center justify-between gap-3">
        <span className="semi truncate text-[15px] font-semibold text-ink-soft">{user?.email}</span>
        <button
          type="button"
          onClick={() => platform.signOut()}
          className="semi min-h-11 shrink-0 text-[15px] font-bold text-blue-deep underline underline-offset-4"
        >
          Sair
        </button>
      </div>

      <section className="mt-4">
        {list === null ? (
          <p className="text-[16px] text-ink-soft motion-safe:animate-pulse">Imprimindo…</p>
        ) : list.length === 0 ? (
          <p className="text-[17px] leading-snug text-ink-soft">Você ainda não tem nenhum bolão.</p>
        ) : (
          <ul className="flex flex-col">
            {list.map((b) => (
              <li key={b.id} className="flex flex-col gap-2 border-t border-blue/40 py-4 first:border-t-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="condensed text-[24px] font-extrabold uppercase leading-tight text-ink">{b.name}</span>
                  <span className="semi shrink-0 text-[14px] font-bold text-blue-deep">{STATUS_LABEL[b.status]}</span>
                </div>
                <span className="semi text-[15px] font-semibold text-ink-soft">Código {b.code}</span>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                  <Link
                    href={`/b/${b.code}/admin`}
                    className="condensed flex min-h-11 items-center gap-1 text-[17px] font-extrabold uppercase text-blue-deep underline underline-offset-4"
                  >
                    Abrir painel <ArrowRight size={18} weight="bold" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => copyInvite(b.code)}
                    className="condensed flex min-h-11 items-center gap-1 text-[17px] font-extrabold uppercase text-blue-deep underline underline-offset-4"
                  >
                    <Copy size={18} weight="bold" aria-hidden="true" /> Copiar link
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {creating ? (
        <form onSubmit={create} className="mt-8 flex flex-col gap-5 border-t-2 border-blue pt-6">
          <Label>Novo bolão</Label>
          <Field label="Nome do bolão" value={form.name} onChange={set("name")} placeholder="Turma da Firma" maxLength={60} minLength={2} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cota (R$)" type="number" inputMode="numeric" min={1} value={form.quotaPrice} onChange={set("quotaPrice")} required />
            <Field label="Aposta simples (R$)" type="number" inputMode="numeric" min={1} value={form.betPrice} onChange={set("betPrice")} required />
          </div>
          <Field label="Chave Pix" hint="Fica guardada no banco, nunca no código." value={form.pixKey} onChange={set("pixKey")} maxLength={120} />
          <Field label="Nome de quem recebe o Pix" value={form.pixHolder} onChange={set("pixHolder")} maxLength={80} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inscrições até" type="date" value={form.deadline} onChange={set("deadline")} required />
            <Field label="Sorteio" type="date" value={form.drawDate} onChange={set("drawDate")} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Criando…" : "Criar bolão"}
            </Button>
          </div>
        </form>
      ) : (
        <Button className="mt-8 min-h-14" onClick={() => setCreating(true)}>
          Criar bolão
        </Button>
      )}

      <Link href="/" className="semi mt-5 min-h-11 self-start text-[15px] font-bold text-blue-deep underline underline-offset-4">
        Voltar ao início
      </Link>
    </Sheet>
  );
}
