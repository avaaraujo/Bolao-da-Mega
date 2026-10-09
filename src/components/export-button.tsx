"use client";

import { useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { downloadResultImage } from "@/lib/export-image";
import { rankNumbers } from "@/lib/rules";
import type { Game, Participant, Edition } from "@/lib/types";

/** Baixa uma imagem com jogos, ranking e quem está no bolão, pronta para postar no grupo. */
export function ExportImageButton({ edition, games, participants }: { edition: Edition; games: Game[]; participants: Participant[] }) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      await downloadResultImage({
        edition,
        games,
        ranking: rankNumbers(participants),
        names: participants.filter((p) => p.payment === "aprovado").map((p) => p.name),
      });
      toast.success("Imagem baixada.");
    } catch {
      toast.error("Não deu para gerar a imagem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className="condensed flex min-h-11 shrink-0 items-center gap-1.5 text-[16px] font-extrabold uppercase text-blue-deep hover:underline disabled:opacity-50"
    >
      <DownloadSimple size={18} weight="bold" aria-hidden="true" /> {busy ? "Gerando…" : "Imagem"}
    </button>
  );
}
