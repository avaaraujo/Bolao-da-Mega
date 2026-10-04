"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Copy, FilePdf, UploadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { NotFound } from "@/components/not-found";
import { useParticipant } from "@/components/participant";
import { ActionBar, BackLink, Button, cx, InkTitle, Label, Loading, Sheet } from "@/components/riso";
import { brl, plural } from "@/lib/format";
import { ACCEPTED_RECEIPTS, prepareReceipt } from "@/lib/receipt";
import type { Receipt } from "@/lib/types";

export default function Pagamento() {
  const { token, snapshot, ds, participant } = useParticipant();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  if (!snapshot) return <Loading />;
  if (!participant) return <NotFound />;

  const { edition } = snapshot;
  const total = participant.quotas * edition.quotaPrice;
  const current = receipt ?? participant.receipt;
  const alreadySent = participant.payment === "em_analise" || participant.payment === "aprovado";

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copiad${what === "Chave" ? "a" : "o"}.`);
    } catch {
      toast.error("Não deu para copiar. Segure o texto para copiar manualmente.");
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await takeFile(file);
  }

  async function takeFile(file: File) {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Mande uma imagem ou um PDF do comprovante.");
      return;
    }
    try {
      setReceipt(await prepareReceipt(file));
    } catch {
      toast.error("Não consegui ler esse arquivo. Tente uma foto ou um PDF.");
    }
  }

  async function send() {
    if (!receipt) return;
    setBusy(true);
    try {
      await ds.attachReceipt(token, receipt);
      toast.success("Comprovante enviado. O Avá vai conferir.");
      router.push(participant!.numbers.length ? `/p/${token}` : `/p/${token}/volante`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu para enviar. Tente de novo.");
      setBusy(false);
    }
  }

  return (
    <Sheet
      barIn="side"
      split="even"
      side={
        <>
          <section className="mt-6 lg:mt-0">
            <Label>Chave Pix</Label>
            <button
              type="button"
              onClick={() => copy(edition.pixKey, "Chave")}
              className="mt-2.5 flex w-full items-center justify-between gap-3 rounded-md border-2 border-blue px-4 py-3.5 text-left transition-colors hover:bg-paper-deep active:bg-yellow/40"
            >
              <span className="flex min-w-0 flex-col">
                <span className="semi truncate text-[19px] font-bold text-ink">{edition.pixKey}</span>
                <span className="text-[14px] text-ink-soft">{edition.pixHolder}</span>
              </span>
              <span className="condensed flex shrink-0 items-center gap-1.5 text-[16px] font-extrabold uppercase text-blue-deep">
                <Copy size={20} weight="bold" aria-hidden="true" /> Copiar
              </span>
            </button>
            <button
              type="button"
              onClick={() => copy(total.toFixed(2).replace(".", ","), "Valor")}
              className="semi mt-2 min-h-11 text-[15px] font-bold text-blue-deep underline underline-offset-4"
            >
              Copiar o valor ({brl(total)})
            </button>
          </section>

          <section className="mt-6">
            <Label>Comprovante</Label>
            <input ref={input} type="file" accept={ACCEPTED_RECEIPTS} onChange={onFile} className="sr-only" tabIndex={-1} />
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) takeFile(file);
              }}
              className={cx(
                "mt-2.5 flex w-full items-center gap-4 rounded-md border-2 border-dashed border-blue p-3 text-left transition-colors hover:bg-paper-deep lg:p-5",
                dragging && "border-pink bg-yellow/30",
              )}
            >
              {current?.dataUrl && current.type.startsWith("image") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.dataUrl} alt="Comprovante anexado" className="h-20 w-16 shrink-0 rounded-sm object-cover" />
              ) : (
                <span className="flex h-20 w-16 shrink-0 items-center justify-center rounded-sm bg-paper-deep text-blue-deep">
                  {current ? <FilePdf size={30} weight="bold" /> : <UploadSimple size={30} weight="bold" />}
                </span>
              )}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="semi truncate text-[17px] font-bold text-ink">
                  {current ? (
                    current.name
                  ) : (
                    <>
                      <span className="lg:hidden">Toque para anexar</span>
                      <span className="hidden lg:inline">Clique ou arraste o arquivo aqui</span>
                    </>
                  )}
                </span>
                <span className="text-[14px] leading-snug text-ink-soft">
                  {receipt
                    ? "Pronto para enviar. Toque para trocar."
                    : participant.receipt
                      ? participant.payment === "recusado"
                        ? "Esse foi recusado. Anexe um novo."
                        : "Já enviado. Toque para mandar outro."
                      : "Print ou foto do Pix, ou o PDF do banco."}
                </span>
              </span>
            </button>
            {participant.payment === "recusado" && participant.rejectReason && (
              <p className="mt-3 rounded-md bg-pink/15 px-3 py-2.5 text-[15px] leading-snug text-ink">
                <strong className="font-bold">Motivo da recusa:</strong> {participant.rejectReason}
              </p>
            )}
          </section>
        </>
      }
      bar={
        <ActionBar>
          {receipt ? (
            <Button onClick={send} disabled={busy}>
              {busy ? "Enviando…" : "Enviar comprovante"} <ArrowRight size={20} weight="bold" aria-hidden="true" />
            </Button>
          ) : alreadySent ? (
            <Button variant="outline" onClick={() => router.push(`/p/${token}`)}>
              Ver meu bilhete
            </Button>
          ) : (
            <Button onClick={() => input.current?.click()}>
              <UploadSimple size={20} weight="bold" aria-hidden="true" /> Anexar comprovante
            </Button>
          )}
        </ActionBar>
      }
    >
      <BackLink href={`/p/${token}`}>Meu bilhete</BackLink>
      <InkTitle size="lg" stack className="mt-3">
        {"PAGUE\nNO PIX"}
      </InkTitle>

      {/* No desktop o valor senta no pé da capa, na mesma linha do botão de enviar. */}
      <section className="mt-7 border-b-2 border-blue pb-5 lg:mt-auto lg:pt-10">
        <p className="semi text-[17px] font-semibold text-ink-soft">
          {plural(participant.quotas, "cota", "cotas")} × {brl(edition.quotaPrice)}
        </p>
        <p className="display mt-1 text-[24cqi] leading-[0.8] text-ink">{brl(total)}</p>
        <p className="mt-3 text-[15px] leading-snug text-ink-soft">
          Mande exatamente esse valor, para o pagamento bater com as suas cotas.
        </p>
      </section>
    </Sheet>
  );
}
