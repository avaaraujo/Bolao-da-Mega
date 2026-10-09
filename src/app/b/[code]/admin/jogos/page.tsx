"use client";

import { useState } from "react";
import { Copy } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AdminSheet } from "@/components/admin";
import { useBolao } from "@/components/bolao-provider";
import { ExportImageButton } from "@/components/export-button";
import { CostBar, GameList, gamesAsText } from "@/components/jogos";
import { Button, Label, Strip, Dot } from "@/components/riso";
import { approvedTotals, buildGames, planGames, rankNumbers } from "@/lib/rules";
import { brlShort, plural } from "@/lib/format";
import { summarizeSizes } from "@/lib/labels";

export default function Jogos() {
  const { snapshot, ds } = useBolao();
  const [confirmingRelease, setConfirmingRelease] = useState(false);
  if (!snapshot) return null;

  const { edition, participants, games: saved } = snapshot;
  const totals = approvedTotals(participants, edition.quotaPrice);
  const ranking = rankNumbers(participants).map((r) => r.number);
  const plan = planGames(totals.total, edition.betPrice);
  const live = buildGames(ranking, plan.sizes, edition.betPrice);
  const games = saved ?? live;
  const stale = saved !== null && JSON.stringify(saved) !== JSON.stringify(live);
  const released = edition.status === "apostada";

  async function copyList() {
    try {
      await navigator.clipboard.writeText(gamesAsText(games, edition.name));
      toast.success("Lista copiada. Cole no app da Caixa ou leve à lotérica.");
    } catch {
      toast.error("Não deu para copiar.");
    }
  }

  async function confirm() {
    await ds.saveGames(live);
    toast.success("Jogos confirmados. Agora é registrar na Caixa.");
  }

  async function release() {
    await ds.updateEdition({ status: "apostada" });
    setConfirmingRelease(false);
    toast.success("Ranking e jogos liberados para todo mundo.");
  }

  const actions = released ? undefined : !saved || stale ? (
    <Button onClick={confirm} disabled={live.length === 0}>
      {stale ? "Reconfirmar com o caixa atual" : "Confirmar estes jogos"}
    </Button>
  ) : confirmingRelease ? (
    <>
      <p className="semi text-center text-[15px] font-semibold text-ink">
        Todo mundo vai ver o ranking e os jogos. Fez as apostas na Caixa?
      </p>
      <div className="grid grid-cols-2 gap-2 [&>*]:min-h-14">
        <Button variant="outline" onClick={() => setConfirmingRelease(false)}>
          Ainda não
        </Button>
        <Button variant="solid" onClick={release}>
          Sim, liberar
        </Button>
      </div>
    </>
  ) : (
    <Button onClick={() => setConfirmingRelease(true)}>Apostas feitas: liberar resultado</Button>
  );

  const list =
    games.length > 0 ? (
      <>
        <section className="mt-7 lg:mt-0">
          <div className="flex items-baseline justify-between gap-3">
            <Label>Números de cada jogo</Label>
            <div className="flex gap-4">
              <ExportImageButton edition={edition} games={games} participants={participants} />
              <button
                type="button"
                onClick={copyList}
                className="condensed flex min-h-11 shrink-0 items-center gap-1.5 text-[16px] font-extrabold uppercase text-blue-deep hover:underline"
              >
                <Copy size={18} weight="bold" aria-hidden="true" /> Copiar
              </button>
            </div>
          </div>
          <p className="mt-1 mb-3 text-[15px] leading-snug text-ink-soft">
            Os números saem do ranking em sequência, sem repetir; quando o ranking acaba, volta ao começo.
          </p>
          <GameList games={games} />
        </section>

        {released && (
          <p className="mt-6 text-[15px] text-ink-soft">Resultado liberado: os participantes já veem o ranking e estes jogos.</p>
        )}
      </>
    ) : undefined;

  return (
    <AdminSheet title="JOGOS" actions={actions} side={list} split="wide-right">
      <Strip className="mt-4 lg:mt-0">
        {brlShort(totals.total)} <Dot /> {plural(totals.quotas, "cota", "cotas")} <Dot /> {plural(games.length, "jogo", "jogos")}
      </Strip>

      {games.length === 0 ? (
        <p className="mt-8 text-[17px] text-ink-soft">Os jogos aparecem quando houver Pix aprovado.</p>
      ) : (
        <>
          <section className="mt-6">
            <Label aside={saved ? "confirmados" : "prévia"}>Para onde vai o dinheiro</Label>
            <p className="semi mt-1.5 mb-3 text-[16px] font-semibold leading-snug text-ink">{summarizeSizes(games.map((g) => g.size))}</p>
            <CostBar games={games} total={totals.total} />
            {plan.leftover > 0 && <p className="mt-2 text-[15px] text-ink-soft">Sobra {brlShort(plan.leftover)}.</p>}
          </section>

          {stale && (
            <p className="mt-5 rounded-md bg-pink/15 px-3 py-2.5 text-[15px] leading-snug text-ink">
              O caixa ou os votos mudaram depois que você confirmou. Reconfirme para os jogos refletirem o ranking atual.
            </p>
          )}
        </>
      )}
    </AdminSheet>
  );
}
