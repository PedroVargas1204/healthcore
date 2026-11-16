// Uma regra por teste, com números fáceis de conferir de cabeça.

import { describe, expect, it } from "vitest";
import { PADRAO, calibrarSono, estagnado, historico, prontidao, semanasSeguidas, sugerirCond, sugerirForca } from "@/lib/dominio/regras";
import type { Cat, Prontidao, SerieRegras, SessaoRegras, SonoRegras } from "@/lib/dominio/regras";

const HOJE = "2026-11-16"; // segunda-feira
const dia = (n: number) => {
  const d = new Date(2026, 10, 16 + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const series = (kg: number, reps: number[], rir: (number | null)[] | number | null = 2): SerieRegras[] =>
  reps.map((r, i) => ({ kg, reps: r, rir: Array.isArray(rir) ? rir[i]! : rir }));
const sessao = (atras: number, ex: Record<string, SerieRegras[]>, extra: Partial<SessaoRegras> = {}, cat: Cat = "comp"): SessaoRegras => ({
  tipo: "forca",
  data: dia(-atras),
  treinoId: "a",
  energia: 4,
  dorMusc: 2,
  dorArt: { sim: false, ex: [] },
  ex: Object.entries(ex).map(([id, s]) => ({ id, cat, series: s })),
  ...extra,
});
const SUPINO = { item: { exId: "supino", series: 3, reps: "8-10", cat: "comp" as Cat }, info: { tipo: "comp" as Cat, equip: "Barra" } };
const LATERAL = { item: { exId: "elev_lateral", series: 4, reps: "12-15", cat: "iso" as Cat }, info: { tipo: "iso" as Cat, equip: "Halteres" } };
const nivel = (n: Prontidao["nivel"]): Prontidao => ({ nivel: n, motivo: "", media: null, noite: null, noites: 0, criticas: 0 });
const forca = (alvo: typeof SUPINO, sessoes: SessaoRegras[], extra: { prontidao?: Prontidao; deload?: boolean; cfg?: Partial<typeof PADRAO> } = {}) =>
  sugerirForca({ ...alvo, sessoes, prontidao: extra.prontidao, deload: extra.deload, cfg: { ...PADRAO, ...extra.cfg } });
/** Quem prefere deixar 1 rep de sobra liga isso em Ajustes; era o padrão do app antigo. */
const COM_RESERVA = { cfg: { rirSubir: 1 } };

describe("composto: dupla progressão", () => {
  it("primeira vez: sem carga sugerida", () => {
    const s = forca(SUPINO, []);
    expect(s).toMatchObject({ tipo: "primeira", kg: null, series: 3 });
    expect(s.motivo).toContain("RIR 2");
  });

  it("topo da faixa em todas as séries: sobe um passo", () => {
    const s = forca(SUPINO, [sessao(2, { supino: series(60, [10, 10, 10], [2, 1, 1]) })]);
    expect(s).toMatchObject({ tipo: "subir", kg: 62.5, reps: "8-10" });
    expect(s.motivo).toBe("Bateu 10 reps nas 3 séries: +2,5 kg (4,2%).");
  });

  it("falha vale: topo da faixa com RIR 0 em todas as séries também sobe", () => {
    const s = forca(SUPINO, [sessao(2, { supino: series(60, [10, 10, 10], 0) })]);
    expect(s).toMatchObject({ tipo: "subir", kg: 62.5 });
  });

  it("falha vale: RIR 0 dentro da faixa não conta como abaixo, nem reduz a carga", () => {
    const h = [2, 5, 8].map((d) => sessao(d, { supino: series(60, [9, 9, 8], 0) }));
    expect(forca(SUPINO, h)).toMatchObject({ tipo: "manter", kg: 60, reps: "9" });
  });

  it("o aumento soma o passo à carga atual, mesmo fora dos múltiplos do passo", () => {
    const halter = { item: { exId: "bulgaro", series: 3, reps: "10", cat: "comp" as Cat }, info: { tipo: "comp" as Cat, equip: "Halteres" } };
    const s = forca(halter, [sessao(2, { bulgaro: series(19, [10, 10, 10]) })]);
    expect(s).toMatchObject({ tipo: "subir", kg: 21 });
    expect(s.motivo).toBe("Bateu 10 reps nas 3 séries: +2 kg (10,5%).");
  });

  it("topo da faixa com RIR em branco: mantém e pede o RIR (mudança aprovada)", () => {
    const s = forca(SUPINO, [sessao(2, { supino: series(60, [10, 10, 10], [2, null, 1]) })]);
    expect(s).toMatchObject({ tipo: "manter", kg: 60, estagnado: false });
    expect(s.motivo).toBe("Bateu o topo, mas faltou anotar o RIR: mantenha 60 kg e anote o RIR para liberar o aumento.");
  });


  it("dentro da faixa: mesma carga e +1 rep sobre a pior série", () => {
    const s = forca(SUPINO, [sessao(2, { supino: series(60, [10, 9, 8]) })]);
    expect(s).toMatchObject({ tipo: "manter", kg: 60, reps: "9" });
  });

  it("abaixo do mínimo uma vez: mantém a carga", () => {
    const s = forca(SUPINO, [sessao(2, { supino: series(60, [8, 7, 6]) })]);
    expect(s).toMatchObject({ tipo: "manter", kg: 60 });
    expect(s.motivo).toBe("Ficou abaixo de 8 reps: mantenha 60 kg hoje.");
  });

  it("abaixo do mínimo duas vezes seguidas: reduz 5% arredondado ao passo", () => {
    const s = forca(SUPINO, [sessao(2, { supino: series(60, [8, 7, 6]) }), sessao(5, { supino: series(60, [7, 7, 6]) })]);
    expect(s).toMatchObject({ tipo: "reduzir", kg: 57.5 });
    expect(s.motivo).toContain("2 vezes seguidas");
  });


  it("peso corporal no topo: sugere acrescentar carga, sem número", () => {
    const s = sugerirForca({ item: { exId: "barra", series: 3, reps: "8-10", cat: "comp" }, info: { tipo: "comp", equip: "Peso corporal", semCarga: true }, sessoes: [sessao(2, { barra: series(0, [10, 10, 10]) })], cfg: PADRAO });
    expect(s).toMatchObject({ tipo: "subir", kg: null });
    expect(s.motivo).toContain("cinto ou halter");
  });

  it("incremento por % da carga, nunca menor que o passo do equipamento", () => {
    const s = forca(SUPINO, [sessao(2, { supino: series(100, [10, 10, 10]) })], { cfg: { incPctComp: 5 } });
    expect(s.kg).toBe(105);
  });
});

describe("composto com reserva (RIR mínimo 1 em Ajustes)", () => {
  it("topo da faixa com RIR 1 ou mais: sobe", () => {
    const s = forca(SUPINO, [sessao(2, { supino: series(60, [10, 10, 10], [2, 1, 1]) })], COM_RESERVA);
    expect(s.motivo).toBe("Bateu 10 reps nas 3 séries com RIR 1 ou mais: +2,5 kg (4,2%).");
  });

  it("topo da faixa com RIR 0 na última série: mantém", () => {
    const s = forca(SUPINO, [sessao(2, { supino: series(60, [10, 10, 10], [2, 1, 0]) })], COM_RESERVA);
    expect(s).toMatchObject({ tipo: "manter", kg: 60 });
    expect(s.motivo).toContain("RIR abaixo de 1");
  });

  it("RIR baixo anotado pesa mais que RIR em branco", () => {
    const s = forca(SUPINO, [sessao(2, { supino: series(60, [10, 10, 10], [null, 2, 0]) })], COM_RESERVA);
    expect(s.motivo).toContain("RIR abaixo de 1");
  });

  it("RIR 0 antes da última série conta como abaixo da faixa", () => {
    const s = forca(SUPINO, [sessao(2, { supino: series(60, [10, 10, 10], [0, 1, 1]) })], COM_RESERVA);
    expect(s).toMatchObject({ tipo: "manter", kg: 60 });
    expect(s.motivo).toContain("RIR 0 antes da última série");
  });

  it("RIR 0 cedo duas vezes seguidas: reduz e o texto diz o motivo", () => {
    const h = [2, 5].map((d) => sessao(d, { supino: series(60, [10, 9, 9], [0, 1, 1]) }));
    const s = forca(SUPINO, h, COM_RESERVA);
    expect(s).toMatchObject({ tipo: "reduzir", kg: 57.5 });
    expect(s.motivo).toBe("Abaixo da faixa ou sem sobra (RIR 0) 2 vezes seguidas: −5% para recuperar as reps.");
  });
});

describe("isolado: primeiro reps, depois carga", () => {
  const rosca = { item: { exId: "rosca", series: 3, reps: "10-12", cat: "iso" as Cat }, info: { tipo: "iso" as Cat, equip: "Barra" } };

  it("topo uma vez: repete antes de subir", () => {
    const s = forca(rosca, [sessao(2, { rosca: series(30, [12, 12, 12]) }, {}, "iso")]);
    expect(s).toMatchObject({ tipo: "manter", kg: 30, reps: "12+" });
  });

  it("topo duas vezes seguidas: sobe e volta para o mínimo de reps", () => {
    const s = forca(rosca, [sessao(2, { rosca: series(30, [12, 12, 12]) }, {}, "iso"), sessao(5, { rosca: series(30, [12, 13, 12]) }, {}, "iso")]);
    expect(s).toMatchObject({ tipo: "subir", kg: 32.5, reps: "10" });
  });

  it("isolado sobe mesmo com RIR 0 na última série (RIR só trava composto)", () => {
    const h = [sessao(2, { rosca: series(30, [12, 12, 12], [1, 1, 0]) }, {}, "iso"), sessao(5, { rosca: series(30, [12, 12, 12], [1, 1, 0]) }, {}, "iso")];
    const s = forca(rosca, h, COM_RESERVA);
    expect(s.tipo).toBe("subir");
    expect(s.motivo).toBe("Bateu 12 reps em todas as séries 2 vezes seguidas: +2,5 kg (8,3%) e volte para 10 reps.");
  });

  it("elevação lateral: salto maior que 10% vira mais reps em vez de mais peso", () => {
    const h = [sessao(2, { elev_lateral: series(7, [15, 15, 15, 15]) }, {}, "iso"), sessao(5, { elev_lateral: series(7, [15, 15, 15, 15]) }, {}, "iso")];
    const s = forca(LATERAL, h);
    expect(s).toMatchObject({ tipo: "alternativa", kg: 7, reps: "17" });
    expect(s.motivo).toContain("salto de 14%");
  });

  it("elevação lateral: salto de até 10% sobe normal", () => {
    const h = [sessao(2, { elev_lateral: series(10, [15, 15, 15, 15]) }, {}, "iso"), sessao(5, { elev_lateral: series(10, [15, 15, 15, 15]) }, {}, "iso")];
    expect(forca(LATERAL, h)).toMatchObject({ tipo: "subir", kg: 11, reps: "12" });
  });

  it("fora do topo: +1 rep", () => {
    const s = forca(rosca, [sessao(2, { rosca: series(30, [12, 11, 10]) }, {}, "iso")]);
    expect(s).toMatchObject({ tipo: "manter", reps: "11" });
  });
});

describe("regras que passam por cima da progressão", () => {
  const noTopo = [sessao(2, { supino: series(60, [10, 10, 10]) })];

  it("dor articular no exercício na última vez: não sobe, sugere variação", () => {
    const s = sugerirForca({ ...SUPINO, info: { ...SUPINO.info, var: "supino com halteres" }, sessoes: [sessao(2, { supino: series(60, [10, 10, 10]) }, { dorArt: { sim: true, ex: ["supino"] } })], prontidao: nivel("vermelho"), cfg: PADRAO });
    expect(s).toMatchObject({ tipo: "dor", kg: 60 });
    expect(s.motivo).toContain("supino com halteres");
  });

  it("dor articular em outro exercício não afeta este", () => {
    expect(forca(SUPINO, [sessao(2, { supino: series(60, [10, 10, 10]) }, { dorArt: { sim: true, ex: ["rosca"] } })]).tipo).toBe("subir");
  });

  it("meta de tempo: sem faixa, tenta superar a última vez", () => {
    const s = sugerirForca({ item: { exId: "prancha", series: 3, reps: "40 s", cat: "iso" }, info: { tipo: "iso", equip: "Peso corporal", semCarga: true }, sessoes: [sessao(2, { prancha: series(0, [40, 35, 30]) }, {}, "iso")], cfg: PADRAO });
    expect(s).toMatchObject({ tipo: "manter", reps: "40 s" });
    expect(s.motivo).toBe("Meta: 40 s. Tente superar a última vez (40, 35, 30).");
  });

  it("prontidão amarela: segura o aumento e diz para quanto subiria", () => {
    const s = forca(SUPINO, noTopo, { prontidao: nivel("amarelo") });
    expect(s).toMatchObject({ tipo: "manter", kg: 60 });
    expect(s.motivo).toBe("Prontidão amarela: mantenha 60 kg hoje (subiria para 62,5 kg).");
  });

  it("prontidão vermelha em composto: −7,5% na carga", () => {
    expect(forca(SUPINO, noTopo, { prontidao: nivel("vermelho") })).toMatchObject({ tipo: "reduzir", kg: 55, series: 3 });
  });

  it("prontidão vermelha em isolado: mesma carga, uma série a menos", () => {
    const s = forca(LATERAL, [sessao(2, { elev_lateral: series(10, [13, 13, 12, 12]) }, {}, "iso")], { prontidao: nivel("vermelho") });
    expect(s).toMatchObject({ tipo: "reduzir", kg: 10, series: 3 });
  });

  it("deload: 40% menos séries, mesma carga, e a prontidão não mexe", () => {
    const s = forca(SUPINO, noTopo, { deload: true, prontidao: nivel("vermelho") });
    expect(s).toMatchObject({ tipo: "deload", series: 2, kg: 62.5 });
    expect(s.motivo).toBe("Semana de deload: 2 séries com a mesma carga.");
  });

  it("estagnado: 3 sessões sem superar a melhor marca anterior", () => {
    const h = [1, 4, 7, 10].map((d) => sessao(d, { supino: series(60, [9, 9, 9]) }));
    const s = forca(SUPINO, h);
    expect(s.estagnado).toBe(true);
    expect(s.motivo).toContain("3 sessões sem progresso");
    expect(estagnado(historico("supino", h.slice(0, 3)), PADRAO)).toBe(false);
  });
});

describe("prontidão do dia", () => {
  const noites = (horas: number[]): SonoRegras => Object.fromEntries(horas.map((h, i) => [dia(-i), { h }]));
  const p = (sono: SonoRegras, sessoes: SessaoRegras[] = []) => prontidao({ sono, sessoes, cfg: PADRAO, hoje: HOJE });

  it("sem sono registrado: verde, avisando", () => expect(p({})).toMatchObject({ nivel: "verde", semSono: true }));
  it("média de 7 dias a partir de 7 h e boa noite: verde", () => expect(p(noites([7.5, 7, 7.5, 7, 8, 7, 7])).nivel).toBe("verde"));
  it("média abaixo de 7 h: amarela", () => expect(p(noites([7, 6.5, 6.5, 7, 6.5, 6.5, 7])).nivel).toBe("amarelo"));
  it("média abaixo de 6 h: vermelha", () => expect(p(noites([6, 5.5, 5.5, 6, 5.5, 6, 5.5])).nivel).toBe("vermelho"));
  it("menos de 3 noites não formam média", () => expect(p(noites([7, 5.5])).nivel).toBe("verde"));
  it("noite anterior abaixo de 6 h: amarela", () => expect(p(noites([5.5, 8, 8, 8, 8, 8, 8]))).toMatchObject({ nivel: "amarelo", motivo: "Dormiu 5,5 h esta noite: mantendo as cargas." }));
  it("noite anterior entre 6 e 6,5 h: amarela", () => expect(p(noites([6.25, 8, 8, 8, 8, 8, 8])).nivel).toBe("amarelo"));
  it("duas noites abaixo de 5 h na semana: vermelha", () => expect(p(noites([8, 4.5, 9, 4.5, 9, 9, 9]))).toMatchObject({ nivel: "vermelho", criticas: 2 }));
  it("dor muscular 4/5 no último treino: vermelha", () => expect(p(noites([8, 8, 8]), [sessao(1, {}, { dorMusc: 4 })]).nivel).toBe("vermelho"));
  const comRir0 = [sessao(1, { supino: series(60, [8, 8], [0, 1]) }), sessao(3, { supino: series(60, [8, 8], [1, 0]) })];
  it("falha vale: RIR 0 frequente não tira o verde", () => expect(p(noites([8, 8, 8]), comRir0).nivel).toBe("verde"));
  it("com reserva: RIR 0 em metade das séries de composto nos 2 últimos treinos deixa amarela", () => {
    const r = prontidao({ sono: noites([8, 8, 8]), sessoes: comRir0, cfg: { ...PADRAO, rirSubir: 1 }, hoje: HOJE });
    expect(r).toMatchObject({ nivel: "amarelo", motivo: "RIR 0 frequente nos últimos treinos: mantendo as cargas." });
  });
  it("energia até 2 nos 2 últimos treinos: amarela", () => {
    const s = [sessao(1, { supino: series(60, [8]) }, { energia: 2 }), sessao(3, { supino: series(60, [8]) }, { energia: 1 })];
    expect(p(noites([8, 8, 8]), s).nivel).toBe("amarelo");
  });
});

describe("condicionamento, semanas seguidas e calibragem", () => {
  const treino = { id: "c1", voltas: 4, descanso: 90 };
  const feito: SessaoRegras = { tipo: "cond", data: dia(-3), treinoId: "c1", energia: 3, dorMusc: 2, dorArt: { sim: false, ex: [] }, ex: [], cond: { tempoTotal: 1325 } };

  it("verde: tenta bater o tempo da última vez", () => expect(sugerirCond({ treino, sessoes: [feito], prontidao: nivel("verde") }).motivo).toBe("Ritmo normal: tente bater 22:05 da última vez."));
  it("amarela: mesmo volume", () => expect(sugerirCond({ treino, sessoes: [feito], prontidao: nivel("amarelo") })).toMatchObject({ voltas: 4, descanso: 90 }));
  it("vermelha: uma volta a menos e 50% mais descanso", () => expect(sugerirCond({ treino, sessoes: [feito], prontidao: nivel("vermelho") })).toMatchObject({ voltas: 3, descanso: 135 }));

  it("semanas seguidas: conta de segunda a domingo e para na semana vazia", () => {
    const s = [0, -7, -14, -28].map((d) => ({ data: dia(d) }));
    expect(semanasSeguidas({ sessoes: s, hoje: HOJE })).toBe(3);
  });
  it("semana atual ainda sem treino não quebra a sequência", () => expect(semanasSeguidas({ sessoes: [{ data: dia(-2) }, { data: dia(-9) }], hoje: HOJE })).toBe(2));
  it("semana de deload zera a contagem", () => expect(semanasSeguidas({ sessoes: [0, -7, -14].map((d) => ({ data: dia(d) })), hoje: HOJE, deloads: [dia(-7)] })).toBe(1));

  it("calibragem: acha o corte de sono em que o desempenho cai", () => {
    const sessoes: SessaoRegras[] = [];
    const sono: SonoRegras = {};
    for (let i = 0; i < 16; i++) {
      const pouco = i % 2 === 0;
      const d = 1 + i * 3;
      sono[dia(-d)] = { h: pouco ? 5.5 : 7.5 };
      sessoes.push(sessao(d, { supino: series(pouco ? 55 : 60, [8, 8, 8]) }));
    }
    const c = calibrarSono({ sono, sessoes, cfg: PADRAO, hoje: HOJE });
    expect(c).toMatchObject({ pronto: true, limiar: 6, abaixo: 8, acima: 8, sugestao: { sonoAmareloNoite: 6, sonoVerdeNoite: 6.5, sonoCritico: 5 } });
    expect(c.queda).toBeCloseTo(8.33, 1);
  });
  it("calibragem: pouco histórico ainda não está pronta", () => expect(calibrarSono({ sono: {}, sessoes: [sessao(1, { supino: series(60, [8]) })], cfg: PADRAO, hoje: HOJE }).pronto).toBe(false));
});
