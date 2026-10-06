export type EditionStatus = "rascunho" | "aberta" | "fechada" | "apostada";

export type Edition = {
  id: string;
  code: string; // código da sala, ex.: FIRMA-7K3Q
  name: string;
  quotaPrice: number; // valor da cota em reais
  betPrice: number; // preço da aposta simples (6 números)
  pixKey: string;
  pixHolder: string;
  deadline: string; // ISO date (último dia de inscrição)
  drawDate: string; // ISO date do sorteio
  status: EditionStatus;
};

export type PaymentStatus = "aguardando" | "em_analise" | "aprovado" | "recusado";

export type Receipt = {
  name: string;
  type: string;
  dataUrl: string | null; // null quando o arquivo é grande demais para o modo demo
  uploadedAt: string;
};

export type Participant = {
  id: string;
  token: string; // link pessoal secreto
  name: string;
  contact: string;
  quotas: number;
  numbers: number[]; // 6 números, ordenados
  numbersAt: string | null; // quando os números foram enviados (desempate)
  receipt: Receipt | null;
  payment: PaymentStatus;
  rejectReason: string | null;
  createdAt: string;
};

export type Game = {
  index: number;
  size: number;
  cost: number;
  numbers: number[];
};
