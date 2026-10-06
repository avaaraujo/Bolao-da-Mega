import { DEMO_CODE, seedSnapshot } from "./seed";
import type { AdminUser, DataSource, NewBolao, Platform, Snapshot } from "./source";
import type { Edition, Participant } from "../types";

/** Modo demo: várias salas no localStorage, cada uma no seu próprio espaço. Sem senha de verdade. */
const ROOMS = "bolao-da-mega:demo:rooms:v2";
const USER = "bolao-da-mega:demo:user";
const roomKey = (code: string) => `bolao-da-mega:demo:room:v2:${code.toUpperCase()}`;

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((fn) => fn());
}

function randomToken(len = 16) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, len);
}

function readRooms(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(ROOMS) ?? "null");
    if (Array.isArray(list)) return list;
  } catch {}
  // Primeira visita: a sala de exemplo já existe.
  writeRooms([DEMO_CODE]);
  return [DEMO_CODE];
}

function writeRooms(codes: string[]) {
  try {
    localStorage.setItem(ROOMS, JSON.stringify(codes));
  } catch {}
}

function read(code: string): Snapshot | null {
  const key = roomKey(code);
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as Snapshot;
  } catch {}
  if (code.toUpperCase() === DEMO_CODE && readRooms().includes(DEMO_CODE)) {
    const fresh = seedSnapshot();
    write(code, fresh);
    return fresh;
  }
  return null;
}

function write(code: string, snapshot: Snapshot) {
  const key = roomKey(code);
  try {
    localStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // Cota do localStorage estourada (comprovantes grandes): guarda sem as imagens.
    const slim: Snapshot = {
      ...snapshot,
      participants: snapshot.participants.map((p) =>
        p.receipt ? { ...p, receipt: { ...p.receipt, dataUrl: null } } : p,
      ),
    };
    localStorage.setItem(key, JSON.stringify(slim));
  }
}

function must(code: string): Snapshot {
  const snap = read(code);
  if (!snap) throw new Error("Bolão não encontrado.");
  return snap;
}

function mutateParticipant(
  code: string,
  match: (p: Participant) => boolean,
  change: (p: Participant) => Participant,
): Participant {
  const snap = must(code);
  const i = snap.participants.findIndex(match);
  if (i < 0) throw new Error("Participante não encontrado.");
  const next = change(snap.participants[i]);
  snap.participants[i] = next;
  write(code, snap);
  emit();
  return next;
}

function createSource(code: string): DataSource {
  const key = roomKey(code);
  return {
    kind: "mock",
    async load() {
      return read(code);
    },
    subscribe(onChange) {
      listeners.add(onChange);
      const onStorage = (e: StorageEvent) => e.key === key && onChange();
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    async createParticipant({ name, contact, quotas }) {
      const snap = must(code);
      if (snap.edition.status !== "aberta") throw new Error("As inscrições estão fechadas.");
      const p: Participant = {
        id: `p${Date.now().toString(36)}${randomToken(4)}`,
        token: randomToken(),
        name: name.trim(),
        contact: contact.trim(),
        quotas,
        numbers: [],
        numbersAt: null,
        receipt: null,
        payment: "aguardando",
        rejectReason: null,
        createdAt: new Date().toISOString(),
      };
      snap.participants.push(p);
      write(code, snap);
      emit();
      return p;
    },
    async attachReceipt(tok, receipt) {
      return mutateParticipant(
        code,
        (p) => p.token === tok,
        (p) => ({ ...p, receipt, payment: "em_analise", rejectReason: null }),
      );
    },
    async setNumbers(tok, numbers) {
      if (must(code).edition.status !== "aberta") throw new Error("Os números não podem mais ser alterados.");
      return mutateParticipant(
        code,
        (p) => p.token === tok,
        (p) => ({ ...p, numbers: [...numbers].sort((a, b) => a - b), numbersAt: new Date().toISOString() }),
      );
    },
    async setPayment(id, status, reason) {
      return mutateParticipant(
        code,
        (p) => p.id === id,
        (p) => ({ ...p, payment: status, rejectReason: status === "recusado" ? reason?.trim() || null : null }),
      );
    },
    async updateEdition(patch) {
      const snap = must(code);
      snap.edition = { ...snap.edition, ...patch };
      write(code, snap);
      emit();
      return snap.edition;
    },
    async saveGames(games) {
      const snap = must(code);
      snap.games = games;
      write(code, snap);
      emit();
    },
    async reset() {
      if (code.toUpperCase() === DEMO_CODE) write(code, seedSnapshot());
      else {
        const snap = must(code);
        write(code, { ...snap, participants: [], games: null });
      }
      emit();
    },
  };
}

function readUser(): AdminUser | null {
  try {
    return JSON.parse(localStorage.getItem(USER) ?? "null");
  } catch {
    return null;
  }
}

const sources = new Map<string, DataSource>();

export function createMockPlatform(): Platform {
  const authListeners = new Set<() => void>();
  const notifyAuth = () => authListeners.forEach((fn) => fn());
  return {
    kind: "mock",
    async getUser() {
      return readUser();
    },
    onAuthChange(cb) {
      authListeners.add(cb);
      const onStorage = (e: StorageEvent) => e.key === USER && cb();
      window.addEventListener("storage", onStorage);
      return () => {
        authListeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    async signUp(email) {
      localStorage.setItem(USER, JSON.stringify({ id: "demo", email }));
      notifyAuth();
      return { confirm: false };
    },
    async signIn(email) {
      localStorage.setItem(USER, JSON.stringify({ id: "demo", email }));
      notifyAuth();
    },
    async signOut() {
      localStorage.removeItem(USER);
      notifyAuth();
    },
    async listMyBolaos() {
      return readRooms()
        .map((c) => read(c)?.edition)
        .filter((e): e is Edition => !!e);
    },
    async createBolao(input: NewBolao) {
      const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
      const prefix = input.name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
      const bytes = crypto.getRandomValues(new Uint8Array(4));
      const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
      const code = `${prefix.length >= 3 ? prefix : "BOLAO"}-${suffix}`;
      const edition: Edition = { ...input, id: code, code, name: input.name.trim(), status: "aberta" };
      write(code, { edition, participants: [], games: null, isOwner: true });
      writeRooms([...readRooms(), code]);
      emit();
      return edition;
    },
    source(code) {
      const k = code.toUpperCase();
      let s = sources.get(k);
      if (!s) {
        s = createSource(k);
        sources.set(k, s);
      }
      return s;
    },
  };
}
