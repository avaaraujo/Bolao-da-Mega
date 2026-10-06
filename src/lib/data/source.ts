import type { Edition, Game, Participant, PaymentStatus, Receipt } from "../types";

export type Snapshot = {
  edition: Edition;
  participants: Participant[];
  games: Game[] | null; // jogos confirmados pelo organizador
  /** O usuário logado é o dono desta sala (libera a área do organizador). */
  isOwner: boolean;
};

/**
 * Tudo que as telas de UMA sala precisam. Em modo demo roda no localStorage;
 * com Supabase ativo, fala com o banco. Cada sala é um mundo isolado, identificado pelo código.
 */
export interface DataSource {
  kind: "mock" | "supabase";
  /** `null` quando não existe sala com esse código. */
  load(): Promise<Snapshot | null>;
  subscribe(onChange: () => void): () => void;

  createParticipant(input: { name: string; contact: string; quotas: number }): Promise<Participant>;
  attachReceipt(token: string, receipt: Receipt): Promise<Participant>;
  setNumbers(token: string, numbers: number[]): Promise<Participant>;

  setPayment(id: string, status: PaymentStatus, reason?: string): Promise<Participant>;
  updateEdition(patch: Partial<Edition>): Promise<Edition>;
  saveGames(games: Game[] | null): Promise<void>;

  /** Só no modo demo: volta aos dados de exemplo. */
  reset?(): Promise<void>;
}

export type AdminUser = { id: string; email: string };

export type NewBolao = {
  name: string;
  quotaPrice: number;
  betPrice: number;
  pixKey: string;
  pixHolder: string;
  deadline: string;
  drawDate: string;
};

/** Parte da plataforma, fora de qualquer sala: contas de organizador e lista de bolões. */
export interface Platform {
  kind: "mock" | "supabase";
  getUser(): Promise<AdminUser | null>;
  onAuthChange(cb: () => void): () => void;
  /** `confirm: true` quando o Supabase exige confirmar o e-mail antes do primeiro login. */
  signUp(email: string, password: string): Promise<{ confirm: boolean }>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  listMyBolaos(): Promise<Edition[]>;
  createBolao(input: NewBolao): Promise<Edition>;
  /** Fonte de dados de uma sala. Instâncias são reaproveitadas por código. */
  source(code: string): DataSource;
}
