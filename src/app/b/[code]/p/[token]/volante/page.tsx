"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, SealCheck } from "@phosphor-icons/react";
import { toast } from "sonner";
import { NotFound } from "@/components/not-found";
import { ParticipantStrip, useParticipant } from "@/components/participant";
import { ActionBar, BackLink, Button, ButtonLink, InkTitle, Label, Loading, nudge, NumberChip, Sheet } from "@/components/riso";
import { dayMonth } from "@/lib/format";
import { Volante } from "@/components/volante";
import { PICK } from "@/lib/rules";

export default function VolantePage() {
  const { token, snapshot, ds, participant, base } = useParticipant();
  const router = useRouter();
  const [picked, setPicked] = useState<number[] | null>(null);
  const [busy, setBusy] = useState(false);
  // Números carimbados nesta visita: só eles entram com movimento.
  const [fresh, setFresh] = useState<ReadonlySet<number>>(() => new Set());
  const counter = useRef<HTMLSpanElement>(null);

  if (!snapshot) return <Loading />;
  if (!participant) return <NotFound />;

  const selected = picked ?? participant.numbers;
  const editable = snapshot.edition.status === "aberta";
  const unchanged = picked === null || picked.join() === participant.numbers.join();

  function toggle(n: number) {
    if (selected.includes(n)) {
      setPicked(selected.filter((x) => x !== n));
      return true;
    }
    if (selected.length >= PICK) {
      nudge(counter.current);
      toast("Já são 6. Toque num número carimbado para soltar e trocar.", { id: "limite" });
      return false;
    }
    setFresh((f) => new Set(f).add(n));
    setPicked([...selected, n]);
    return true;
  }

  async function confirm() {
    setBusy(true);
    try {
      await ds.setNumbers(token, selected);
      // O fecho do voto acontece no bilhete: os 6 números carimbam em sequência na chegada.
      try {
        sessionStorage.setItem(`bolao:carimbo:${token}`, "1");
      } catch {}
      router.push(`${base}/p/${token}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu para salvar. Tente de novo.");
      setBusy(false);
    }
  }

  const missing = PICK - selected.length;
  const confirmed = unchanged && participant.numbers.length === PICK;

  return (
    <Sheet
      side={
        <>
          <Label
            className="mt-5 mb-2.5 lg:mt-0"
            aside={
              <span ref={counter} className="inline-block">
                {selected.length}/{PICK}
              </span>
            }
          >
            {editable ? "Escolha seus 6 números" : "Seus números"}
          </Label>
          <Volante selected={selected} fresh={fresh} onToggle={toggle} disabled={!editable} />
          {!editable && <p className="mt-3 text-[15px] text-ink-soft">As inscrições fecharam, então os números não mudam mais.</p>}
        </>
      }
      bar={
        <ActionBar note={confirmed && editable ? `Toque num número para trocar até ${dayMonth(snapshot.edition.deadline)}.` : undefined}>
          {confirmed ? (
            <ButtonLink href={`${base}/p/${token}`} variant="stamp">
              <SealCheck size={22} weight="fill" aria-hidden="true" /> Números carimbados · ver bilhete
            </ButtonLink>
          ) : (
            <Button onClick={confirm} disabled={busy || missing > 0 || !editable}>
              {busy
                ? "Carimbando…"
                : missing > 0
                  ? `Falta${missing > 1 ? "m" : ""} ${missing} número${missing > 1 ? "s" : ""}`
                  : "Confirmar meus números"}
              {!busy && missing === 0 && <ArrowRight size={20} weight="bold" aria-hidden="true" />}
            </Button>
          )}
        </ActionBar>
      }
    >
      <div className="flex items-center justify-between">
        <BackLink href={`${base}/p/${token}`}>Meu bilhete</BackLink>
      </div>
      <InkTitle className="mt-1">BOLÃO DA MEGA</InkTitle>
      <ParticipantStrip className="mt-3" p={participant} quotaPrice={snapshot.edition.quotaPrice} />
      <section className="mt-10 hidden lg:block" aria-hidden="true">
        <Label aside={`${selected.length}/${PICK}`}>Seus números</Label>
        <div className="mt-4 grid grid-cols-6 gap-2">
          {Array.from({ length: PICK }, (_, k) => [...selected].sort((a, b) => a - b)[k]).map((n, k) =>
            n ? (
              <NumberChip key={n} n={n} size="lg" fresh={fresh.has(n)} />
            ) : (
              <span
                key={`vazio-${k}`}
                className="h-[13.5cqi] max-h-16 w-[13.5cqi] max-w-16 rounded-full border-2 border-dashed border-blue/50"
              />
            ),
          )}
        </div>
      </section>
    </Sheet>
  );
}
