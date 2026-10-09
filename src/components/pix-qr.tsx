"use client";

import { useMemo } from "react";
import { Copy } from "@phosphor-icons/react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { brl } from "@/lib/format";
import { pixPayload } from "@/lib/pix-qr";

/**
 * QR Code do Pix com chave e valor já preenchidos. Só aparece de tablet para cima:
 * no celular a pessoa copia a chave e paga no app do próprio banco.
 */
export function PixQr({ pixKey, holder, amount }: { pixKey: string; holder: string; amount: number }) {
  const payload = useMemo(() => pixPayload({ key: pixKey, holder, amount }), [pixKey, holder, amount]);
  const qr = useMemo(() => QRCode.create(payload, { errorCorrectionLevel: "M" }).modules, [payload]);
  const quiet = 2;
  const size = qr.size + quiet * 2;

  const path = useMemo(() => {
    let d = "";
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        if (qr.get(x, y)) d += `M${x + quiet} ${y + quiet}h1v1h-1z`;
      }
    }
    return d;
  }, [qr]);

  async function copyPayload() {
    try {
      await navigator.clipboard.writeText(payload);
      toast.success("Pix copia e cola copiado.");
    } catch {
      toast.error("Não deu para copiar. Use a chave acima.");
    }
  }

  return (
    <div className="mt-5 hidden items-center gap-5 md:flex">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`QR Code do Pix de ${brl(amount)}`}
        shapeRendering="crispEdges"
        className="size-40 shrink-0 rounded-md border-2 border-blue bg-white"
      >
        <path d={path} fill="#161616" />
      </svg>
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="semi text-[17px] font-bold leading-snug text-ink">Pague com o QR Code</p>
        <p className="text-[15px] leading-snug text-ink-soft">Abra o app do seu banco e aponte a câmera. O valor de {brl(amount)} já vem preenchido.</p>
        <button
          type="button"
          onClick={copyPayload}
          className="semi flex min-h-11 items-center gap-1.5 self-start text-[15px] font-bold text-blue-deep underline underline-offset-4"
        >
          <Copy size={18} weight="bold" aria-hidden="true" /> Copiar Pix copia e cola
        </button>
      </div>
    </div>
  );
}
