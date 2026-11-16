import { banco } from "../dados/local";
import { salvarPerfil, salvarSemana, salvarVarios } from "../dados/repo";
import { MODELO_EVIDENCIA_COMPLETO, modeloEmRampa, treinosDoModelo, treinosEvidencia } from "../dominio/modelos";
import { PLANO_EVIDENCIA } from "../dominio/catalogo";
import type { Modelo, Treino } from "../dominio/tipos";

/** Coloca os treinos novos na frente e empurra os de antes para o fim da lista (eles ficam guardados). */
async function gravarPlano(novos: Treino[], semana: (string | null)[]) {
  const novosIds = new Set(novos.map((t) => t.id));
  const antigos = (await banco().treinos.orderBy("posicao").toArray()).filter((t) => !novosIds.has(t.id));
  const reposicionados = antigos.map((t, i) => ({ ...t, posicao: novos.length + i }));
  await salvarVarios("treinos", [...novos, ...reposicionados]);
  await salvarSemana(semana.map((treino_id, dia) => ({ dia, treino_id })));
}

/** Plano evidência: começa pela rampa de 2 semanas. */
export async function usarPlanoEvidencia(uid: string, hoje: string) {
  const { treinos, semana } = await treinosEvidencia(uid, "rampa");
  await gravarPlano(treinos, semana);
  await salvarPerfil({ modelo: modeloEmRampa(hoje) });
}

/** Fim da rampa: os mesmos treinos ganham o volume completo. A semana não muda. */
export async function liberarPlanoCompleto(uid: string) {
  const { treinos } = await treinosEvidencia(uid, "completo");
  const atuais = new Map((await banco().treinos.bulkGet(treinos.map((t) => t.id))).filter(Boolean).map((t) => [t!.id, t!]));
  // Mantém nome e posição se a pessoa mexeu; troca só os exercícios.
  const prontos = treinos.map((t) => {
    const a = atuais.get(t.id);
    return a ? { ...a, exercicios: t.exercicios } : t;
  });
  await salvarVarios("treinos", prontos);
  await salvarPerfil({ modelo: MODELO_EVIDENCIA_COMPLETO });
}

/** Qualquer outro modelo da biblioteca. */
export async function usarModelo(m: Modelo, uid: string, hoje: string) {
  if (m.id === PLANO_EVIDENCIA.id) return usarPlanoEvidencia(uid, hoje);
  const { treinos, semana } = await treinosDoModelo(m, uid);
  await gravarPlano(treinos, semana);
  await salvarPerfil({ modelo: m.id });
}
