import type { Edition, Game, Participant, PaymentStatus, Receipt } from "../types";

export type Snapshot = {
  edition: Edition;
  participants: Participant[];
  games: Game[] | null; // jogos confirmados pelo Avá
};

/**
 * Tudo que as telas precisam. Hoje roda em modo demo (localStorage);
 * em dezembro uma implementação Supabase entra no lugar sem mudar as telas.
 */
export interface DataSource {
  kind: "mock" | "supabase";
  load(): Promise<Snapshot>;
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
