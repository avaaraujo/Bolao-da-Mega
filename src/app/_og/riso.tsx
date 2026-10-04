import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** As tintas do zine, para as imagens geradas (ícone e compartilhamento). */
export const INK = {
  paper: "#fbfaf6",
  pink: "#ff48b0",
  blue: "#0078bf",
  blueDeep: "#005a91",
  ink: "#1a1a1a",
};

/**
 * Falhas de tinta, como SVG: o renderizador das imagens não tem máscara nem blend.
 * Pontinhos cor de papel por cima de tudo: somem sobre o papel e furam as tintas, como a riso imprime.
 */
export function inkHoles(width: number, height: number, amount = 1) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><filter id="h" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.984  0 0 0 0 0.98  0 0 0 0 0.965  0 0 0 ${(4 * amount).toFixed(2)} -2.15"/></filter><rect width="100%" height="100%" filter="url(#h)"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Deslocamento de registro estável por número, o mesmo do carimbo do app. */
export function registration(n: number) {
  const sx = (((n * 37) % 7) - 3) * 0.6;
  const sy = (((n * 53) % 5) - 2) * 0.6;
  const sr = ((n * 29) % 11) - 5;
  return `translate(${sx * 1.6}px, ${sy * 1.6}px) rotate(${sr}deg)`;
}

/** Archivo entra em duas instâncias estáticas: 800 com largura 72 (rótulo) e 600 com largura 85 (dado). */
export async function fonts() {
  const dir = join(process.cwd(), "src/app/_og");
  const [poster, label, data] = await Promise.all([
    readFile(join(dir, "anybody-50-900.ttf")),
    readFile(join(dir, "archivo-72-800.ttf")),
    readFile(join(dir, "archivo-85-600.ttf")),
  ]);
  return [
    { name: "Anybody", data: poster, weight: 900 as const, style: "normal" as const },
    { name: "Archivo", data: label, weight: 800 as const, style: "normal" as const },
    { name: "Archivo", data, weight: 600 as const, style: "normal" as const },
  ];
}
