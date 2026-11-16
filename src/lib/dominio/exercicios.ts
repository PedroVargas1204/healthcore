import { EX } from "./catalogo";
import type { Categoria, Exercicio, ExercicioProprio } from "./tipos";

/** Exercício do catálogo ou criado pela pessoa. Nunca falha: um id desconhecido vira um exercício genérico. */
export function exInfo(chave: string, proprios?: ExercicioProprio[] | Record<string, ExercicioProprio>): Exercicio {
  const fixo = EX[chave];
  if (fixo) return fixo;
  const lista = Array.isArray(proprios) ? proprios : proprios ? Object.values(proprios) : [];
  const p = lista.find((x) => x.chave === chave);
  if (p) {
    return {
      nome: p.nome,
      grupo: p.grupo,
      musc: p.musc,
      sec: p.sec,
      equip: p.equip,
      tipo: p.tipo,
      v: 0,
      reps: p.reps_padrao,
      var: "",
      passos: [],
      erros: [],
      semCarga: p.sem_carga ? 1 : undefined,
    };
  }
  return { nome: chave, grupo: "Outro", musc: [], sec: [], equip: "Halteres", tipo: "comp", v: 0, reps: "10", var: "", passos: [], erros: [] };
}

/** Nome curto para listas apertadas: "Supino inclinado com halteres" → "Supino inclinado". */
export function nomeCurto(nome: string) {
  return nome.replace(/ com halteres$| na polia$| aberta$| livre$/i, "");
}

/** Passo de carga do equipamento (para os botões de menos e mais). */
export function passoCarga(equip: string, cat: Categoria, regras: Record<string, number>) {
  const mapa: Record<string, string> = { Halteres: "Halteres", Barra: "Barra", Máquina: "Maquina", Polia: "Polia" };
  const sufixo = mapa[equip];
  if (!sufixo) return 1;
  return regras[(cat === "comp" ? "incComp" : "incIso") + sufixo] || 1;
}
