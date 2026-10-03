import { seedSnapshot } from "./seed";
import type { DataSource, Snapshot } from "./source";
import type { Participant } from "../types";

const KEY = "bolao-da-mega:demo:v1";

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Snapshot;
  } catch {}
  const fresh = seedSnapshot();
  write(fresh);
  return fresh;
}

function write(snapshot: Snapshot) {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Cota do localStorage estourada (comprovantes grandes): guarda sem as imagens.
    const slim: Snapshot = {
      ...snapshot,
      participants: snapshot.participants.map((p) =>
        p.receipt ? { ...p, receipt: { ...p.receipt, dataUrl: null } } : p,
      ),
    };
    localStorage.setItem(KEY, JSON.stringify(slim));
  }
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((fn) => fn());
}

function token() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
}

function mutateParticipant(match: (p: Participant) => boolean, change: (p: Participant) => Participant): Participant {
  const snap = read();
  const i = snap.participants.findIndex(match);
  if (i < 0) throw new Error("Participante não encontrado.");
  const next = change(snap.participants[i]);
  snap.participants[i] = next;
  write(snap);
  emit();
  return next;
}

export function createMockSource(): DataSource {
  return {
    kind: "mock",
    async load() {
      return read();
    },
    subscribe(onChange) {
      listeners.add(onChange);
      const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    async createParticipant({ name, contact, quotas }) {
      const snap = read();
      if (snap.edition.status !== "aberta") throw new Error("As inscrições estão fechadas.");
      const now = new Date().toISOString();
      const p: Participant = {
        id: `p${Date.now().toString(36)}`,
        token: token(),
        name: name.trim(),
        contact: contact.trim(),
        quotas,
        numbers: [],
        numbersAt: null,
        receipt: null,
        payment: "aguardando",
        rejectReason: null,
        createdAt: now,
      };
      snap.participants.push(p);
      write(snap);
      emit();
      return p;
    },
    async attachReceipt(tok, receipt) {
      return mutateParticipant(
        (p) => p.token === tok,
        (p) => ({ ...p, receipt, payment: "em_analise", rejectReason: null }),
      );
    },
    async setNumbers(tok, numbers) {
      if (read().edition.status !== "aberta") throw new Error("Os números não podem mais ser alterados.");
      return mutateParticipant(
        (p) => p.token === tok,
        (p) => ({ ...p, numbers: [...numbers].sort((a, b) => a - b), numbersAt: new Date().toISOString() }),
      );
    },
    async setPayment(id, status, reason) {
      return mutateParticipant(
        (p) => p.id === id,
        (p) => ({ ...p, payment: status, rejectReason: status === "recusado" ? reason?.trim() || null : null }),
      );
    },
    async updateEdition(patch) {
      const snap = read();
      snap.edition = { ...snap.edition, ...patch };
      write(snap);
      emit();
      return snap.edition;
    },
    async saveGames(games) {
      const snap = read();
      snap.games = games;
      write(snap);
      emit();
    },
    async reset() {
      write(seedSnapshot());
      emit();
    },
  };
}
