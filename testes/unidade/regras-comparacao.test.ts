// Compara o porte em TypeScript (src/lib/dominio/regras.ts) com o código do app antigo em milhares de cenários
// sorteados com semente fixa. Qualquer diferença fora das mudanças aprovadas derruba o teste.
//
// Mudanças aprovadas, tratadas aqui uma a uma:
// - RIR em branco não sobe composto (teste próprio).
// - Falha vale quando rirSubir = 0: o app antigo não tinha esse modo, então a comparação usa rirSubir de 1 para cima.
// - Aumento soma o passo em vez de arredondar para múltiplos dele: quando os dois dão cargas diferentes, a carga e
//   o texto ficam fora da comparação e a carga nova é conferida à parte.
// - Dois textos reescritos: comparados depois de trocar a frase antiga pela nova.

import { describe, expect, it } from "vitest";
import { Rec as Antigo } from "../referencia/recomendacao-legado";
import * as Novo from "@/lib/dominio/regras";
import type { Cat, Prontidao, RegrasCompletas, SessaoRegras, SonoRegras } from "@/lib/dominio/regras";

/* Sorteio com semente (mulberry32): o mesmo cenário em toda execução. */
function sorteio(semente: number) {
  let a = semente >>> 0;
  const prox = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(prox() * (max - min + 1));
  const um = <T,>(l: readonly T[]) => l[int(0, l.length - 1)]!;
  const chance = (p: number) => prox() < p;
  return { prox, int, um, chance };
}
type S = ReturnType<typeof sorteio>;

const EXERCICIOS: { id: string; cat: Cat; equip: string; semCarga?: boolean; var?: string }[] = [
  { id: "puxada_alta", cat: "comp", equip: "Polia", var: "puxada neutra" },
  { id: "supino_inclinado", cat: "comp", equip: "Halteres" },
  { id: "agachamento", cat: "comp", equip: "Barra" },
  { id: "leg_press", cat: "comp", equip: "Máquina" },
  { id: "barra_fixa", cat: "comp", equip: "Peso corporal", semCarga: true },
  { id: "elev_lateral", cat: "iso", equip: "Halteres", var: "elevação na polia" },
  { id: "elev_lateral_polia", cat: "iso", equip: "Polia" },
  { id: "rosca_direta", cat: "iso", equip: "Barra" },
  { id: "prancha", cat: "iso", equip: "Peso corporal", semCarga: true },
  { id: "proprio_x", cat: "iso", equip: "Elástico" },
];
const FAIXAS = ["8-10", "6-8", "12-15", "12", "10", "8 a 10", "40 s", "500 m", "falha", ""];

const dia = (base: string, n: number) => {
  const p = base.split("-").map(Number);
  const d = new Date(p[0]!, p[1]! - 1, p[2]!);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function regras(s: S): RegrasCompletas {
  const cfg = { ...Novo.PADRAO, rirSubir: 1 };
  if (s.chance(0.4)) return cfg;
  for (const c of Novo.CAMPOS) if (s.chance(0.35)) cfg[c.k] = c.min + Math.round((s.prox() * (c.max - c.min)) / c.passo) * c.passo;
  cfg.rirSubir = Math.max(1, cfg.rirSubir);
  return cfg;
}

function sessoes(s: S, hoje: string, comBranco: boolean): SessaoRegras[] {
  const lista: SessaoRegras[] = [];
  const n = s.int(0, 28);
  let atras = s.int(0, 3);
  // Cada exercício tem uma carga e um nível de reps que andam pouco entre as sessões, para cair em todas as regras.
  const estado = new Map(EXERCICIOS.map((e) => [e.id, { kg: e.semCarga ? 0 : s.um([4, 7, 10, 14, 22.5, 32.5, 60, 100]), reps: s.int(5, 15) }]));
  for (let i = 0; i < n; i++) {
    const data = dia(hoje, -atras);
    atras += s.um([0, 1, 1, 2, 2, 3, 7, 15]);
    if (s.chance(0.15)) {
      lista.push({ tipo: "cond", data, treinoId: s.um(["c1", "c2"]), energia: s.um([null, 1, 3, 5]), dorMusc: s.um([null, 1, 3, 4, 5]), dorArt: { sim: false, ex: [] }, ex: [], cond: { tempoTotal: s.um([null, 0, 754, 3725]) } });
      continue;
    }
    const escolhidos = EXERCICIOS.filter(() => s.chance(0.6));
    lista.push({
      tipo: "forca",
      data,
      treinoId: s.um(["a", "b", null]),
      energia: s.um([null, 1, 2, 3, 4, 5]),
      dorMusc: s.um([null, 1, 2, 3, 4, 5]),
      dorArt: s.chance(0.12) ? { sim: true, ex: escolhidos.filter(() => s.chance(0.5)).map((e) => e.id) } : { sim: false, ex: [] },
      ex: escolhidos.map((e) => {
        const est = estado.get(e.id)!;
        if (s.chance(0.3)) est.reps = Math.max(1, est.reps + s.int(-2, 2));
        if (s.chance(0.2) && est.kg > 0) est.kg = Math.max(0, est.kg + s.um([-2.5, -1, 1, 2, 2.5]));
        const mesmasReps = s.chance(0.6);
        return {
          id: e.id,
          cat: s.chance(0.9) ? e.cat : e.cat === "comp" ? "iso" : "comp",
          series: Array.from({ length: s.int(s.chance(0.05) ? 0 : 1, 5) }, () => ({
            kg: s.chance(0.85) ? est.kg : Math.max(0, est.kg - 2.5),
            reps: mesmasReps ? est.reps : Math.max(0, est.reps + s.int(-3, 1)),
            rir: comBranco && s.chance(0.25) ? null : s.um([0, 1, 1, 2, 2, 3, 4]),
          })),
        };
      }),
    });
  }
  return lista;
}

function sono(s: S, hoje: string): SonoRegras {
  const out: SonoRegras = {};
  const modo = s.um(["vazio", "pouco", "cheio", "ruim"]);
  if (modo === "vazio") return out;
  for (let i = 0; i < 90; i++) {
    if (s.chance(modo === "pouco" ? 0.85 : 0.15)) continue;
    const base = modo === "ruim" ? 5.5 : 7.2;
    out[dia(hoje, -i)] = { h: Math.max(3, Math.round((base + (s.prox() - 0.5) * 3) * 4) / 4), q: s.int(1, 5) };
  }
  return out;
}

const NIVEIS: (Prontidao | null)[] = [
  null,
  { nivel: "verde", motivo: "", media: 7.5, noite: 8, noites: 7, criticas: 0 },
  { nivel: "amarelo", motivo: "", media: 6.5, noite: 6, noites: 7, criticas: 0 },
  { nivel: "vermelho", motivo: "", media: 5.5, noite: 5, noites: 7, criticas: 2 },
];

/** A mudança aprovada só pode aparecer quando o composto bateu o topo com algum RIR em branco e nenhum RIR baixo. */
function casoDoRirEmBranco(ses: SessaoRegras[], exId: string, cat: Cat, reps: string, cfg: RegrasCompletas) {
  const r = Novo.faixa(reps);
  const ult = Novo.historico(exId, ses)[0]?.e.series;
  if (!r || !ult || cat !== "comp") return false;
  return (
    !Novo.abaixoDaFaixa(ult, r, cfg) &&
    Novo.noTopo(ult, r) &&
    ult.some((x) => x.rir === null) &&
    !ult.some((x) => x.rir !== null && x.rir < cfg.rirSubir)
  );
}

type Sugestao = ReturnType<typeof Novo.sugerirForca>;
/** Leva os dois textos reescritos para uma forma comum, para comparar o resto da frase. */
const textoComum = (m: string) => m.replace("Passou de", "Bateu").replace("Abaixo da faixa ou sem sobra (RIR 0)", "Abaixo da faixa");

/** Carga que o app novo sugere ao subir, quando ela difere da do app antigo (carga fora dos múltiplos do passo). */
function aumentoDiferente(ses: SessaoRegras[], exId: string, cat: Cat, equip: string, cfg: RegrasCompletas): number | null {
  const ult = Novo.historico(exId, ses)[0]?.e.series;
  if (!ult) return null;
  const top = Math.max(...ult.map((x) => x.kg || 0));
  const inc = Novo.incrementoFinal(cat, equip, top, cfg);
  if (!(top > 0) || !(inc > 0)) return null;
  const novo = Math.round((top + inc) * 100) / 100;
  return Novo.arredondar(top + inc, inc) === novo ? null : novo;
}

/** Compara as duas sugestões. Devolve true quando caiu na mudança do arredondamento. */
function conferir(novo: Sugestao, antigo: Sugestao, cargaNova: number | null, rotulo: string) {
  const esperado = { ...antigo, motivo: textoComum(antigo.motivo) };
  novo = { ...novo, motivo: textoComum(novo.motivo) };
  const envolveAumento = antigo.tipo === "subir" || antigo.tipo === "deload" || antigo.motivo.includes("subiria para");
  if (cargaNova === null || !envolveAumento) {
    expect(novo, rotulo).toEqual(esperado);
    return false;
  }
  expect({ ...novo, kg: null, motivo: "" }, rotulo).toEqual({ ...esperado, kg: null, motivo: "" });
  if (novo.tipo === "subir") expect(novo.kg, rotulo).toBe(cargaNova);
  return true;
}

describe("porte em TypeScript x app antigo", () => {
  it("dá a mesma prontidão, deload, condicionamento e calibragem em 3.000 cenários", () => {
    for (let semente = 1; semente <= 3000; semente++) {
      const s = sorteio(semente);
      const hoje = dia("2026-11-16", -s.int(0, 400));
      const cfg = regras(s);
      const ses = sessoes(s, hoje, s.chance(0.3));
      const noites = sono(s, hoje);
      const rotulo = `semente ${semente}`;

      expect(Novo.prontidao({ sono: noites, sessoes: ses, cfg, hoje }), rotulo).toEqual(Antigo.prontidao({ sono: noites, sessoes: ses, cfg, hoje }));

      const deloads = Array.from({ length: s.int(0, 3) }, () => dia(hoje, -s.int(0, 120)));
      expect(Novo.semanasSeguidas({ sessoes: ses, hoje, deloads }), rotulo).toBe(Antigo.semanasSeguidas({ sessoes: ses, hoje, deloads }));

      const treino = { id: s.um(["c1", "c2", "c3"]), voltas: s.int(1, 5), descanso: s.um([0, 60, 90]) };
      for (const p of NIVEIS) expect(Novo.sugerirCond({ treino, sessoes: ses, prontidao: p }), rotulo).toEqual(Antigo.sugerirCond({ treino, sessoes: ses, prontidao: p }));

      expect(Novo.calibrarSono({ sono: noites, sessoes: ses, cfg, hoje }), rotulo).toEqual(Antigo.calibrarSono({ sono: noites, sessoes: ses, cfg, hoje }));
    }
  }, 120_000);

  it("dá a mesma sugestão de carga em 4.000 históricos (com todos os RIR anotados)", () => {
    let comparadas = 0;
    let arredondou = 0;
    const tipos = new Set<string>();
    for (let semente = 1; semente <= 4000; semente++) {
      const s = sorteio(semente * 7 + 3);
      const hoje = "2026-11-16";
      const cfg = regras(s);
      const ses = sessoes(s, hoje, false);
      const antes = JSON.stringify(ses);
      for (const e of EXERCICIOS) {
        const item = { exId: e.id, series: s.int(1, 5), reps: s.um(FAIXAS), cat: s.chance(0.8) ? e.cat : null };
        const info = { tipo: e.cat, equip: e.equip, semCarga: e.semCarga, var: e.var };
        const p = s.um(NIVEIS);
        const deload = s.chance(0.15);
        const novo = Novo.sugerirForca({ item, info, sessoes: ses, prontidao: p, cfg, deload });
        // @ts-expect-error o código antigo aceita cat vazio, mas o tipo dele não declara
        const antigo = Antigo.sugerirForca({ item, info, sessoes: ses, prontidao: p, cfg, deload });
        const cargaNova = aumentoDiferente(ses, e.id, item.cat || e.cat, e.equip, cfg);
        if (conferir(novo, antigo, cargaNova, `semente ${semente}, ${e.id}, reps "${item.reps}"`)) arredondou++;
        comparadas++;
        tipos.add(novo.tipo);
      }
      expect(JSON.stringify(ses), `semente ${semente}: o histórico não pode ser alterado`).toBe(antes);
    }
    expect(comparadas).toBe(40000);
    expect(arredondou).toBeGreaterThan(100);
    expect(arredondou).toBeLessThan(4000);
    // O sorteio precisa passar por todos os caminhos da regra, senão a comparação não prova nada.
    expect([...tipos].sort()).toEqual(["alternativa", "deload", "dor", "manter", "primeira", "reduzir", "subir"]);
  }, 120_000);

  it("com RIR em branco, só muda no caso aprovado: composto no topo deixa de subir", () => {
    let iguais = 0;
    let mudou = 0;
    for (let semente = 1; semente <= 3000; semente++) {
      const s = sorteio(semente * 13 + 5);
      const cfg = regras(s);
      const ses = sessoes(s, "2026-11-16", true);
      for (const e of EXERCICIOS) {
        const item = { exId: e.id, series: s.int(1, 5), reps: s.um(FAIXAS), cat: e.cat };
        const info = { tipo: e.cat, equip: e.equip, semCarga: e.semCarga, var: e.var };
        const p = s.um(NIVEIS);
        const deload = s.chance(0.1);
        const novo = Novo.sugerirForca({ item, info, sessoes: ses, prontidao: p, cfg, deload });
        const antigo = Antigo.sugerirForca({ item, info, sessoes: ses, prontidao: p, cfg, deload });
        const rotulo = `semente ${semente}, ${e.id}, reps "${item.reps}"`;
        if (!casoDoRirEmBranco(ses, e.id, e.cat, item.reps, cfg)) {
          conferir(novo, antigo, aumentoDiferente(ses, e.id, e.cat, e.equip, cfg), rotulo);
          iguais++;
          continue;
        }
        // No caso aprovado o app novo nunca sobe a carga; o resto (séries, última vez) continua igual.
        expect(novo.tipo, rotulo).not.toBe("subir");
        expect(novo.series, rotulo).toBe(antigo.series);
        expect(novo.ultima, rotulo).toEqual(antigo.ultima);
        if (novo.kg !== null && antigo.kg !== null) expect(novo.kg, rotulo).toBeLessThanOrEqual(antigo.kg);
        mudou++;
      }
    }
    expect(iguais).toBeGreaterThan(20000);
    expect(mudou).toBeGreaterThan(50);
  }, 120_000);

  it("tem as mesmas regras padrão e os mesmos campos de Ajustes", () => {
    // Únicas diferenças: o padrão de rirSubir (0, falha vale) e o rótulo que explica isso.
    expect({ ...Novo.PADRAO, rirSubir: 1 }).toEqual(Antigo.PADRAO);
    expect(Novo.PADRAO.rirSubir).toBe(0);
    expect(Novo.CAMPOS.map((c) => ({ ...c, rot: c.rot.replace(" (0 = falha vale)", "") }))).toEqual(Antigo.CAMPOS);
  });

  it("calcula faixa, incremento e 1RM igual", () => {
    for (const t of [...FAIXAS, " 8 - 10 ", "8–10", "10-8", "abc", "3x10"]) expect(Novo.faixa(t), t).toEqual(Antigo.faixa(t));
    const s = sorteio(99);
    for (let i = 0; i < 2000; i++) {
      const cfg = regras(s);
      const e = s.um(EXERCICIOS);
      const kg = s.um([0, 4, 7, 12.5, 32.5, 80, 140]);
      expect(Novo.incrementoFinal(e.cat, e.equip, kg, cfg)).toBe(Antigo.incrementoFinal(e.cat, e.equip, kg, cfg));
      const serie = { kg, reps: s.int(0, 20), rir: s.um([null, 0, 1, 2, 4]) };
      expect(Novo.e1rm(serie)).toBe(Antigo.e1rm(serie));
    }
  });
});
