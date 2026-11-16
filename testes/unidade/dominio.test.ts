import { describe, expect, it } from "vitest";
import { MODELOS, PLANO_EVIDENCIA } from "@/lib/dominio/catalogo";
import { modeloRampa, situacaoRampa, treinosEvidencia } from "@/lib/dominio/modelos";
import { GRUPOS, nivelMapa, somaGrupo, volumeFeito, volumePlanejado } from "@/lib/dominio/volume";
import { recordesDaSessao } from "@/lib/dominio/recordes";
import { avisosSemana, duracaoTreino } from "@/lib/dominio/semana";
import { comecar, concluirSerie, montarSessao, fechamentoInicial } from "@/lib/acoes/treino";
import type { Sessao, Treino } from "@/lib/dominio/tipos";
import { regrasCompletas } from "@/lib/dominio/recomendacao";

const totalSeries = (m: typeof PLANO_EVIDENCIA) =>
  m.semana.filter(Boolean).reduce((t, l) => t + (m.treinos.find((x) => x.id === l)?.ex ?? []).reduce((a, e) => a + e.series, 0), 0);

async function treinosDe(m: typeof PLANO_EVIDENCIA) {
  return (await treinosEvidencia("u", m === PLANO_EVIDENCIA ? "completo" : "rampa")).treinos;
}

describe("plano Dimorfismo 5x · evidência (aprovado em 14/11)", () => {
  it("passa de 78 para 96 séries por semana", () => {
    expect(totalSeries(MODELOS[0]!)).toBe(78);
    expect(totalSeries(PLANO_EVIDENCIA)).toBe(96);
  });

  it("deltoide lateral e dorsal ficam na faixa de 15 a 20 séries (contagem fracionada)", async () => {
    const v = volumePlanejado(await treinosDe(PLANO_EVIDENCIA));
    const lateral = somaGrupo(v, GRUPOS[0]!);
    const dorsal = somaGrupo(v, GRUPOS[1]!);
    expect(lateral).toBeGreaterThanOrEqual(15);
    expect(lateral).toBeLessThanOrEqual(20);
    expect(dorsal).toBeGreaterThanOrEqual(15);
    expect(dorsal).toBeLessThanOrEqual(20);
  });

  it("rampa: plano atual + elevação lateral em B e E + crucifixo inverso em A", () => {
    const r = modeloRampa();
    expect(totalSeries(r)).toBe(78 + 9);
    expect(r.treinos.find((t) => t.id === "A")!.ex!.some((e) => e.exId === "crucifixo_inverso")).toBe(true);
    expect(r.treinos.find((t) => t.id === "B")!.ex!.some((e) => e.exId === "elev_lateral_polia")).toBe(true);
    expect(r.treinos.find((t) => t.id === "E")!.ex!.some((e) => e.exId === "elev_lateral")).toBe(true);
  });

  it("rampa e plano completo usam os mesmos ids (liberar só troca os exercícios)", async () => {
    const a = await treinosEvidencia("u", "rampa");
    const b = await treinosEvidencia("u", "completo");
    expect(a.treinos.map((t) => t.id)).toEqual(b.treinos.map((t) => t.id));
    expect(a.semana).toEqual(b.semana);
    expect(a.semana.filter(Boolean)).toHaveLength(5);
    expect(a.semana[3]).toBeNull();
    expect(a.semana[6]).toBeNull();
  });

  it("situação da rampa por dias", () => {
    expect(situacaoRampa("evidencia:rampa:2026-11-01", "2026-11-10")).toMatchObject({ semana: 2, pronta: false });
    expect(situacaoRampa("evidencia:rampa:2026-11-01", "2026-11-15")).toMatchObject({ pronta: true });
    expect(situacaoRampa("evidencia", "2026-11-15")).toBeNull();
  });
});

describe("mapa muscular", () => {
  it("faixas de cor 0, 1–4, 5–9, 10–14, 15+", () => {
    expect([0, 1, 4, 5, 9.5, 10, 14.5, 15, 22].map(nivelMapa)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
  it("série conta 1 no principal e 0,5 no auxiliar", () => {
    const s = { tipo: "forca", exercicios: [{ ex_chave: "supino_inclinado", series: [{}, {}, {}] }] } as unknown as Sessao;
    const v = volumeFeito([s]);
    expect(v.peit_sup).toBe(3);
    expect(v.delt_ant).toBe(1.5);
    expect(v.triceps).toBe(1.5);
  });
});

const serie = (kg: number, reps: number, rir: number | null = 1) => ({ kg, reps, rir });
const sessao = (id: string, data: string, series: ReturnType<typeof serie>[]): Sessao =>
  ({ id, tipo: "forca", data, inicio: `${data}T18:00:00Z`, treino_id: "t", nome: "T", exercicios: [{ ex_chave: "supino_inclinado", cat: "comp", alvo: "8-10", sugestao: null, sugestao_aceita: null, series }] }) as unknown as Sessao;

describe("recordes", () => {
  it("conta recorde só quando passa a marca anterior (carga, depois reps)", () => {
    const a = sessao("a", "2026-11-01", [serie(22, 10)]);
    const b = sessao("b", "2026-11-05", [serie(24, 8)]);
    const c = sessao("c", "2026-11-08", [serie(24, 8)]);
    const todas = [a, b, c];
    expect(recordesDaSessao(a, todas)).toEqual([]);
    expect(recordesDaSessao(b, todas)).toHaveLength(1);
    expect(recordesDaSessao(c, todas)).toEqual([]);
  });
});

describe("semana", () => {
  it("avisa pernas pesadas e Hyrox em dias seguidos", () => {
    const pernas = { id: "p", tipo: "forca", tags: ["pernas"], exercicios: [] } as unknown as Treino;
    const hyrox = { id: "h", tipo: "cond", tags: ["hyrox"], exercicios: [], estacoes: [] } as unknown as Treino;
    expect(avisosSemana(["p", "h", null, null, null, null, null], [pernas, hyrox])[0]).toContain("Segunda e terça");
  });
  it("duração estimada arredonda para 5 min", () => {
    const t = { tipo: "forca", exercicios: [{ series: 4, cat: "comp", descanso_s: null }] } as unknown as Treino;
    expect(duracaoTreino(t, regrasCompletas(undefined)) % 5).toBe(0);
  });
});

describe("treino em andamento", () => {
  const treino: Treino = {
    id: "t1", nome: "Peito", tipo: "forca", tags: [], voltas: null, descanso_voltas_s: null, finalizador_id: null, obs: null, posicao: 0, estacoes: [],
    exercicios: [{ ex_chave: "supino_inclinado", series: 2, reps: "8-10", descanso_s: 120, obs: null, cat: "comp" }],
  };
  const ctx = { sessoes: [sessao("a", "2026-11-01", [serie(22, 10, 1), serie(22, 10, 2)])], noites: [], config: undefined, proprios: [], deloads: [] };

  it("começa com a sugestão nas séries e tocar no RIR conclui a série", () => {
    const a = comecar(treino, ctx);
    if (a.tipo !== "forca") throw new Error("tipo");
    expect(a.exercicios[0]!.sugestao.tipo).toBe("subir");
    expect(a.exercicios[0]!.series[0]!.kg).toBe(24);
    const r = concluirSerie(a, 0, 0, 1, []);
    expect(r.erro).toBeUndefined();
    expect(r.a.exercicios[0]!.series[0]).toMatchObject({ feita: true, rir: 1, kg: 24 });
    expect(r.a.descanso_fim).toBeGreaterThan(Date.now());
  });

  it("recusa série sem carga", () => {
    const a = comecar(treino, { ...ctx, sessoes: [] });
    if (a.tipo !== "forca") throw new Error("tipo");
    expect(concluirSerie(a, 0, 0, 2, []).erro).toBe("Preencha a carga.");
  });

  it("monta a sessão para o banco: só séries feitas, prontidão no formato do banco", () => {
    let a = comecar(treino, ctx);
    if (a.tipo !== "forca") throw new Error("tipo");
    a = concluirSerie(a, 0, 0, 1, []).a;
    const s = montarSessao(a, { ...fechamentoInicial(a), dor_articular: true, dor_articular_ex: ["supino_inclinado"] });
    expect(s.exercicios[0]!.series).toHaveLength(1);
    expect(s.exercicios[0]!.sugestao_aceita).toBe(true);
    expect(["verde", "amarela", "vermelha"]).toContain(s.prontidao);
    expect(s.dor_articular_ex).toEqual(["supino_inclinado"]);
  });
});
