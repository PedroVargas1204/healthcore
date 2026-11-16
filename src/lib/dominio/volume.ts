// Séries por músculo na semana, com a contagem aprovada na Fase 1:
// cada série conta 1 para o músculo principal e 0,5 para os auxiliares.

import { exInfo } from "./exercicios";
import type { ExercicioProprio, Sessao, Treino } from "./tipos";

export type Regiao =
  | "delt_lat" | "delt_ant" | "delt_post" | "trap_sup" | "trap_med" | "romboides" | "dorsal"
  | "peit_sup" | "peit" | "serratil" | "abdomen" | "biceps" | "triceps" | "antebraco" | "flexores"
  | "quad" | "adutores" | "posterior" | "gluteo" | "panturrilha" | "lombar";

export type Volume = Partial<Record<Regiao, number>>;

/** Nome do músculo no catálogo → regiões do desenho. */
const MAPA: Record<string, Regiao[]> = {
  "Deltoide lateral": ["delt_lat"], "Deltoide anterior": ["delt_ant"], "Deltoide posterior": ["delt_post"], Ombros: ["delt_ant"],
  Dorsal: ["dorsal"], Romboides: ["romboides"], "Trapézio superior": ["trap_sup"], Trapézio: ["trap_sup"], "Trapézio médio": ["trap_med"],
  "Peitoral superior": ["peit_sup"], Peitoral: ["peit"], Serrátil: ["serratil"], Quadríceps: ["quad"], Glúteos: ["gluteo"],
  "Posterior de coxa": ["posterior"], Panturrilha: ["panturrilha"], Adutores: ["adutores"], "Flexores do quadril": ["flexores"],
  Lombar: ["lombar"], Pernas: ["quad", "gluteo"], Abdômen: ["abdomen"], Antebraço: ["antebraco"], Bíceps: ["biceps"], Braquial: ["biceps"],
  Tríceps: ["triceps"],
};

export const regioesDoMusculo = (m: string): Regiao[] => MAPA[m] ?? [];

export type Grupo = { nome: string; curto: string; regioes: Regiao[]; tipo: "foco" | "outro" | "semMeta" };

/** Os grupos da lista, na ordem das telas aprovadas. */
export const GRUPOS: Grupo[] = [
  { nome: "Deltoide lateral", curto: "lateral", regioes: ["delt_lat"], tipo: "foco" },
  { nome: "Dorsal", curto: "dorsal", regioes: ["dorsal"], tipo: "foco" },
  { nome: "Bíceps", curto: "bíceps", regioes: ["biceps"], tipo: "outro" },
  { nome: "Quadríceps", curto: "quadríceps", regioes: ["quad"], tipo: "outro" },
  { nome: "Glúteos", curto: "glúteos", regioes: ["gluteo"], tipo: "outro" },
  { nome: "Deltoide anterior", curto: "deltoide anterior", regioes: ["delt_ant"], tipo: "outro" },
  { nome: "Romboides", curto: "romboides", regioes: ["romboides"], tipo: "outro" },
  { nome: "Tríceps", curto: "tríceps", regioes: ["triceps"], tipo: "outro" },
  { nome: "Peitoral", curto: "peitoral", regioes: ["peit_sup", "peit"], tipo: "outro" },
  { nome: "Posterior de coxa", curto: "posterior de coxa", regioes: ["posterior"], tipo: "outro" },
  { nome: "Panturrilha", curto: "panturrilha", regioes: ["panturrilha"], tipo: "outro" },
  { nome: "Deltoide posterior", curto: "deltoide posterior", regioes: ["delt_post"], tipo: "outro" },
  { nome: "Trapézio", curto: "trapézio", regioes: ["trap_sup", "trap_med"], tipo: "semMeta" },
  { nome: "Abdômen", curto: "abdômen", regioes: ["abdomen"], tipo: "semMeta" },
  { nome: "Lombar", curto: "lombar", regioes: ["lombar"], tipo: "semMeta" },
];

export const META_FOCO = { min: 15, max: 20 };
export const META_PADRAO = { min: 10, max: 20 };
/** Menos que isso na semana quase não estimula o músculo. */
export const POUCO = 4;

export const metaDoGrupo = (g: Grupo) => (g.tipo === "foco" ? META_FOCO : g.tipo === "outro" ? META_PADRAO : null);

function somar(v: Volume, chave: string, series: number, proprios?: ExercicioProprio[]) {
  const e = exInfo(chave, proprios);
  for (const m of e.musc) for (const r of regioesDoMusculo(m)) v[r] = (v[r] ?? 0) + series;
  for (const m of e.sec) for (const r of regioesDoMusculo(m)) v[r] = (v[r] ?? 0) + series * 0.5;
}

/** Séries feitas nas sessões de musculação. */
export function volumeFeito(sessoes: Sessao[], proprios?: ExercicioProprio[]): Volume {
  const v: Volume = {};
  for (const s of sessoes) if (s.tipo === "forca") for (const e of s.exercicios) somar(v, e.ex_chave, e.series.length, proprios);
  return v;
}

/** Séries previstas nos treinos (planejado). */
export function volumePlanejado(treinos: Treino[], proprios?: ExercicioProprio[]): Volume {
  const v: Volume = {};
  for (const t of treinos) if (t.tipo === "forca") for (const e of t.exercicios) somar(v, e.ex_chave, e.series, proprios);
  return v;
}

export const somaGrupo = (v: Volume, g: Grupo) => g.regioes.reduce((s, r) => s + (v[r] ?? 0), 0);

/** Faixa de cor do mapa: 0, 1–4, 5–9, 10–14, 15+. */
export const nivelMapa = (n: number) => (n <= 0 ? 0 : n < 5 ? 1 : n < 10 ? 2 : n < 15 ? 3 : 4);

/** Regiões principais e auxiliares de um treino (para o mapa do bloco do dia). */
export function regioesDoTreino(t: Treino, proprios?: ExercicioProprio[]) {
  const prim = new Set<Regiao>();
  const sec = new Set<Regiao>();
  for (const it of t.exercicios) {
    const e = exInfo(it.ex_chave, proprios);
    e.musc.forEach((m) => regioesDoMusculo(m).forEach((r) => prim.add(r)));
    e.sec.forEach((m) => regioesDoMusculo(m).forEach((r) => sec.add(r)));
  }
  for (const r of prim) sec.delete(r);
  return { prim, sec };
}
