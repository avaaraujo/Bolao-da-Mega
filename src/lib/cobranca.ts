import { brlShort, firstName } from "./format";
import type { Participant } from "./types";

/** Dias sem mandar o Pix a partir dos quais a inscrição conta como atrasada. */
export const LATE_AFTER_DAYS = 2;

export function isLate(p: Participant, now = Date.now()) {
  return p.payment === "aguardando" && now - new Date(p.createdAt).getTime() > LATE_AFTER_DAYS * 86_400_000;
}

/** Número de WhatsApp (com 55) tirado do campo de contato, ou null se o contato não for um telefone. */
export function whatsappNumber(contact: string) {
  if (contact.includes("@")) return null;
  const digits = contact.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits;
  return null;
}

export function reminderText(p: Participant, quotaPrice: number, bolaoName: string, link: string) {
  return `Oi, ${firstName(p.name)}! Falta o Pix de ${brlShort(p.quotas * quotaPrice)} do ${bolaoName}. Dá para pagar e mandar o comprovante por aqui: ${link}`;
}

export function reminderUrl(p: Participant, text: string) {
  const phone = whatsappNumber(p.contact);
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : null;
}
