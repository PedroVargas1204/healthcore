// Banco no celular (IndexedDB), um por conta. Tudo é lido daqui; a nuvem é só a cópia.

import Dexie, { type Table } from "dexie";
import type {
  Calibracao,
  Configuracoes,
  Deload,
  DiaSemana,
  ExercicioProprio,
  Medida,
  Noite,
  Perfil,
  Sessao,
  SessaoAtiva,
  Treino,
} from "../dominio/tipos";

export type TabelaRaiz = "treinos" | "sessoes" | "noites" | "medidas" | "deloads" | "calibracoes" | "exercicios_proprios";
export type TabelaSync = TabelaRaiz | "semana" | "perfis" | "configuracoes" | "sessao_rascunho";

export type ItemFila = {
  /** "tabela:id"; uma entrada por registro: a última mudança vence. */
  chave: string;
  tabela: TabelaSync;
  id: string;
  op: "salvar" | "apagar";
  em: number;
  tentativas: number;
  erro?: string;
};

export type Unico =
  | { chave: "perfil"; valor: Perfil }
  | { chave: "configuracoes"; valor: Configuracoes }
  | { chave: "rascunho"; valor: SessaoAtiva };

export type Meta = { chave: string; valor: string | number | boolean | null };

export class BancoLocal extends Dexie {
  treinos!: Table<Treino, string>;
  sessoes!: Table<Sessao, string>;
  noites!: Table<Noite, string>;
  medidas!: Table<Medida, string>;
  deloads!: Table<Deload, string>;
  calibracoes!: Table<Calibracao, string>;
  exercicios_proprios!: Table<ExercicioProprio, string>;
  semana!: Table<DiaSemana, number>;
  unicos!: Table<Unico, string>;
  fila!: Table<ItemFila, string>;
  meta!: Table<Meta, string>;

  constructor(nome: string) {
    super(nome);
    this.version(1).stores({
      treinos: "id, posicao",
      sessoes: "id, data, treino_id",
      noites: "id, data",
      medidas: "id, data",
      deloads: "id, inicio",
      calibracoes: "id, aplicada_em",
      exercicios_proprios: "id, chave",
      semana: "dia",
      unicos: "chave",
      fila: "chave, em",
      meta: "chave",
    });
  }
}

let atual: { uid: string; db: BancoLocal } | null = null;

export function abrirBanco(uid: string) {
  if (atual?.uid === uid) return atual.db;
  atual?.db.close();
  const db = new BancoLocal(`healthcore-${uid}`);
  atual = { uid, db };
  return db;
}

export function banco(): BancoLocal {
  if (!atual) throw new Error("Banco local ainda não foi aberto.");
  return atual.db;
}

export const uidAtual = () => atual?.uid ?? null;

export async function fecharEApagarBanco(uid: string) {
  if (atual?.uid === uid) {
    atual.db.close();
    atual = null;
  }
  await Dexie.delete(`healthcore-${uid}`);
}

export const PERFIL_VAZIO: Perfil = { nome: "", altura_cm: null, modelo: null, onboarding_concluido: false };
export const CONFIG_VAZIA: Configuracoes = { regras: {}, som_descanso: true, deload_dispensado_ate: null, calibracao_dispensada_ate: null };
