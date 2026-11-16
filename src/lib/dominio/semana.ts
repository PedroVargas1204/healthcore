import { DIAS_L } from "../util/datas";
import { exInfo } from "./exercicios";
import type { ExercicioProprio, Treino } from "./tipos";

/** Descanso padrão quando o exercício não define um. */
export const descansoPadrao = (cat: "comp" | "iso", regras: Record<string, number>) =>
  cat === "iso" ? regras.descIsolado ?? 75 : regras.descComposto ?? 120;

/** Duração estimada em minutos, arredondada para 5 (mesma conta do app antigo). */
export function duracaoTreino(t: Treino | null | undefined, regras: Record<string, number>) {
  if (!t) return 0;
  if (t.tipo === "cond") {
    const voltas = t.voltas || 1;
    const est = t.estacoes.length * voltas * 2.5 + ((voltas - 1) * (t.descanso_voltas_s || 0)) / 60;
    return Math.max(10, Math.round(est / 5) * 5);
  }
  let s = 0;
  for (const e of t.exercicios) s += e.series * ((e.descanso_s || descansoPadrao(e.cat, regras)) + 45) + 90;
  return Math.max(5, Math.round(s / 60 / 5) * 5);
}

export const totalSeries = (t: Treino) => t.exercicios.reduce((a, e) => a + e.series, 0);

export function descricaoTreino(t: Treino, regras: Record<string, number>) {
  if (t.tipo === "cond") {
    const v = t.voltas || 1;
    return `${v} ${v > 1 ? "voltas" : "volta"} de ${t.estacoes.length} estações, cerca de ${duracaoTreino(t, regras)} min`;
  }
  return `${t.exercicios.length} exercícios, ${totalSeries(t)} séries, cerca de ${duracaoTreino(t, regras)} min`;
}

/* Regras de recuperação da semana (app antigo):
   - pernas pesadas e condicionamento intenso (Hyrox) nunca em dias seguidos;
   - condicionamento intenso não encosta (antes ou depois) num treino de ombro ou costas. */
function foco(t: Treino | undefined, proprios?: ExercicioProprio[]) {
  if (!t) return {};
  if (t.tipo === "cond") return { intenso: t.tags.includes("hyrox") };
  let oc = 0;
  for (const e of t.exercicios) {
    const g = exInfo(e.ex_chave, proprios).grupo;
    if (g === "Ombro" || g === "Costas") oc += e.series;
  }
  return { pernas: t.tags.includes("pernas"), ombroCostas: oc >= 6 };
}

export function avisosSemana(semana: (string | null)[], treinos: Treino[], proprios?: ExercicioProprio[]) {
  const porId = new Map(treinos.map((t) => [t.id, t]));
  const f = semana.map((id) => foco(id ? porId.get(id) : undefined, proprios)) as { pernas?: boolean; intenso?: boolean; ombroCostas?: boolean }[];
  const avisos: string[] = [];
  for (let i = 0; i < 7; i++) {
    const j = (i + 1) % 7;
    const a = f[i] ?? {};
    const b = f[j] ?? {};
    const par = `${DIAS_L[i]} e ${DIAS_L[j]?.toLowerCase()}`;
    if ((a.pernas && b.intenso) || (a.intenso && b.pernas)) avisos.push(`${par}: pernas pesadas e Hyrox em dias seguidos`);
    if ((a.ombroCostas && b.intenso) || (a.intenso && b.ombroCostas)) avisos.push(`${par}: condicionamento intenso colado num treino de ombro ou costas`);
  }
  return avisos;
}
