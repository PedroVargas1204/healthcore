import type { Serie, Sessao } from "./tipos";

export type Recorde = { kg: number; reps: number; data: string };

/** Melhor série por carga; empate decide pelas reps (como no app antigo). */
export function melhorKg<T extends { kg: number; reps: number }>(series: T[]): T | null {
  return series.reduce<T | null>((b, s) => (!b || s.kg > b.kg || (s.kg === b.kg && s.reps > b.reps) ? s : b), null);
}

const supera = (s: { kg: number; reps: number }, r: { kg: number; reps: number }) => s.kg > r.kg || (s.kg === r.kg && s.reps > r.reps);

/** Melhor marca de cada exercício nas sessões dadas. */
export function recordesAte(sessoes: Sessao[]): Record<string, Recorde> {
  const r: Record<string, Recorde> = {};
  for (const t of sessoes) {
    if (t.tipo !== "forca") continue;
    for (const e of t.exercicios) {
      const b = melhorKg(e.series.map((x) => ({ ...x, kg: Number(x.kg) })));
      const atual = r[e.ex_chave];
      if (b && (!atual || supera(b, atual))) r[e.ex_chave] = { kg: b.kg, reps: b.reps, data: t.data };
    }
  }
  return r;
}

export type RecordeSessao = { ex_chave: string; kg: number; reps: number; antes: { kg: number; reps: number } };

/** Recordes batidos numa sessão em relação às sessões anteriores a ela. Só conta quem já tinha marca. */
export function recordesDaSessao(sessao: Sessao, todas: Sessao[]): RecordeSessao[] {
  const antes = recordesAte(todas.filter((x) => x.id !== sessao.id && (x.data < sessao.data || (x.data === sessao.data && (x.inicio ?? "") < (sessao.inicio ?? "")))));
  const out: RecordeSessao[] = [];
  for (const e of sessao.exercicios) {
    const b = melhorKg(e.series.map((x) => ({ ...x, kg: Number(x.kg) })));
    const r0 = antes[e.ex_chave];
    if (b && r0 && supera(b, r0)) out.push({ ex_chave: e.ex_chave, kg: b.kg, reps: b.reps, antes: { kg: r0.kg, reps: r0.reps } });
  }
  return out;
}

/** Recorde ao vivo: a série que acabou de ser feita supera a marca anterior do exercício? */
export const ehRecorde = (s: Serie, anterior: Recorde | undefined) => !!anterior && s.kg > 0 && supera({ kg: s.kg, reps: s.reps }, anterior);
