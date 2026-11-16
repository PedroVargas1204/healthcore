// Modelos prontos → treinos editáveis. Inclui o plano "Dimorfismo 5x · evidência" com a rampa de 2 semanas.

import { MODELOS, PLANO_EVIDENCIA } from "./catalogo";
import { uuidv5 } from "./conversor";
import { diasEntre } from "../util/datas";
import type { Modelo, Tag, Treino, TreinoModelo } from "./tipos";

export const TODOS_MODELOS: Modelo[] = [PLANO_EVIDENCIA, ...MODELOS];

function paraTreino(t: TreinoModelo, id: string, posicao: number, idPorLetra: Map<string, string>): Treino {
  const cond = t.tipo === "cond";
  return {
    id,
    nome: t.nome,
    tipo: t.tipo,
    tags: t.tags.filter((x): x is Tag => x === "pernas" || x === "hyrox"),
    voltas: cond ? (t.voltas ?? 1) : null,
    descanso_voltas_s: cond ? (t.descanso ?? 0) : null,
    finalizador_id: t.finalizador ? (idPorLetra.get(t.finalizador) ?? null) : null,
    obs: t.obs || null,
    posicao,
    exercicios: (t.ex ?? []).map((e) => ({ ex_chave: e.exId, series: e.series, reps: e.reps, descanso_s: e.desc, obs: e.obs || null, cat: e.cat })),
    estacoes: (t.itens ?? []).map((s) => ({ nome: s.nome, alvo: s.alvo || null, substituto: s.sub || null })),
  };
}

/** Ids fixos por conta e modelo: aplicar o mesmo modelo de novo atualiza os mesmos treinos. */
export async function treinosDoModelo(m: Modelo, uid: string, posicaoInicial = 0) {
  const idPorLetra = new Map<string, string>();
  for (const t of m.treinos) idPorLetra.set(t.id, await uuidv5(`${uid}:modelo:${m.id}:${t.id}`));
  const treinos = m.treinos.map((t, i) => paraTreino(t, idPorLetra.get(t.id)!, posicaoInicial + i, idPorLetra));
  const semana = m.semana.map((l) => (l ? (idPorLetra.get(l) ?? null) : null));
  return { treinos, semana };
}

/* ---------- Rampa do plano evidência ---------- */

export const RAMPA_DIAS = 14;
const PREFIXO_RAMPA = "evidencia:rampa:";

/** Semanas 1 e 2: o plano de hoje (Dimorfismo 5x) mais elevação lateral em B e E e crucifixo inverso em A. */
export function modeloRampa(): Modelo {
  const base = MODELOS[0]!;
  const extra: Record<string, { exId: string; series: number; reps: string }[]> = {
    A: [{ exId: "crucifixo_inverso", series: 3, reps: "15" }],
    B: [{ exId: "elev_lateral_polia", series: 3, reps: "12-15" }],
    E: [{ exId: "elev_lateral", series: 3, reps: "12-15" }],
  };
  return {
    ...PLANO_EVIDENCIA,
    treinos: base.treinos.map((t) => ({
      ...t,
      ex: [...(t.ex ?? []), ...(extra[t.id] ?? []).map((x) => ({ ...x, desc: null, obs: "", cat: "iso" as const }))],
    })),
    semana: PLANO_EVIDENCIA.semana,
  };
}

/** perfil.modelo guarda o plano e, durante a rampa, o dia em que começou. */
export const modeloEmRampa = (inicio: string) => `${PREFIXO_RAMPA}${inicio}`;
export const MODELO_EVIDENCIA_COMPLETO = "evidencia";

export function situacaoRampa(modelo: string | null | undefined, hoje: string) {
  if (!modelo?.startsWith(PREFIXO_RAMPA)) return null;
  const inicio = modelo.slice(PREFIXO_RAMPA.length);
  const dias = diasEntre(inicio, hoje);
  return { inicio, dias, semana: Math.min(2, Math.floor(dias / 7) + 1), pronta: dias >= RAMPA_DIAS };
}

/** Os ids da rampa e do plano completo são os mesmos: liberar o plano completo só troca os exercícios. */
export async function treinosEvidencia(uid: string, fase: "rampa" | "completo") {
  const m = fase === "rampa" ? modeloRampa() : PLANO_EVIDENCIA;
  return treinosDoModelo({ ...m, id: PLANO_EVIDENCIA.id }, uid);
}
