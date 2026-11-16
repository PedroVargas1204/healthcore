// Treino em andamento: começar, registrar séries e fechar. Mesmas regras do app antigo,
// com as duas mudanças aprovadas na Fase 0: tocar no RIR conclui a série, e dor articular exige o exercício.

import { exInfo } from "../dominio/exercicios";
import { descansoPadrao } from "../dominio/semana";
import { faixaReps, nivelParaBanco, prontidaoHoje, regrasCompletas, sessoesLegado, sugerirCond, sugerirForca } from "../dominio/recomendacao";
import type {
  Configuracoes,
  Deload,
  ExercicioAtivo,
  ExercicioProprio,
  Noite,
  Sessao,
  SessaoAtiva,
  SessaoAtivaCond,
  SessaoAtivaForca,
  Treino,
} from "../dominio/tipos";
import { hojeK } from "../util/datas";

export type Contexto = {
  sessoes: Sessao[];
  noites: Noite[];
  config: Configuracoes | undefined;
  proprios: ExercicioProprio[];
  deloads: Deload[];
};

export const deloadAtivo = (deloads: Deload[], hoje = hojeK()) => deloads.find((d) => d.inicio <= hoje && hoje <= d.fim) ?? null;

export function comecar(treino: Treino, ctx: Contexto): SessaoAtiva {
  const hoje = hojeK();
  const p = prontidaoHoje({ noites: ctx.noites, sessoes: ctx.sessoes, config: ctx.config, hoje });
  const leg = sessoesLegado(ctx.sessoes);
  const prontidao = { nivel: p.nivel, motivo: p.motivo };
  const base = { sessao_id: crypto.randomUUID(), treino_id: treino.id, nome: treino.nome, inicio: Date.now(), prontidao };
  if (treino.tipo === "cond") {
    const s = sugerirCond({ treino, sessoesLeg: leg, prontidao: p });
    const a: SessaoAtivaCond = {
      ...base,
      tipo: "cond",
      sugestao_motivo: s.motivo,
      voltas: s.voltas,
      descanso: s.descanso || 0,
      estacoes: treino.estacoes,
      obs: treino.obs ?? "",
      t_inicio: null,
      fim_timer: null,
      ultimo_marco: null,
      pos: { v: 0, i: 0 },
      marcos: [],
      descanso_fim: null,
    };
    return a;
  }
  const regras = regrasCompletas(ctx.config);
  const deload = !!deloadAtivo(ctx.deloads, hoje);
  const exercicios: ExercicioAtivo[] = treino.exercicios.map((it) => {
    const info = exInfo(it.ex_chave, ctx.proprios);
    const cat = it.cat || info.tipo;
    const s = sugerirForca({ item: { ...it, cat }, proprios: ctx.proprios, sessoesLeg: leg, prontidao: p, config: ctx.config, deload });
    const ult = s.ultima;
    // As séries já começam com a sugestão (tela aprovada na Fase 1); sem sugestão de carga, com a última vez.
    const repsSug = /^\d+$/.test(String(s.reps)) ? Number(s.reps) : null;
    const faixa = faixaReps(it.reps);
    const series = Array.from({ length: s.series }, (_, i) => {
      const u = ult ? (ult[i] ?? ult[ult.length - 1]) : null;
      const kg = s.kg ?? (u && u.kg ? u.kg : info.semCarga ? 0 : null);
      return { kg, reps: repsSug ?? u?.reps ?? faixa?.max ?? null, rir: null, feita: false };
    });
    return {
      ex_chave: it.ex_chave,
      cat,
      reps: it.reps,
      series_plan: it.series,
      descanso_s: it.descanso_s || descansoPadrao(cat, regras),
      obs: it.obs ?? "",
      sugestao: { kg: s.kg, reps: String(s.reps), series: s.series, tipo: s.tipo, motivo: s.motivo, ultima: ult },
      sugestao_aceita: false,
      series,
    };
  });
  const a: SessaoAtivaForca = { ...base, tipo: "forca", idx: 0, descanso_fim: null, descanso_total: null, em_deload: deload, exercicios };
  return a;
}

/** Aplica a sugestão às séries que faltam (carga, reps e número de séries). */
export function usarSugestao(a: SessaoAtivaForca, idx: number): SessaoAtivaForca {
  const ex = a.exercicios[idx];
  if (!ex) return a;
  const s = ex.sugestao;
  let series = ex.series.map((x) => (x.feita ? x : { ...x, kg: s.kg ?? x.kg, reps: /^\d+$/.test(s.reps) ? Number(s.reps) : x.reps }));
  while (series.length > s.series && !series[series.length - 1]!.feita) series = series.slice(0, -1);
  while (series.length < s.series) {
    const u = series[series.length - 1];
    series = [...series, { kg: u?.kg ?? null, reps: u?.reps ?? null, rir: null, feita: false }];
  }
  return trocarEx(a, idx, { ...ex, series, sugestao_aceita: true });
}

export function trocarEx(a: SessaoAtivaForca, idx: number, ex: ExercicioAtivo): SessaoAtivaForca {
  return { ...a, exercicios: a.exercicios.map((e, i) => (i === idx ? ex : e)) };
}

export type ResultadoSerie = { a: SessaoAtivaForca; erro?: string; proximoExercicio?: string };

/** Tocar no RIR conclui a série: valida carga e reps, grava o RIR e começa o descanso. */
export function concluirSerie(a: SessaoAtivaForca, idx: number, si: number, rir: number, proprios: ExercicioProprio[]): ResultadoSerie {
  const ex = a.exercicios[idx];
  const s = ex?.series[si];
  if (!ex || !s) return { a };
  const info = exInfo(ex.ex_chave, proprios);
  const kg = s.kg ?? (info.semCarga ? 0 : NaN);
  const reps = s.reps ?? NaN;
  if (!Number.isFinite(kg)) return { a, erro: "Preencha a carga." };
  if (!Number.isFinite(reps) || reps <= 0) return { a, erro: "Preencha as repetições." };
  if (kg < 0 || kg > 1000 || reps > 200) return { a, erro: "Confira os valores." };
  const series = ex.series.map((x, i) => (i === si ? { kg, reps: Math.round(reps), rir, feita: true } : x));
  let novo: SessaoAtivaForca = trocarEx(a, idx, { ...ex, series });
  novo = { ...novo, descanso_fim: Date.now() + ex.descanso_s * 1000, descanso_total: ex.descanso_s };
  // Exercício terminado: passa para o próximo que ainda tem séries.
  if (series.every((x) => x.feita)) {
    const prox = novo.exercicios.findIndex((e, i) => i > idx && e.series.some((x) => !x.feita));
    if (prox >= 0) return { a: { ...novo, idx: prox }, proximoExercicio: exInfo(novo.exercicios[prox]!.ex_chave, proprios).nome };
  }
  return { a: novo };
}

export function desfazerSerie(a: SessaoAtivaForca, idx: number, si: number): SessaoAtivaForca {
  const ex = a.exercicios[idx];
  if (!ex) return a;
  return trocarEx(a, idx, { ...ex, series: ex.series.map((x, i) => (i === si ? { ...x, feita: false, rir: null } : x)) });
}

/* ---------- Condicionamento ---------- */

export function condProxima(a: SessaoAtivaCond): SessaoAtivaCond {
  const agora = Date.now();
  if (!a.t_inicio) return { ...a, t_inicio: agora, ultimo_marco: agora };
  const seg = Math.round((agora - (a.ultimo_marco ?? a.t_inicio)) / 1000);
  const est = a.estacoes[a.pos.i];
  const marcos = [...a.marcos, { volta: a.pos.v, estacao_pos: a.pos.i, nome: est?.nome ?? null, seg }];
  if (a.pos.i < a.estacoes.length - 1) return { ...a, marcos, ultimo_marco: agora, pos: { v: a.pos.v, i: a.pos.i + 1 }, descanso_fim: null };
  if (a.pos.v < a.voltas - 1)
    return { ...a, marcos, ultimo_marco: agora, pos: { v: a.pos.v + 1, i: 0 }, descanso_fim: a.descanso > 0 ? agora + a.descanso * 1000 : null };
  return { ...a, marcos, ultimo_marco: agora, fim_timer: agora, descanso_fim: null };
}

export function condDesfazer(a: SessaoAtivaCond): SessaoAtivaCond {
  const m = a.marcos[a.marcos.length - 1];
  if (!m) return a;
  const marcos = a.marcos.slice(0, -1);
  return {
    ...a,
    marcos,
    pos: { v: m.volta, i: m.estacao_pos },
    fim_timer: null,
    descanso_fim: null,
    ultimo_marco: marcos.length ? (a.ultimo_marco ?? 0) - m.seg * 1000 : a.t_inicio,
  };
}

/* ---------- Fechar ---------- */

export type Fechamento = {
  data: string;
  duracao_min: number;
  kcal: number | null;
  energia: number | null;
  dor_muscular: number | null;
  dor_articular: boolean;
  dor_articular_onde: string;
  dor_articular_ex: string[];
  obs: string;
  rpe: number | null;
  tempo_total_s: number | null;
};

export function fechamentoInicial(a: SessaoAtiva): Fechamento {
  const dur = Math.max(1, Math.round((Date.now() - a.inicio) / 60000));
  const tt = a.tipo === "cond" && a.t_inicio ? Math.round(((a.fim_timer ?? Date.now()) - a.t_inicio) / 1000) : null;
  return {
    data: hojeK(),
    duracao_min: Math.min(600, dur),
    kcal: null,
    energia: null,
    dor_muscular: null,
    dor_articular: false,
    dor_articular_onde: "",
    dor_articular_ex: [],
    obs: "",
    rpe: null,
    tempo_total_s: tt,
  };
}

export function montarSessao(a: SessaoAtiva, f: Fechamento): Sessao {
  const base = {
    id: a.sessao_id,
    tipo: a.tipo,
    treino_id: a.treino_id,
    nome: a.nome,
    data: f.data,
    inicio: new Date(a.inicio).toISOString(),
    fim: new Date(Math.max(Date.now(), a.inicio)).toISOString(),
    duracao_min: Math.max(1, Math.min(600, Math.round(f.duracao_min))),
    kcal: f.kcal,
    energia: f.energia,
    dor_muscular: f.dor_muscular,
    dor_articular: f.dor_articular && f.dor_articular_ex.length > 0,
    dor_articular_onde: f.dor_articular && f.dor_articular_onde.trim() ? f.dor_articular_onde.trim() : null,
    dor_articular_ex: f.dor_articular ? f.dor_articular_ex : [],
    obs: f.obs.trim() || null,
    prontidao: nivelParaBanco(a.prontidao.nivel),
    prontidao_motivo: a.prontidao.motivo.slice(0, 300),
  };
  if (a.tipo === "forca") {
    return {
      ...base,
      em_deload: a.em_deload,
      tempo_total_s: null,
      voltas_plan: null,
      voltas_feitas: null,
      rpe: null,
      sugestao_motivo: null,
      exercicios: a.exercicios
        .map((e) => ({
          ex_chave: e.ex_chave,
          cat: e.cat,
          alvo: e.reps.slice(0, 20),
          sugestao: { kg: e.sugestao.kg, reps: e.sugestao.reps, series: e.sugestao.series, tipo: e.sugestao.tipo, motivo: e.sugestao.motivo },
          // Aceitou a sugestão se todas as séries feitas usaram a carga sugerida.
          sugestao_aceita: e.sugestao.kg !== null ? e.series.filter((s) => s.feita).every((s) => s.kg === e.sugestao.kg) : e.sugestao_aceita,
          series: e.series.filter((s) => s.feita).map((s) => ({ kg: s.kg ?? 0, reps: s.reps ?? 0, rir: s.rir })),
        }))
        .filter((e) => e.series.length),
      tempos: [],
    };
  }
  return {
    ...base,
    em_deload: false,
    tempo_total_s: f.tempo_total_s,
    voltas_plan: a.voltas,
    voltas_feitas: a.marcos.length ? a.marcos[a.marcos.length - 1]!.volta + 1 : 0,
    rpe: f.rpe,
    sugestao_motivo: a.sugestao_motivo.slice(0, 300),
    exercicios: [],
    tempos: a.marcos,
  };
}

/** Séries de composto feitas sem RIR (o app avisa antes de salvar). */
export function semRir(a: SessaoAtivaForca) {
  return a.exercicios.filter((e) => e.cat === "comp" && e.series.some((s) => s.feita && s.rir === null));
}
