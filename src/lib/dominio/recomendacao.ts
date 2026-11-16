// Ponte entre os registros do app (banco) e as regras de recomendação (regras.ts), que trabalham com formatos enxutos.

import * as Rec from "./regras";
import type { Prontidao as ProntidaoRegras, RegrasCompletas, SessaoRegras, SonoRegras } from "./regras";
import { exInfo } from "./exercicios";
import type {
  Configuracoes,
  Deload,
  ExercicioProprio,
  NivelProntidao,
  Noite,
  ProntidaoBanco,
  Sessao,
  Treino,
  TreinoExercicio,
} from "./tipos";

export type Prontidao = ProntidaoRegras;
export type SessaoLegado = SessaoRegras;
export const PADRAO = Rec.PADRAO;
export const CAMPOS = Rec.CAMPOS;
export const faixaReps = Rec.faixa;

export const regrasCompletas = (c: Configuracoes | undefined): RegrasCompletas => ({ ...Rec.PADRAO, ...(c?.regras ?? {}) });

export const nivelParaBanco = (n: NivelProntidao): ProntidaoBanco => (n === "amarelo" ? "amarela" : n === "vermelho" ? "vermelha" : "verde");
export const nivelDoBanco = (n: ProntidaoBanco | null): NivelProntidao | null =>
  n === "amarela" ? "amarelo" : n === "vermelha" ? "vermelho" : n === "verde" ? "verde" : null;

export function sonoLegado(noites: Noite[]): SonoRegras {
  const s: SonoRegras = {};
  for (const n of noites) s[n.data] = { h: n.horas, q: n.qualidade, score: n.score };
  return s;
}

/** Sessões no formato antigo, da mais recente para a mais antiga. */
export function sessoesLegado(sessoes: Sessao[]): SessaoRegras[] {
  return [...sessoes]
    .sort((a, b) => b.data.localeCompare(a.data) || (b.inicio ?? "").localeCompare(a.inicio ?? ""))
    .map((s) => ({
      tipo: s.tipo,
      data: s.data,
      treinoId: s.treino_id,
      energia: s.energia,
      dorMusc: s.dor_muscular,
      dorArt: { sim: s.dor_articular, ex: s.dor_articular_ex },
      ex: s.exercicios.map((e) => ({ id: e.ex_chave, cat: e.cat, series: e.series.map((x) => ({ kg: Number(x.kg), reps: x.reps, rir: x.rir })) })),
      cond: s.tipo === "cond" ? { tempoTotal: s.tempo_total_s } : undefined,
    }));
}

export function prontidaoHoje(a: { noites: Noite[]; sessoes: Sessao[]; config: Configuracoes | undefined; hoje: string }): Prontidao {
  return Rec.prontidao({ sono: sonoLegado(a.noites), sessoes: sessoesLegado(a.sessoes), cfg: regrasCompletas(a.config), hoje: a.hoje });
}

export function sugerirForca(a: {
  item: TreinoExercicio;
  proprios: ExercicioProprio[];
  sessoesLeg: SessaoLegado[];
  prontidao: Prontidao | null;
  config: Configuracoes | undefined;
  deload: boolean;
}) {
  const info = exInfo(a.item.ex_chave, a.proprios);
  return Rec.sugerirForca({
    item: { exId: a.item.ex_chave, series: a.item.series, reps: a.item.reps, cat: a.item.cat || info.tipo },
    info: { tipo: info.tipo, equip: info.equip, semCarga: info.semCarga, var: info.var },
    sessoes: a.sessoesLeg,
    prontidao: a.prontidao,
    cfg: regrasCompletas(a.config),
    deload: a.deload,
  });
}

export function sugerirCond(a: { treino: Treino; sessoesLeg: SessaoLegado[]; prontidao: Prontidao | null }) {
  return Rec.sugerirCond({
    treino: { id: a.treino.id, voltas: a.treino.voltas ?? 1, descanso: a.treino.descanso_voltas_s ?? 0 },
    sessoes: a.sessoesLeg,
    prontidao: a.prontidao,
  });
}

export function semanasSeguidas(a: { sessoes: Sessao[]; deloads: Deload[]; hoje: string }) {
  return Rec.semanasSeguidas({ sessoes: sessoesLegado(a.sessoes), hoje: a.hoje, deloads: a.deloads.map((d) => d.inicio) });
}

export function calibrarSono(a: { noites: Noite[]; sessoes: Sessao[]; config: Configuracoes | undefined; hoje: string }) {
  return Rec.calibrarSono({ sono: sonoLegado(a.noites), sessoes: sessoesLegado(a.sessoes), cfg: regrasCompletas(a.config), hoje: a.hoje });
}

export const e1rm = Rec.e1rm;
