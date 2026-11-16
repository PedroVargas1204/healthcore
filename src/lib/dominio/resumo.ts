import { exInfo, nomeCurto } from "./exercicios";
import { recordesDaSessao } from "./recordes";
import type { ExercicioProprio, Sessao } from "./tipos";

export const volumeKg = (s: Sessao) => s.exercicios.reduce((t, e) => t + e.series.reduce((u, x) => u + Number(x.kg) * x.reps, 0), 0);
export const numSeries = (s: Sessao) => s.exercicios.reduce((t, e) => t + e.series.length, 0);

/** Números do resumo de vitória. "Carga total" compara kg × reps com a última vez do mesmo treino (pelo treino ou, se ele foi recriado por um plano, pelo nome). */
export function resumoSessao(s: Sessao, todas: Sessao[], proprios: ExercicioProprio[]) {
  const recordes = recordesDaSessao(s, todas).map((r) => ({ ...r, nome: nomeCurto(exInfo(r.ex_chave, proprios).nome) }));
  const anteriores = todas
    .filter((x) => x.id !== s.id && x.tipo === "forca" && ((s.treino_id && x.treino_id === s.treino_id) || x.nome === s.nome) && (x.data < s.data || (x.data === s.data && (x.inicio ?? "") < (s.inicio ?? ""))))
    .sort((a, b) => b.data.localeCompare(a.data) || (b.inicio ?? "").localeCompare(a.inicio ?? ""));
  const antes = anteriores[0];
  const vol = volumeKg(s);
  const volAntes = antes ? volumeKg(antes) : 0;
  const variacao = antes && volAntes > 0 && vol > 0 ? Math.round(((vol - volAntes) / volAntes) * 100) : null;
  return { minutos: s.duracao_min ?? 0, series: numSeries(s), recordes, variacao, volume: vol };
}
