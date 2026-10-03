const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const intFmt = new Intl.NumberFormat("pt-BR");

export const brl = (v: number) => brlFmt.format(v);
/** R$ sem centavos quando o valor é inteiro: R$ 6.120 */
export const brlShort = (v: number) => (Number.isInteger(v) ? `R$ ${intFmt.format(v)}` : brl(v));
export const pad2 = (n: number) => String(n).padStart(2, "0");

export function dayMonth(iso: string) {
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}`;
}

export function dateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
