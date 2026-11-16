// Tipos da recomendação legada (recomendacao.js). Formatos do app antigo.

export type SonoLegado = Record<string, { h: number; q?: number | null; score?: number | null }>;
export type SerieLegado = { kg: number; reps: number; rir: number | null };
export type SessaoLegado = {
  tipo: "forca" | "cond";
  data: string;
  treinoId: string | null;
  energia: number | null;
  dorMusc: number | null;
  dorArt: { sim: boolean; ex: string[] };
  ex: { id: string; cat: "comp" | "iso"; series: SerieLegado[] }[];
  cond?: { tempoTotal: number | null };
};
export type ProntidaoLegado = {
  nivel: "verde" | "amarelo" | "vermelho";
  motivo: string;
  semSono?: boolean;
  media: number | null;
  noite: number | null;
  noites: number;
  criticas: number;
};
export type SugestaoForcaLegado = {
  kg: number | null;
  reps: string;
  series: number;
  tipo: "primeira" | "dor" | "manter" | "subir" | "reduzir" | "alternativa" | "deload";
  motivo: string;
  ultima: SerieLegado[] | null;
  estagnado: boolean;
};
export type CampoRegra = { g: string; k: string; rot: string; un: string; min: number; max: number; passo: number };
export type CalibragemLegado = {
  pronto: boolean;
  semEfeito?: boolean;
  sessoes: number;
  semanas: number;
  minSessoes: number;
  minSemanas: number;
  limiar?: number;
  queda?: number;
  abaixo?: number;
  acima?: number;
  sugestao?: { sonoAmareloNoite: number; sonoVerdeNoite: number; sonoCritico: number };
};

export const Rec: {
  PADRAO: Record<string, number>;
  CAMPOS: CampoRegra[];
  faixa(r: string): { min: number; max: number } | null;
  incremento(cat: string, equip: string, cfg: Record<string, number>): number;
  incrementoFinal(cat: string, equip: string, topKg: number, cfg: Record<string, number>): number;
  e1rm(s: SerieLegado): number;
  melhor(series: SerieLegado[]): SerieLegado | null;
  prontidao(a: { sono: SonoLegado; sessoes: SessaoLegado[]; cfg: Record<string, number>; hoje: string }): ProntidaoLegado;
  sugerirForca(a: {
    item: { exId: string; series: number; reps: string; cat: "comp" | "iso" };
    info: { tipo: "comp" | "iso"; equip: string; semCarga?: number | boolean; var?: string };
    sessoes: SessaoLegado[];
    prontidao: ProntidaoLegado | null;
    cfg: Record<string, number>;
    deload: boolean;
  }): SugestaoForcaLegado;
  sugerirCond(a: {
    treino: { id: string; voltas: number; descanso: number };
    sessoes: SessaoLegado[];
    prontidao: ProntidaoLegado | null;
  }): { voltas: number; descanso: number; motivo: string };
  semanasSeguidas(a: { sessoes: SessaoLegado[]; hoje: string; deloads: string[] }): number;
  calibrarSono(a: { sono: SonoLegado; sessoes: SessaoLegado[]; cfg: Record<string, number>; hoje: string }): CalibragemLegado;
  estagnado(hist: unknown[], cfg: Record<string, number>): boolean;
  historico(exId: string, sessoes: SessaoLegado[]): { s: SessaoLegado; e: SessaoLegado["ex"][number] }[];
};
