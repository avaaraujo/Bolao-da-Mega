/**
 * Pix "copia e cola" (BR Code estático do Banco Central) com a chave do organizador e o valor das cotas.
 * Quem lê o QR no app do banco já vê chave, nome e valor preenchidos.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CPF_CNPJ_FORMATADO = /^\d{2,3}\.\d{3}\.\d{3}[-/]\d{2,4}(-\d{2})?$/;

/**
 * Deixa a chave no formato que o banco espera: e-mail em minúsculas, CPF/CNPJ só com dígitos,
 * telefone com +55. Chave só com dígitos fica como foi digitada (CPF e celular se confundem).
 */
export function normalizePixKey(raw: string) {
  const key = raw.trim();
  if (key.includes("@")) return key.toLowerCase();
  if (UUID.test(key)) return key.toLowerCase();
  if (key.startsWith("+")) return `+${key.replace(/\D/g, "")}`;
  if (CPF_CNPJ_FORMATADO.test(key)) return key.replace(/\D/g, "");
  if (/[()]/.test(key)) return `+55${key.replace(/\D/g, "")}`;
  return key;
}

function field(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** Só letras, números e espaço, sem acento, em maiúsculas: o que o BR Code aceita em nome e cidade. */
function plain(text: string, max: number) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, max);
}

/** CRC16/CCITT-FALSE, exigido no fim do BR Code. */
export function crc16(text: string) {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function pixPayload({ key, holder, amount }: { key: string; holder: string; amount: number }) {
  const account = field("00", "br.gov.bcb.pix") + field("01", normalizePixKey(key));
  const body =
    field("00", "01") +
    field("01", "11") +
    field("26", account) +
    field("52", "0000") +
    field("53", "986") +
    field("54", amount.toFixed(2)) +
    field("58", "BR") +
    field("59", plain(holder, 25) || "BOLAO") +
    field("60", "BRASIL") +
    field("62", field("05", "***")) +
    "6304";
  return body + crc16(body);
}
