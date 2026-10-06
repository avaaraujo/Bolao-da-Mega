"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Minus, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { rememberToken, useBolao } from "@/components/bolao-provider";
import { ActionBar, BackLink, Button, Field, InkTitle, Label, Loading, Sheet } from "@/components/riso";
import { brlShort, plural } from "@/lib/format";

const MAX_QUOTAS = 50;

export default function Entrar() {
  const { snapshot, ds, base } = useBolao();
  const router = useRouter();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [quotas, setQuotas] = useState(1);
  const [busy, setBusy] = useState(false);

  if (!snapshot) return <Loading />;
  const { edition } = snapshot;
  const total = quotas * edition.quotaPrice;
  const open = edition.status === "aberta";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Escreva seu nome para a gente saber de quem é o Pix.");
      return;
    }
    setBusy(true);
    try {
      const p = await ds.createParticipant({ name, contact, quotas });
      rememberToken(p.token);
      router.push(`${base}/p/${p.token}/pagamento`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu para entrar agora. Tente de novo.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="contents">
      <Sheet
        barIn="side"
        split="even"
        side={
          <>
            <section className="mt-9 lg:mt-0">
              <Label aside={`R$ ${edition.quotaPrice} cada`}>Quantas cotas?</Label>
              <div className="mt-3 flex items-stretch overflow-hidden rounded-md border-2 border-blue">
                <button
                  type="button"
                  aria-label="Menos uma cota"
                  onClick={() => setQuotas((q) => Math.max(1, q - 1))}
                  disabled={quotas <= 1}
                  className="flex w-20 items-center justify-center text-blue-deep transition-colors hover:bg-paper-deep active:bg-yellow/50 disabled:text-blue/30"
                >
                  <Minus size={28} weight="bold" />
                </button>
                <output
                  aria-live="polite"
                  className="display flex flex-1 items-center justify-center border-x-2 border-blue py-3 text-[26cqi] leading-[0.8] text-ink"
                >
                  {quotas}
                </output>
                <button
                  type="button"
                  aria-label="Mais uma cota"
                  onClick={() => setQuotas((q) => Math.min(MAX_QUOTAS, q + 1))}
                  disabled={quotas >= MAX_QUOTAS}
                  className="flex w-20 items-center justify-center text-blue-deep transition-colors hover:bg-paper-deep active:bg-yellow/50 disabled:text-blue/30"
                >
                  <Plus size={28} weight="bold" />
                </button>
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <span className="semi text-[17px] font-semibold text-ink-soft">Seu Pix</span>
                <span className="display text-[13cqi] leading-none text-ink">{brlShort(total)}</span>
              </div>
              <p className="mt-2 text-[15px] leading-snug text-ink-soft">
                {plural(quotas, "cota equivale", "cotas equivalem")} a{" "}
                {plural(total / edition.betPrice, "aposta simples", "apostas simples")} da Mega. Você escolhe 6 números uma vez só, não
                importa quantas cotas.
              </p>
            </section>
          </>
        }
        bar={
          <ActionBar note={open ? undefined : "As inscrições estão fechadas."}>
            <Button type="submit" disabled={busy || !open}>
              {busy ? "Guardando…" : "Continuar para o Pix"} <ArrowRight size={20} weight="bold" aria-hidden="true" />
            </Button>
          </ActionBar>
        }
      >
        <BackLink href={base}>Início</BackLink>
        <InkTitle size="lg" stack className="mt-3">
          {"ENTRAR\nNO BOLÃO"}
        </InkTitle>

        <div className="mt-8 flex flex-col gap-5">
          <Field
            label="Seu nome"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como o pessoal te chama"
            maxLength={60}
            required
          />
          <Field
            label="WhatsApp ou e-mail"
            hint="Opcional. Só para o organizador te chamar se o Pix não bater."
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={80}
          />
        </div>
      </Sheet>
    </form>
  );
}
