"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { AdminSheet, Row } from "@/components/admin";
import { useBolao } from "@/components/bolao-provider";
import { toast } from "sonner";
import { Button, Label, Strip, Dot } from "@/components/riso";
import { approvedTotals, gameCost, planGames } from "@/lib/rules";
import { CostBar } from "@/components/jogos";
import { CountUp } from "@/components/motion";
import { brlShort, dayMonth, plural } from "@/lib/format";
import { STATUS_LABEL, summarizeSizes } from "@/lib/labels";

export default function Painel() {
  const { snapshot, base } = useBolao();
  if (!snapshot) return null;
  const { edition, participants, games } = snapshot;
  const totals = approvedTotals(participants, edition.quotaPrice);
  const count = (s: string) => participants.filter((p) => p.payment === s);
  const review = count("em_analise");
  const waiting = count("aguardando");
  const rejected = count("recusado");
  const noNumbers = participants.filter((p) => p.payment === "aprovado" && p.numbers.length !== 6);
  const plan = planGames(totals.total, edition.betPrice);

  return (
    <AdminSheet
      title="PAINEL"
      side={
        <>
          <section className="mt-7 lg:mt-0">
            <Label>Jogos possíveis hoje</Label>
            <p className="semi mt-2 text-[18px] font-bold leading-snug text-ink">
              {plan.sizes.length === 0 ? "Ainda não há dinheiro confirmado." : summarizeSizes(plan.sizes)}
            </p>
            {plan.sizes.length > 0 && (
              <div className="mt-3">
                <CostBar
                  games={plan.sizes.map((size, index) => ({ index, size, cost: gameCost(size, edition.betPrice), numbers: [] }))}
                  total={totals.total}
                />
              </div>
            )}
            <p className="mt-1 text-[15px] text-ink-soft">
              {games ? "Jogos confirmados na aba Jogos." : "Os jogos só ficam fixos quando você confirma na aba Jogos."}
            </p>
          </section>

          {noNumbers.length > 0 && (
            <section className="mt-7">
              <Label>Pagaram, mas não marcaram números</Label>
              <ul className="mt-2">
                {noNumbers.map((p) => (
                  <li key={p.id} className="border-t border-blue/40 py-2.5 text-[17px] first:border-t-0">
                    {p.name}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      }
    >
      <Strip className="mt-4 lg:mt-0">
        {STATUS_LABEL[edition.status]} <Dot /> prazo {dayMonth(edition.deadline)} <Dot /> sorteio {dayMonth(edition.drawDate)}
      </Strip>

      {review.length > 0 && (
        <Link
          href={`${base}/admin/pagamentos`}
          data-wobble
          className="mt-5 flex items-center justify-between gap-3 rounded-md bg-yellow px-4 py-3.5 text-ink active:translate-y-px"
        >
          <span className="semi text-[18px] font-bold">
            {plural(review.length, "comprovante para conferir", "comprovantes para conferir")}
          </span>
          <ArrowRight size={22} weight="bold" aria-hidden="true" />
        </Link>
      )}

      <section className="mt-7">
        <Label aside={edition.code}>Convite</Label>
        <p className="mt-2 text-[15px] leading-snug text-ink-soft">
          Mande este link no grupo. Quem abrir entra só neste bolão, sem ver nenhum outro.
        </p>
        <Button
          variant="outline"
          className="mt-3 min-h-11 text-[15px]"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`${location.origin}${base}`);
              toast.success("Link do bolão copiado.");
            } catch {
              toast.error(`Não deu para copiar. Código: ${edition.code}`);
            }
          }}
        >
          Copiar link do bolão
        </Button>
        <Link href="/admin" className="semi mt-3 block min-h-11 py-2 text-[15px] font-bold text-blue-deep underline underline-offset-4 lg:hidden">
          Meus bolões
        </Link>
      </section>

      <section className="mt-7">
        <Label>Caixa</Label>
        <div className="mt-2">
          <Row label="Confirmado" value={<CountUp value={totals.total} format={brlShort} />} strong />
          <Row label="Cotas confirmadas" value={<CountUp value={totals.quotas} />} />
          <Row label="Pessoas confirmadas" value={<CountUp value={totals.people} />} />
          <Row label="Em análise" value={`${brlShort(review.reduce((s, p) => s + p.quotas, 0) * edition.quotaPrice)} · ${review.length}`} />
          <Row label="Sem comprovante" value={waiting.length} />
          <Row label="Recusados" value={rejected.length} />
        </div>
      </section>
    </AdminSheet>
  );
}
