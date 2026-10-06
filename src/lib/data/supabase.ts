import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AdminUser, DataSource, NewBolao, Platform, ReceiptCheck, Snapshot } from "./source";
import type { AiCheckRecord } from "../pix-check";
import type { Edition, Game, Participant, PaymentStatus, Receipt } from "../types";

/**
 * Implementação Supabase. O schema está em supabase/schema.sql.
 *  - Organizador: Supabase Auth (e-mail e senha) + RLS por dono (`bolaos.owner_id`).
 *  - Participante: sem conta; só funções (RPC) que validam o código da sala ou o token pessoal.
 *  - Comprovantes: bucket privado "comprovantes", caminho `<bolao_id>/<token>/<arquivo>`.
 * Variáveis: NEXT_PUBLIC_DATA_SOURCE=supabase, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

const MINE = "bolao-da-mega:mine"; // tokens das inscrições feitas neste aparelho
const POLL_MS = 15_000;
const BUCKET = "comprovantes";

type Row = Record<string, unknown>;

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase sem configuração: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    client = createClient(url, key);
  }
  return client;
}

function myTokens(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(MINE) ?? "[]");
    return Array.isArray(list) ? list.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

/** Guarda o token antes de recarregar: senão a primeira leitura depois da inscrição ainda não "vê" a pessoa. */
function rememberMine(token: string) {
  try {
    const list = myTokens();
    if (!list.includes(token)) localStorage.setItem(MINE, JSON.stringify([...list, token]));
  } catch {}
}

async function callReview(body: Record<string, unknown>, bearer?: string): Promise<ReceiptCheck> {
  try {
    const res = await fetch("/api/comprovantes/conferir", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { status: "error", message: data.error ?? "Não deu para conferir agora." };
    return data as ReceiptCheck;
  } catch {
    return { status: "error", message: "Sem conexão com a conferência automática." };
  }
}

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message);
}

function editionFromRow(r: Row): Edition {
  return {
    id: String(r.id),
    code: String(r.code),
    name: String(r.name),
    quotaPrice: Number(r.quota_price),
    betPrice: Number(r.bet_price),
    pixKey: String(r.pix_key ?? ""),
    pixHolder: String(r.pix_holder ?? ""),
    deadline: String(r.deadline),
    drawDate: String(r.draw_date),
    status: r.status as Edition["status"],
  };
}

function participantFromRow(r: Row, receiptUrl: string | null): Participant {
  return {
    id: String(r.id),
    token: String(r.token),
    name: String(r.name),
    contact: String(r.contact ?? ""),
    quotas: Number(r.quotas),
    numbers: (r.numbers as number[]) ?? [],
    numbersAt: (r.numbers_at as string | null) ?? null,
    receipt: r.receipt_name
      ? {
          name: String(r.receipt_name),
          type: String(r.receipt_type ?? ""),
          dataUrl: receiptUrl,
          uploadedAt: String(r.receipt_uploaded_at ?? ""),
        }
      : null,
    payment: r.payment as PaymentStatus,
    rejectReason: (r.reject_reason as string | null) ?? null,
    createdAt: String(r.created_at),
    // Resultado de um comprovante anterior não vale para o atual.
    aiCheck: (r.ai_check as AiCheckRecord | null)?.path === r.receipt_path ? (r.ai_check as AiCheckRecord) : null,
  };
}

// Links assinados reaproveitados entre recargas: um link novo a cada 15 s faria a imagem piscar.
const SIGNED_S = 3600;
const signedCache = new Map<string, { url: string; until: number }>();

/** Visão do dono: tudo, com links assinados (1 h) para os comprovantes. */
async function loadAsOwner(code: string, uid: string): Promise<Snapshot | null> {
  const { data: b, error } = await db().from("bolaos").select("*").eq("code", code).eq("owner_id", uid).maybeSingle();
  fail(error);
  if (!b) return null;
  const { data: rows, error: perr } = await db()
    .from("participants")
    .select("*")
    .eq("bolao_id", b.id)
    .order("created_at");
  fail(perr);
  const paths = (rows ?? []).map((r) => r.receipt_path as string | null).filter((p): p is string => !!p);
  const now = Date.now();
  const missing = paths.filter((p) => (signedCache.get(p)?.until ?? 0) < now);
  if (missing.length) {
    const { data: signed } = await db().storage.from(BUCKET).createSignedUrls(missing, SIGNED_S);
    signed?.forEach((s) => s.path && s.signedUrl && signedCache.set(s.path, { url: s.signedUrl, until: now + (SIGNED_S - 300) * 1000 }));
  }
  const urls = new Map(paths.map((p) => [p, signedCache.get(p)?.url ?? ""] as const));
  return {
    edition: editionFromRow(b),
    games: (b.games as Game[] | null) ?? null,
    participants: (rows ?? []).map((r) => participantFromRow(r, urls.get(r.receipt_path as string) || null)),
    isOwner: true,
  };
}

async function loadPublic(code: string): Promise<Snapshot | null> {
  const { data, error } = await db().rpc("get_public_snapshot", { p_code: code, p_tokens: myTokens() });
  fail(error);
  if (!data) return null;
  const d = data as { bolao: Edition; games: Game[] | null; participants: Participant[] };
  return { edition: d.bolao, games: d.games ?? null, participants: d.participants, isOwner: false };
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

function createSource(code: string): DataSource {
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((fn) => fn());
  let last: Snapshot | null = null;

  async function load(): Promise<Snapshot | null> {
    const { data } = await db().auth.getSession();
    const uid = data.session?.user.id;
    last = (uid ? await loadAsOwner(code, uid) : null) ?? (await loadPublic(code));
    return last;
  }

  const ownParticipant = async (token: string) => {
    const snap = await load();
    const p = snap?.participants.find((x) => x.token === token);
    if (!p) throw new Error("Participante não encontrado.");
    return p;
  };

  return {
    kind: "supabase",
    load,
    subscribe(onChange) {
      listeners.add(onChange);
      const timer = setInterval(() => document.visibilityState === "visible" && onChange(), POLL_MS);
      const onFocus = () => onChange();
      window.addEventListener("focus", onFocus);
      return () => {
        listeners.delete(onChange);
        clearInterval(timer);
        window.removeEventListener("focus", onFocus);
      };
    },
    async createParticipant({ name, contact, quotas }) {
      const { data, error } = await db().rpc("join_bolao", {
        p_code: code,
        p_name: name,
        p_contact: contact,
        p_quotas: quotas,
      });
      fail(error);
      rememberMine((data as Participant).token);
      emit();
      return data as Participant;
    },
    async attachReceipt(token, receipt: Receipt) {
      const bolaoId = last?.edition.id ?? (await load())?.edition.id;
      if (!bolaoId) throw new Error("Bolão não encontrado.");
      if (!receipt.dataUrl) throw new Error("Não deu para ler o arquivo. Tente uma foto ou um PDF menor.");
      const blob = await dataUrlToBlob(receipt.dataUrl);
      const safe = receipt.name.replace(/[^\w.-]+/g, "_").slice(-60) || "comprovante";
      const path = `${bolaoId}/${token}/${Date.now()}-${safe}`;
      const up = await db().storage.from(BUCKET).upload(path, blob, { contentType: blob.type || receipt.type });
      fail(up.error);
      const { error } = await db().rpc("attach_receipt", {
        p_token: token,
        p_path: path,
        p_name: receipt.name,
        // Fotos são reduzidas para JPEG antes do envio: vale o tipo do arquivo que subiu.
        p_type: blob.type || receipt.type,
      });
      fail(error);
      emit();
      return ownParticipant(token);
    },
    async checkReceipt(token) {
      const result = await callReview({ token });
      emit();
      return result;
    },
    async recheckReceipt(participantId, force = false) {
      const { data } = await db().auth.getSession();
      const bearer = data.session?.access_token;
      if (!bearer) return { status: "error", message: "Entre de novo como organizador." };
      const result = await callReview({ participantId, force }, bearer);
      emit();
      return result;
    },
    async setNumbers(token, numbers) {
      const { error } = await db().rpc("set_numbers", { p_token: token, p_numbers: numbers });
      fail(error);
      emit();
      return ownParticipant(token);
    },
    async setPayment(id, status, reason) {
      const { error } = await db()
        .from("participants")
        .update({ payment: status, reject_reason: status === "recusado" ? reason?.trim() || null : null })
        .eq("id", id);
      fail(error);
      const snap = await load();
      emit();
      return snap!.participants.find((p) => p.id === id)!;
    },
    async updateEdition(patch) {
      const row: Row = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.quotaPrice !== undefined) row.quota_price = patch.quotaPrice;
      if (patch.betPrice !== undefined) row.bet_price = patch.betPrice;
      if (patch.pixKey !== undefined) row.pix_key = patch.pixKey;
      if (patch.pixHolder !== undefined) row.pix_holder = patch.pixHolder;
      if (patch.deadline !== undefined) row.deadline = patch.deadline;
      if (patch.drawDate !== undefined) row.draw_date = patch.drawDate;
      if (patch.status !== undefined) row.status = patch.status;
      const { data, error } = await db().from("bolaos").update(row).eq("code", code).select().single();
      fail(error);
      emit();
      return editionFromRow(data);
    },
    async saveGames(games) {
      const { error } = await db().from("bolaos").update({ games }).eq("code", code);
      fail(error);
      emit();
    },
  };
}

const sources = new Map<string, DataSource>();

export function createSupabasePlatform(): Platform {
  return {
    kind: "supabase",
    async getUser(): Promise<AdminUser | null> {
      const { data } = await db().auth.getSession();
      const u = data.session?.user;
      return u ? { id: u.id, email: u.email ?? "" } : null;
    },
    onAuthChange(cb) {
      const { data } = db().auth.onAuthStateChange(() => cb());
      return () => data.subscription.unsubscribe();
    },
    async signUp(email, password) {
      const { data, error } = await db().auth.signUp({ email, password });
      fail(error);
      return { confirm: !data.session };
    },
    async signIn(email, password) {
      const { error } = await db().auth.signInWithPassword({ email, password });
      fail(error);
    },
    async signOut() {
      await db().auth.signOut();
    },
    async listMyBolaos() {
      const { data, error } = await db().from("bolaos").select("*").order("created_at", { ascending: false });
      fail(error);
      return (data ?? []).map(editionFromRow);
    },
    async createBolao(input: NewBolao) {
      const { data, error } = await db().rpc("create_bolao", {
        p_name: input.name,
        p_quota_price: input.quotaPrice,
        p_bet_price: input.betPrice,
        p_pix_key: input.pixKey,
        p_pix_holder: input.pixHolder,
        p_deadline: input.deadline,
        p_draw_date: input.drawDate,
      });
      fail(error);
      return editionFromRow(data);
    },
    async aiReviewEnabled() {
      const { data } = await db().from("ai_reviewers").select("user_id").limit(1);
      return !!data?.length;
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
