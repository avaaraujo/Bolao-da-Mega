import type { Receipt } from "./types";

const MAX_SIDE = 1100;
const MAX_INLINE_BYTES = 1_200_000;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function shrinkImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

/** No modo demo o comprovante fica no navegador; imagens são reduzidas para caber. */
export async function prepareReceipt(file: File): Promise<Receipt> {
  let dataUrl: string | null = null;
  if (file.type.startsWith("image/")) {
    dataUrl = await shrinkImage(file).catch(() => null);
  } else if (file.size <= MAX_INLINE_BYTES) {
    dataUrl = await readAsDataUrl(file);
  }
  return { name: file.name, type: file.type, dataUrl, uploadedAt: new Date().toISOString() };
}

export const ACCEPTED_RECEIPTS = "image/*,application/pdf";
