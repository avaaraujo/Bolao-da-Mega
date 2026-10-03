"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, SealCheck } from "@phosphor-icons/react";
import { toast } from "sonner";
import { NotFound } from "@/components/not-found";
import { ParticipantStrip, useParticipant } from "@/components/participant";
import { ActionBar, BackLink, Button, ButtonLink, InkTitle, Label, Loading, Sheet } from "@/components/riso";
import { dayMonth } from "@/lib/format";
import { Volante } from "@/components/volante";
import { PICK } from "@/lib/rules";

export default function VolantePage() {
  const { token, snapshot, ds, participant } = useParticipant();
  const router = useRouter();
  const [picked, setPicked] = useState<number[] | null>(null);
  const [busy, setBusy] = useState(false);

  if (!snapshot) return <Loading />;
  if (!participant) return <NotFound />;

  const selected = picked ?? participant.numbers;
  const editable = snapshot.edition.status === "aberta";
  const unchanged = picked === null || picked.join() === participant.numbers.join();

  function toggle(n: number) {
    if (selected.includes(n)) return setPicked(selected.filter((x) => x !== n));
    if (selected.length >= PICK) {
      toast("Já são 6. Toque num número carimbado para soltar e trocar.", { id: "limite" });
      return;
    }
    setPicked([...selected, n]);
  }

  async function confirm() {
    setBusy(true);
    try {
      await ds.setNumbers(token, selected);
      toast.success("Números carimbados.");
      router.push(`/p/${token}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu para salvar. Tente de novo.");
      setBusy(false);
    }
  }

  const missing = PICK - selected.length;
  const confirmed = unchanged && participant.numbers.length === PICK;

  return (
    <Sheet
      bar={
        <ActionBar note={confirmed && editable ? `Toque num número para trocar até ${dayMonth(snapshot.edition.deadline)}.` : undefined}>
          {confirmed ? (
            <ButtonLink href={`/p/${token}`} variant="stamp">
              <SealCheck size={22} weight="fill" aria-hidden="true" /> Números carimbados · ver bilhete
            </ButtonLink>
          ) : (
            <Button onClick={confirm} disabled={busy || missing > 0 || !editable}>
              {busy ? "Carimbando…" : missing > 0 ? `Falta${missing > 1 ? "m" : ""} ${missing} número${missing > 1 ? "s" : ""}` : "Confirmar meus números"}
              {!busy && missing === 0 && <ArrowRight size={20} weight="bold" aria-hidden="true" />}
            </Button>
          )}
        </ActionBar>
      }
    >
      <div className="flex items-center justify-between">
        <BackLink href={`/p/${token}`}>Meu bilhete</BackLink>
      </div>
      <InkTitle className="mt-1">BOLÃO DA MEGA DO AVÁ</InkTitle>
      <ParticipantStrip className="mt-3" p={participant} quotaPrice={snapshot.edition.quotaPrice} />

      <Label className="mt-5 mb-2.5" aside={`${selected.length}/${PICK}`}>
        {editable ? "Escolha seus 6 números" : "Seus números"}
      </Label>
      <Volante selected={selected} onToggle={toggle} disabled={!editable} />
      {!editable && (
        <p className="mt-3 text-[15px] text-ink-soft">As inscrições fecharam, então os números não mudam mais.</p>
      )}
    </Sheet>
  );
}
