import { brlShort, dayMonth, pad2, plural } from "./format";
import type { RankEntry } from "./rules";
import type { Edition, Game } from "./types";

/**
 * Imagem para postar no grupo: jogos, ranking e quem está no bolão, no visual riso da plataforma.
 * Desenhada em canvas no navegador, sem biblioteca. Quem chama decide o que incluir.
 */

const W = 1080;
const PAD = 72;
const COLOR = { paper: "#fbfaf6", pink: "#ff48b0", blue: "#0078bf", blueDeep: "#005a91", yellow: "#ffe800", ink: "#1a1a1a", soft: "#4a4a48" };

export type ExportData = {
  edition: Edition;
  games: Game[];
  ranking: RankEntry[];
  names: string[];
};

function families() {
  const style = getComputedStyle(document.body);
  const pick = (v: string, fallback: string) => {
    const f = style.getPropertyValue(v).trim();
    return f ? `${f}, ${fallback}` : fallback;
  };
  return {
    display: pick("--font-anybody", "Impact, sans-serif"),
    sans: pick("--font-archivo", "system-ui, sans-serif"),
  };
}

type Ctx = CanvasRenderingContext2D;

function draw(ctx: Ctx, data: ExportData, dry: boolean) {
  const f = families();
  const { edition, games, ranking, names } = data;
  let y = PAD;

  const text = (s: string, x: number, size: number, weight: number, color: string, family = f.sans) => {
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "alphabetic";
    if (!dry) ctx.fillText(s, x, y);
  };

  const heading = (label: string) => {
    y += 64;
    text(label.toUpperCase(), PAD, 30, 900, COLOR.blueDeep, f.display);
    y += 18;
    if (!dry) {
      ctx.fillStyle = COLOR.blue;
      ctx.fillRect(PAD, y, W - PAD * 2, 3);
    }
    y += 40;
  };

  const chip = (x: number, cy: number, r: number, label: string, fill: string) => {
    if (dry) return;
    ctx.beginPath();
    ctx.arc(x + r, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.font = `800 ${Math.round(r * 0.95)}px ${f.sans}`;
    ctx.fillStyle = COLOR.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + r, cy + 2);
    ctx.textAlign = "left";
  };

  // Capa
  y += 70;
  text("BOLÃO DA MEGA", PAD, 112, 900, COLOR.pink, f.display);
  y += 54;
  text(edition.name, PAD, 40, 700, COLOR.ink);
  y += 44;
  text(`Mega da Virada · sorteio ${dayMonth(edition.drawDate)}`, PAD, 30, 500, COLOR.soft);

  // Jogos
  if (games.length) {
    heading("Jogos");
    const r = 26;
    const gap = 10;
    const perRow = Math.floor((W - PAD * 2 + gap) / (r * 2 + gap));
    for (const g of games) {
      text(`Jogo ${g.index + 1}`, PAD, 30, 800, COLOR.ink);
      const meta = `${g.size} números · ${brlShort(g.cost)}`;
      ctx.font = `500 26px ${f.sans}`;
      if (!dry) {
        ctx.fillStyle = COLOR.soft;
        ctx.textAlign = "right";
        ctx.fillText(meta, W - PAD, y);
        ctx.textAlign = "left";
      }
      y += 22;
      for (let i = 0; i < g.numbers.length; i += perRow) {
        const row = g.numbers.slice(i, i + perRow);
        row.forEach((n, k) => chip(PAD + k * (r * 2 + gap), y + r, r, pad2(n), COLOR.yellow));
        y += r * 2 + gap;
      }
      y += 26;
    }
  }

  // Ranking
  if (ranking.length) {
    heading("Ranking de votos");
    const cols = 4;
    const cell = (W - PAD * 2) / cols;
    ranking.forEach((r, i) => {
      const col = i % cols;
      const x = PAD + col * cell;
      chip(x, y + 24, 24, pad2(r.number), i < 6 ? COLOR.pink : COLOR.yellow);
      ctx.font = `600 26px ${f.sans}`;
      if (!dry) {
        ctx.fillStyle = COLOR.soft;
        ctx.fillText(plural(r.votes, "voto", "votos"), x + 60, y + 33);
      }
      if (col === cols - 1 || i === ranking.length - 1) y += 66;
    });
  }

  // Quem está no bolão
  if (names.length) {
    heading(`Quem está no bolão · ${names.length}`);
    ctx.font = `500 28px ${f.sans}`;
    const maxW = W - PAD * 2;
    let line = "";
    const lines: string[] = [];
    for (const n of names) {
      const next = line ? `${line} · ${n}` : n;
      if (ctx.measureText(next).width > maxW && line) {
        lines.push(line);
        line = n;
      } else line = next;
    }
    if (line) lines.push(line);
    for (const l of lines) {
      text(l, PAD, 28, 500, COLOR.ink);
      y += 44;
    }
  }

  y += 40;
  return y + PAD - 40;
}

export async function renderResultImage(data: ExportData): Promise<Blob> {
  await document.fonts?.ready;
  const probe = document.createElement("canvas").getContext("2d")!;
  const height = Math.ceil(draw(probe, data, true));
  const scale = 1;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = COLOR.paper;
  ctx.fillRect(0, 0, W, height);
  draw(ctx, data, false);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Sem imagem."))), "image/png"));
}

export async function downloadResultImage(data: ExportData) {
  const blob = await renderResultImage(data);
  const file = new File([blob], `bolao-${data.edition.code.toLowerCase()}.png`, { type: "image/png" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
