"use client";

import { useParams } from "next/navigation";
import { useBolao } from "./bolao-provider";
import { Dot, Strip } from "./riso";
import type { Participant, PaymentStatus } from "@/lib/types";
import { brlShort, firstName, plural } from "@/lib/format";

export function useParticipant() {
  const { token } = useParams<{ token: string }>();
  const { snapshot, ds } = useBolao();
  const participant = snapshot?.participants.find((p) => p.token === token) ?? null;
  return { token, snapshot, ds, participant };
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  aguardando: "Pix pendente",
  em_analise: "Pix em análise",
  aprovado: "Pix confirmado",
  recusado: "Pix recusado",
};

export function ParticipantStrip({ p, quotaPrice, className }: { p: Participant; quotaPrice: number; className?: string }) {
  return (
    <Strip className={className}>
      <span>{firstName(p.name)}</span>
      <Dot />
      <span>{plural(p.quotas, "cota", "cotas")}</span>
      <Dot />
      <span>{brlShort(p.quotas * quotaPrice)}</span>
      <Dot />
      <span className={p.payment === "recusado" ? "text-ink underline decoration-pink decoration-2" : undefined}>
        {PAYMENT_LABEL[p.payment]}
      </span>
    </Strip>
  );
}
