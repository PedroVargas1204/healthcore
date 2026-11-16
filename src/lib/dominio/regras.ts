// Recomendação de carga: prontidão do dia, sugestão por exercício, condicionamento, deload e calibragem do sono.
// Porte para TypeScript do recomendacao.js do app antigo. Funções puras: recebem dados e regras e devolvem a
// sugestão com o motivo. testes/unidade/regras-comparacao.test.ts compara cada saída com o código antigo.
//
// Mudanças de comportamento em relação ao app antigo, todas aprovadas:
// 1. Série com RIR em branco não libera aumento de carga em composto.
// 2. Falha vale: com rirSubir = 0 (o padrão), a progressão é só por repetições. RIR 0 não segura o aumento,
//    não conta como "abaixo da faixa" e não deixa a prontidão amarela. Com rirSubir de 1 para cima vale a regra antiga.
// 3. O aumento soma o passo à carga atual (19 kg + 2 = 21), em vez de arredondar para múltiplos do passo (22).
// 4. Textos: isolado "bateu" (não "passou de") o topo; a redução diz quando o motivo foi RIR 0.

import { LATERAIS } from "./catalogo";

/* ---------- formatos ---------- */

/** Noites por dia em que a pessoa acordou ('AAAA-MM-DD'). */
export type SonoRegras = Record<string, { h: number; q?: number | null; score?: number | null }>;
export type SerieRegras = { kg: number; reps: number; rir: number | null };
export type Cat = "comp" | "iso";
export type ExercicioRegras = { id: string; cat: Cat; series: SerieRegras[] };
/** Sessões sempre da mais recente para a mais antiga. */
export type SessaoRegras = {
  tipo: "forca" | "cond";
  data: string;
  treinoId: string | null;
  energia: number | null;
  dorMusc: number | null;
  dorArt: { sim: boolean; ex: string[] };
  ex: ExercicioRegras[];
  cond?: { tempoTotal: number | null };
};
export type Nivel = "verde" | "amarelo" | "vermelho";
export type Prontidao = {
  nivel: Nivel;
  motivo: string;
  semSono?: boolean;
  media: number | null;
  noite: number | null;
  noites: number;
  criticas: number;
};
export type TipoSugestao = "primeira" | "dor" | "manter" | "subir" | "reduzir" | "alternativa" | "deload";
export type SugestaoForca = {
  kg: number | null;
  reps: string;
  series: number;
  tipo: TipoSugestao;
  motivo: string;
  ultima: SerieRegras[] | null;
  estagnado: boolean;
};
export type SugestaoCond = { voltas: number; descanso: number; motivo: string };
export type ItemRegras = { exId: string; series: number; reps: string; cat?: Cat | null };
export type InfoRegras = { tipo: Cat; equip: string; semCarga?: number | boolean; var?: string };
export type Calibragem = {
  pronto: boolean;
  semEfeito?: boolean;
  sessoes: number;
  semanas: number;
  minSessoes: number;
  minSemanas: number;
  limiar?: number;
  queda?: number;
  abaixo?: number;
  acima?: number;
  sugestao?: { sonoAmareloNoite: number; sonoVerdeNoite: number; sonoCritico: number };
};

/* ---------- regras ---------- */

/** Todos os números das regras. A tela de Ajustes edita estes valores. */
export const PADRAO = {
  sonoVerdeMedia: 7,
  sonoVerdeNoite: 6.5,
  sonoAmareloNoite: 6,
  sonoVermelhoMedia: 6,
  sonoCritico: 5,
  noitesCriticas: 2,
  sessoesRelato: 2,
  rir0Frequente: 50,
  energiaBaixa: 2,
  dorMuscVermelho: 4,
  rirSubir: 0,
  isoSessoesTopo: 2,
  vezesAbaixo: 2,
  reducaoAbaixo: 5,
  reducaoVermelho: 7.5,
  incCompHalteres: 2,
  incCompBarra: 2.5,
  incCompMaquina: 2.5,
  incCompPolia: 2.5,
  incIsoHalteres: 1,
  incIsoBarra: 2.5,
  incIsoMaquina: 2.5,
  incIsoPolia: 2.5,
  incPctComp: 0,
  incPctIso: 0,
  saltoMaxLateral: 10,
  estagnacaoSessoes: 3,
  semanasDeload: 6,
  deloadVolume: 40,
  deloadCarga: 0,
  descComposto: 120,
  descIsolado: 75,
  calibMinSemanas: 4,
  calibMinSessoes: 12,
};
export type ChaveRegra = keyof typeof PADRAO;
export type RegrasCompletas = Record<ChaveRegra, number>;

export type CampoRegra = { g: string; k: ChaveRegra; rot: string; un: string; min: number; max: number; passo: number };

/** Descrição de cada número para a tela de Ajustes. */
export const CAMPOS: CampoRegra[] = [
  { g: "Prontidão: sono", k: "sonoVerdeMedia", rot: "Verde: média de 7 dias a partir de", un: "h", min: 4, max: 10, passo: 0.25 },
  { g: "Prontidão: sono", k: "sonoVerdeNoite", rot: "Verde: noite anterior a partir de", un: "h", min: 4, max: 10, passo: 0.25 },
  { g: "Prontidão: sono", k: "sonoAmareloNoite", rot: "Amarelo: noite anterior abaixo de", un: "h", min: 3, max: 9, passo: 0.25 },
  { g: "Prontidão: sono", k: "sonoVermelhoMedia", rot: "Vermelho: média de 7 dias abaixo de", un: "h", min: 3, max: 9, passo: 0.25 },
  { g: "Prontidão: sono", k: "sonoCritico", rot: "Noite crítica: abaixo de", un: "h", min: 2, max: 8, passo: 0.25 },
  { g: "Prontidão: sono", k: "noitesCriticas", rot: "Vermelho: noites críticas na semana", un: "", min: 1, max: 7, passo: 1 },
  { g: "Prontidão: relatos", k: "sessoesRelato", rot: "Sessões olhadas nos relatos", un: "", min: 1, max: 5, passo: 1 },
  { g: "Prontidão: relatos", k: "rir0Frequente", rot: "RIR 0 frequente: séries com RIR 0 a partir de", un: "%", min: 10, max: 100, passo: 5 },
  { g: "Prontidão: relatos", k: "energiaBaixa", rot: "Energia baixa: até", un: "/5", min: 1, max: 4, passo: 1 },
  { g: "Prontidão: relatos", k: "dorMuscVermelho", rot: "Vermelho: dor muscular a partir de", un: "/5", min: 2, max: 5, passo: 1 },
  { g: "Progressão", k: "rirSubir", rot: "Composto: RIR mínimo para subir carga (0 = falha vale)", un: "", min: 0, max: 4, passo: 1 },
  { g: "Progressão", k: "isoSessoesTopo", rot: "Isolado: sessões no topo da faixa para subir", un: "", min: 1, max: 5, passo: 1 },
  { g: "Progressão", k: "vezesAbaixo", rot: "Abaixo da faixa: vezes seguidas para reduzir", un: "", min: 1, max: 5, passo: 1 },
  { g: "Progressão", k: "reducaoAbaixo", rot: "Redução quando fica abaixo da faixa", un: "%", min: 0, max: 20, passo: 0.5 },
  { g: "Progressão", k: "reducaoVermelho", rot: "Redução de carga no dia vermelho", un: "%", min: 0, max: 20, passo: 0.5 },
  { g: "Progressão", k: "saltoMaxLateral", rot: "Elevação lateral: maior salto de carga aceito", un: "%", min: 2, max: 30, passo: 1 },
  { g: "Incrementos: compostos", k: "incCompHalteres", rot: "Halteres", un: "kg", min: 0.5, max: 10, passo: 0.5 },
  { g: "Incrementos: compostos", k: "incCompBarra", rot: "Barra", un: "kg", min: 0.5, max: 10, passo: 0.5 },
  { g: "Incrementos: compostos", k: "incCompMaquina", rot: "Máquina", un: "kg", min: 0.5, max: 10, passo: 0.5 },
  { g: "Incrementos: compostos", k: "incCompPolia", rot: "Polia", un: "kg", min: 0.5, max: 10, passo: 0.5 },
  { g: "Incrementos: compostos", k: "incPctComp", rot: "Ou subir por % da carga (arredonda para o passo acima)", un: "%", min: 0, max: 10, passo: 0.5 },
  { g: "Incrementos: isolados", k: "incIsoHalteres", rot: "Halteres", un: "kg", min: 0.5, max: 10, passo: 0.5 },
  { g: "Incrementos: isolados", k: "incIsoBarra", rot: "Barra", un: "kg", min: 0.5, max: 10, passo: 0.5 },
  { g: "Incrementos: isolados", k: "incIsoMaquina", rot: "Máquina", un: "kg", min: 0.5, max: 10, passo: 0.5 },
  { g: "Incrementos: isolados", k: "incIsoPolia", rot: "Polia", un: "kg", min: 0.5, max: 10, passo: 0.5 },
  { g: "Incrementos: isolados", k: "incPctIso", rot: "Ou subir por % da carga (arredonda para o passo acima)", un: "%", min: 0, max: 10, passo: 0.5 },
  { g: "Estagnação e deload", k: "estagnacaoSessoes", rot: "Sessões sem progresso para sugerir deload", un: "", min: 2, max: 8, passo: 1 },
  { g: "Estagnação e deload", k: "semanasDeload", rot: "Semanas seguidas de treino para sugerir deload", un: "", min: 3, max: 12, passo: 1 },
  { g: "Estagnação e deload", k: "deloadVolume", rot: "Deload: redução de séries", un: "%", min: 10, max: 70, passo: 5 },
  { g: "Estagnação e deload", k: "deloadCarga", rot: "Deload: redução de carga", un: "%", min: 0, max: 20, passo: 2.5 },
  { g: "Descanso padrão", k: "descComposto", rot: "Compostos", un: "s", min: 30, max: 300, passo: 15 },
  { g: "Descanso padrão", k: "descIsolado", rot: "Isolados", un: "s", min: 30, max: 300, passo: 15 },
  { g: "Calibragem do sono", k: "calibMinSemanas", rot: "Semanas mínimas de histórico", un: "", min: 2, max: 12, passo: 1 },
  { g: "Calibragem do sono", k: "calibMinSessoes", rot: "Sessões mínimas com sono registrado", un: "", min: 6, max: 60, passo: 1 },
];

/* ---------- utilidades ---------- */

const chave = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const deChave = (k: string) => {
  const p = k.split("-").map(Number);
  return new Date(p[0]!, p[1]! - 1, p[2]!);
};
const somarDias = (k: string, n: number) => {
  const d = deChave(k);
  d.setDate(d.getDate() + n);
  return chave(d);
};
const media = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const ehNumero = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const fmt = (n: number, casas = 1) => (Number.isFinite(n) ? n.toLocaleString("pt-BR", { maximumFractionDigits: casas, useGrouping: false }) : "—");
const kgTxt = (n: number) => `${fmt(n, 2)} kg`;
const plural = (n: number, um: string, varios: string) => (n > 1 ? varios : um);

/** Arredonda a carga para um múltiplo do passo (0,5 kg quando o equipamento não tem passo). */
export function arredondar(kg: number, inc: number) {
  const p = inc > 0 ? inc : 0.5;
  return Math.max(0, Math.round(Math.round(kg / p) * p * 100) / 100);
}

/** '8-10' → {min:8,max:10}; '12' → {12,12}; '40 s', '500 m' ou 'falha' → null (sem faixa de reps). */
export function faixa(r: string | null | undefined): { min: number; max: number } | null {
  const t = String(r || "").trim();
  const m = t.match(/^(\d+)\s*[-–a]\s*(\d+)$/);
  if (m) return { min: +m[1]!, max: +m[2]! };
  const n = t.match(/^(\d+)$/);
  if (n) return { min: +n[1]!, max: +n[1]! };
  return null;
}

const SUFIXO_EQUIP: Record<string, "Halteres" | "Barra" | "Maquina" | "Polia"> = { Halteres: "Halteres", Barra: "Barra", Máquina: "Maquina", Polia: "Polia" };

/** Menor passo de carga do equipamento. Peso corporal e equipamento desconhecido: 0. */
export function incremento(cat: Cat, equip: string, cfg: RegrasCompletas) {
  const sufixo = SUFIXO_EQUIP[equip];
  if (!sufixo) return 0;
  return cfg[`${cat === "comp" ? "incComp" : "incIso"}${sufixo}`] || 0;
}

/** Incremento do dia: o menor passo do equipamento ou, se ligado, uma % da carga arredondada para esse passo. */
export function incrementoFinal(cat: Cat, equip: string, topKg: number, cfg: RegrasCompletas) {
  const passo = incremento(cat, equip, cfg);
  const pct = cat === "comp" ? cfg.incPctComp : cfg.incPctIso;
  if (!pct || !(topKg > 0) || !passo) return passo;
  return Math.max(passo, Math.round((topKg * pct) / 100 / passo) * passo);
}
const incTxt = (inc: number, topKg: number) => `+${fmt(inc, 2)} kg${topKg > 0 ? ` (${fmt((inc / topKg) * 100, 1)}%)` : ""}`;

/** Estimativa de 1RM com o RIR somado às reps (Epley). Sem carga, vale o total de reps. */
export function e1rm(s: { kg: number; reps: number; rir?: number | null }) {
  const r = (s.reps || 0) + (ehNumero(s.rir) ? s.rir : 0);
  return s.kg > 0 ? s.kg * (1 + r / 30) : r;
}
export function melhor<T extends { kg: number; reps: number; rir?: number | null }>(series: T[]): T | null {
  return series.reduce<T | null>((b, s) => (!b || e1rm(s) > e1rm(b) ? s : b), null);
}

/* ================= PRONTIDÃO ================= */

function fracaoRir0(s: SessaoRegras) {
  const sets: SerieRegras[] = [];
  for (const e of s.ex || []) if (e.cat !== "iso") for (const x of e.series) if (ehNumero(x.rir)) sets.push(x);
  if (!sets.length) return 0;
  return sets.filter((x) => x.rir === 0).length / sets.length;
}

/** Com rirSubir em 0 a pessoa treina até a falha de propósito: RIR 0 deixa de ser sinal de cansaço. */
const falhaVale = (cfg: RegrasCompletas) => cfg.rirSubir <= 0;
const centesimos = (kg: number) => Math.round(kg * 100) / 100;

export function prontidao({ sono, sessoes, cfg, hoje }: { sono: SonoRegras; sessoes: SessaoRegras[]; cfg: RegrasCompletas; hoje: string }): Prontidao {
  const noites: number[] = [];
  for (let i = 0; i < 7; i++) {
    const n = sono[somarDias(hoje, -i)];
    if (n && ehNumero(n.h)) noites.push(n.h);
  }
  const med = media(noites);
  const deHoje = sono[hoje];
  const ontem = deHoje && ehNumero(deHoje.h) ? deHoje.h : null;
  const criticas = noites.filter((h) => h < cfg.sonoCritico).length;
  const forca = sessoes.filter((s) => s.tipo === "forca").slice(0, cfg.sessoesRelato);
  const ultima = sessoes[0];
  const base = { media: med, noite: ontem, noites: noites.length, criticas };

  const vermelho = (motivo: string): Prontidao => ({ nivel: "vermelho", motivo, ...base });
  const amarelo = (motivo: string): Prontidao => ({ nivel: "amarelo", motivo, ...base });

  if (med != null && noites.length >= 3 && med < cfg.sonoVermelhoMedia) return vermelho(`Média de sono ${fmt(med)} h na semana: reduzindo a carga hoje.`);
  if (criticas >= cfg.noitesCriticas) return vermelho(`${criticas} noites abaixo de ${fmt(cfg.sonoCritico)} h nesta semana: reduzindo a carga hoje.`);
  if (ultima && ehNumero(ultima.dorMusc) && ultima.dorMusc >= cfg.dorMuscVermelho) return vermelho(`Dor muscular ${ultima.dorMusc}/5 no último treino: reduzindo a carga hoje.`);

  if (med != null && noites.length >= 3 && med < cfg.sonoVerdeMedia) return amarelo(`Média de sono ${fmt(med)} h: mantendo as cargas.`);
  if (ontem != null && ontem < cfg.sonoAmareloNoite) return amarelo(`Dormiu ${fmt(ontem)} h esta noite: mantendo as cargas.`);
  if (ontem != null && ontem < cfg.sonoVerdeNoite) return amarelo(`Noite de ${fmt(ontem)} h, abaixo de ${fmt(cfg.sonoVerdeNoite)} h: mantendo as cargas.`);
  if (!falhaVale(cfg) && forca.length >= cfg.sessoesRelato && forca.every((s) => fracaoRir0(s) * 100 >= cfg.rir0Frequente)) return amarelo("RIR 0 frequente nos últimos treinos: mantendo as cargas.");
  if (forca.length >= cfg.sessoesRelato && forca.every((s) => ehNumero(s.energia) && s.energia <= cfg.energiaBaixa)) return amarelo("Energia baixa nos últimos treinos: mantendo as cargas.");

  if (med == null && ontem == null) return { nivel: "verde", semSono: true, motivo: "Sem sono registrado: progressão normal pelos treinos. Lance a noite para ajustar.", ...base };
  const partes: string[] = [];
  if (med != null) partes.push(`média de sono ${fmt(med)} h`);
  if (ontem != null) partes.push(`noite de ${fmt(ontem)} h`);
  const txt = partes.join(", ");
  return { nivel: "verde", motivo: `${txt.charAt(0).toUpperCase()}${txt.slice(1)}: progressão normal.`, ...base };
}

/* ================= SUGESTÃO POR EXERCÍCIO (força) ================= */

type Passagem = { s: SessaoRegras; e: ExercicioRegras };
type Faixa = { min: number; max: number };

/** Todas as vezes em que o exercício foi feito, da mais recente para a mais antiga. */
export function historico(exId: string, sessoes: SessaoRegras[]): Passagem[] {
  const h: Passagem[] = [];
  for (const s of sessoes) {
    if (s.tipo !== "forca") continue;
    const e = (s.ex || []).find((x) => x.id === exId);
    if (e && e.series.length) h.push({ s, e });
  }
  return h;
}

const faltouReps = (series: SerieRegras[], r: Faixa) => series.some((x) => x.reps < r.min);
const rir0Cedo = (series: SerieRegras[]) => series.slice(0, -1).some((x) => x.rir === 0);
/** Abaixo da faixa: alguma série com menos reps que o mínimo ou, quando a falha não vale, RIR 0 antes da última série. */
export const abaixoDaFaixa = (series: SerieRegras[], r: Faixa, cfg: RegrasCompletas) => faltouReps(series, r) || (!falhaVale(cfg) && rir0Cedo(series));
export const noTopo = (series: SerieRegras[], r: Faixa) => series.length > 0 && series.every((x) => x.reps >= r.max);

const seguidasEnquanto = (hist: Passagem[], cond: (p: Passagem) => boolean) => {
  let n = 0;
  for (const h of hist) {
    if (cond(h)) n++;
    else break;
  }
  return n;
};

/** Estagnado: as últimas N sessões não superaram a melhor marca anterior a elas. */
export function estagnado(hist: Passagem[], cfg: RegrasCompletas) {
  const n = cfg.estagnacaoSessoes;
  if (hist.length < n + 1) return false;
  const marca = (h: Passagem) => e1rm(melhor(h.e.series)!);
  const recentes = hist.slice(0, n).map(marca);
  const antes = Math.max(...hist.slice(n).map(marca));
  return recentes.every((v) => v <= antes);
}

function aplicarDeload(s: SugestaoForca, item: ItemRegras, cfg: RegrasCompletas, deload: boolean): SugestaoForca {
  if (!deload) return s;
  s.series = Math.max(1, Math.round(item.series * (1 - cfg.deloadVolume / 100)));
  if (s.kg && cfg.deloadCarga > 0) s.kg = arredondar(s.kg * (1 - cfg.deloadCarga / 100), 0.5);
  s.tipo = "deload";
  s.motivo = `Semana de deload: ${s.series} ${plural(s.series, "série", "séries")}${cfg.deloadCarga > 0 ? ` e −${fmt(cfg.deloadCarga)}% de carga` : " com a mesma carga"}.`;
  return s;
}

function ajustarProntidao(s: SugestaoForca, p: Prontidao | null | undefined, cat: Cat, topKg: number, inc: number, cfg: RegrasCompletas): SugestaoForca {
  if (!p || p.nivel === "verde" || s.tipo === "dor" || s.tipo === "deload") return s;
  if (p.nivel === "amarelo") {
    if (s.tipo === "subir") {
      const subiria = s.kg;
      s.kg = topKg > 0 ? topKg : s.kg;
      s.tipo = "manter";
      s.motivo = `Prontidão amarela: mantenha ${topKg > 0 ? kgTxt(topKg) : "a carga"} hoje${subiria && topKg > 0 ? ` (subiria para ${kgTxt(subiria)}).` : "."}`;
    }
    return s;
  }
  /* vermelho */
  if (cat === "comp" && topKg > 0 && cfg.reducaoVermelho > 0) {
    s.kg = arredondar(topKg * (1 - cfg.reducaoVermelho / 100), inc || 0.5);
    s.tipo = "reduzir";
    s.motivo = `Prontidão vermelha: −${fmt(cfg.reducaoVermelho)}% na carga hoje (${kgTxt(s.kg)}).`;
  } else {
    s.kg = topKg > 0 ? topKg : s.kg;
    s.series = Math.max(1, s.series - 1);
    s.tipo = "reduzir";
    s.motivo = `Prontidão vermelha: mesma carga com ${s.series} ${plural(s.series, "série", "séries")} hoje.`;
  }
  return s;
}

export function sugerirForca({
  item,
  info,
  sessoes,
  prontidao: p,
  cfg,
  deload,
}: {
  item: ItemRegras;
  info: InfoRegras;
  sessoes: SessaoRegras[];
  prontidao?: Prontidao | null;
  cfg: RegrasCompletas;
  deload?: boolean;
}): SugestaoForca {
  const cat: Cat = item.cat || info.tipo;
  const r = faixa(item.reps);
  const hist = historico(item.exId, sessoes);
  const out: SugestaoForca = { kg: null, reps: item.reps, series: item.series, tipo: "primeira", motivo: "", ultima: null, estagnado: false };

  if (!hist.length) {
    out.motivo = info.semCarga ? "Primeira vez: anote reps e RIR para o app aprender." : "Primeira vez: escolha uma carga em que sobrem 2 reps (RIR 2).";
    return aplicarDeload(out, item, cfg, !!deload);
  }
  const series = hist[0]!.e.series;
  const topKg = Math.max(...series.map((x) => x.kg || 0));
  const inc = incrementoFinal(cat, info.equip, topKg, cfg);
  const carga = topKg > 0 ? kgTxt(topKg) : null;
  out.ultima = series;
  out.kg = topKg > 0 ? topKg : null;

  /* 1. Dor articular vale acima de qualquer regra. */
  const dor = hist[0]!.s.dorArt;
  if (dor && dor.sim && (dor.ex || []).includes(item.exId)) {
    out.tipo = "dor";
    out.motivo = `Incômodo articular na última vez: não suba a carga. Teste ${info.var || "uma variação mais confortável"}.`;
    return out;
  }

  /* 2. Meta de tempo, distância ou até a falha: sem faixa de reps. */
  if (!r) {
    out.tipo = "manter";
    out.motivo = `Meta: ${item.reps}. Tente superar a última vez (${series.map((x) => x.reps).join(", ")}).`;
    return ajustarProntidao(aplicarDeload(out, item, cfg, !!deload), p, cat, topKg, inc, cfg);
  }

  /* 3. Base: dupla progressão. */
  const minReps = Math.min(...series.map((x) => x.reps || 0));

  if (abaixoDaFaixa(series, r, cfg)) {
    const vezesAbaixo = seguidasEnquanto(hist, (h) => abaixoDaFaixa(h.e.series, r, cfg));
    out.tipo = "manter";
    if (topKg > 0 && vezesAbaixo >= cfg.vezesAbaixo && cfg.reducaoAbaixo > 0) {
      out.kg = arredondar(topKg * (1 - cfg.reducaoAbaixo / 100), inc || 0.5);
      out.tipo = "reduzir";
      const soReps = hist.slice(0, vezesAbaixo).every((h) => faltouReps(h.e.series, r));
      out.motivo = `${soReps ? "Abaixo da faixa" : "Abaixo da faixa ou sem sobra (RIR 0)"} ${vezesAbaixo} vezes seguidas: −${fmt(cfg.reducaoAbaixo)}% para recuperar as reps.`;
    } else {
      const rir0 = !falhaVale(cfg) && rir0Cedo(series);
      out.motivo = `${rir0 ? "Chegou a RIR 0 antes da última série" : `Ficou abaixo de ${r.min} reps`}: mantenha ${carga ?? "o esforço"} hoje.`;
    }
  } else if (cat === "comp") {
    const topo = noTopo(series, r);
    const semRir = series.some((x) => !ehNumero(x.rir));
    const rirBaixo = series.some((x) => ehNumero(x.rir) && x.rir < cfg.rirSubir);
    if (topo && rirBaixo) {
      out.tipo = "manter";
      out.motivo = `Bateu o topo, mas com RIR abaixo de ${cfg.rirSubir}: mantenha ${carga ?? "a carga"} até sobrar 1 rep.`;
    } else if (topo && semRir) {
      /* Mudança aprovada: sem RIR anotado não dá para saber se sobrou esforço; o app antigo subia a carga aqui. */
      out.tipo = "manter";
      out.motivo = `Bateu o topo, mas faltou anotar o RIR: mantenha ${carga ?? "a carga"} e anote o RIR para liberar o aumento.`;
    } else if (topo) {
      out.tipo = "subir";
      if (topKg > 0 && inc > 0) {
        out.kg = centesimos(topKg + inc);
        out.reps = r.min === r.max ? item.reps : `${r.min}-${r.max}`;
        out.motivo = `Bateu ${r.max} reps nas ${series.length} séries${falhaVale(cfg) ? "" : ` com RIR ${cfg.rirSubir} ou mais`}: ${incTxt(inc, topKg)}.`;
      } else {
        out.motivo = `Bateu ${r.max} reps em todas as séries: acrescente carga (cinto ou halter) ou desça em 3 s.`;
      }
    } else {
      const alvo = Math.min(r.max, minReps + 1);
      out.tipo = "manter";
      out.reps = String(alvo);
      out.motivo = `Dentro da faixa: mantenha ${carga ?? "a carga"} e tente ${alvo} reps (+1).`;
    }
  } else {
    /* Isolado: primeiro reps, depois carga. */
    const seguidas = seguidasEnquanto(hist, (h) => noTopo(h.e.series, r));
    if (seguidas >= cfg.isoSessoesTopo && topKg > 0 && inc > 0) {
      const salto = (inc / topKg) * 100;
      if (LATERAIS.includes(item.exId) && salto > cfg.saltoMaxLateral) {
        out.tipo = "alternativa";
        out.reps = String(r.max + 2);
        out.motivo = `O próximo peso (+${fmt(inc, 2)} kg) é um salto de ${fmt(salto, 0)}%. Mantenha ${kgTxt(topKg)} e faça mais reps, pausa de 1 s no topo ou descida em 3 s.`;
      } else {
        out.kg = centesimos(topKg + inc);
        out.tipo = "subir";
        out.reps = String(r.min);
        out.motivo = `Bateu ${r.max} reps em todas as séries ${seguidas} vezes seguidas: ${incTxt(inc, topKg)} e volte para ${r.min} reps.`;
      }
    } else if (seguidas >= 1) {
      out.tipo = "manter";
      out.reps = `${r.max}+`;
      out.motivo = `Isolado: bateu o topo ${seguidas} ${plural(seguidas, "vez", "vezes")}. Repita ${r.max}+ reps em todas para subir a carga.`;
    } else {
      const alvo = Math.min(r.max, minReps + 1);
      out.tipo = "manter";
      out.reps = String(alvo);
      out.motivo = `Isolado: tente ${alvo} reps antes de subir a carga.`;
    }
  }

  out.estagnado = estagnado(hist, cfg);
  if (out.estagnado) out.motivo += ` ${cfg.estagnacaoSessoes} sessões sem progresso: considere um deload.`;
  return ajustarProntidao(aplicarDeload(out, item, cfg, !!deload), p, cat, topKg, inc, cfg);
}

/* ================= CONDICIONAMENTO ================= */

function mmss(seg: number) {
  const s = Math.max(0, Math.round(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(r).padStart(2, "0")}`;
}

export function sugerirCond({
  treino,
  sessoes,
  prontidao: p,
}: {
  treino: { id: string; voltas: number; descanso: number };
  sessoes: SessaoRegras[];
  prontidao?: Prontidao | null;
}): SugestaoCond {
  const ult = sessoes.find((s) => s.tipo === "cond" && s.treinoId === treino.id && s.cond && s.cond.tempoTotal);
  const out: SugestaoCond = { voltas: treino.voltas, descanso: treino.descanso, motivo: "" };
  const tempo = ult ? mmss(ult.cond!.tempoTotal!) : null;
  if (!p || p.nivel === "verde") {
    out.motivo = tempo ? `Ritmo normal: tente bater ${tempo} da última vez.` : "Primeira vez: ritmo em que dá para falar frases curtas (RPE 7).";
  } else if (p.nivel === "amarelo") {
    out.motivo = "Prontidão amarela: mesmo volume, ritmo confortável (RPE até 7).";
  } else {
    out.voltas = Math.max(1, treino.voltas - 1);
    out.descanso = Math.round((treino.descanso || 60) * 1.5);
    out.motivo =
      treino.voltas > 1
        ? `Prontidão vermelha: faça ${out.voltas} ${plural(out.voltas, "volta", "voltas")} e descanse mais entre elas.`
        : "Prontidão vermelha: corte uns 25% da distância e vá em ritmo leve.";
  }
  return out;
}

/* ================= DELOAD POR SEMANAS SEGUIDAS ================= */

/** Quantas semanas (segunda a domingo) seguidas com treino, parando na primeira semana vazia ou de deload. */
export function semanasSeguidas({ sessoes, hoje, deloads }: { sessoes: { data: string }[]; hoje: string; deloads?: string[] }) {
  const inicioSem = (k: string) => {
    const d = deChave(k);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return chave(d);
  };
  const comTreino = new Set(sessoes.map((s) => inicioSem(s.data)));
  const deloadSem = new Set((deloads || []).map(inicioSem));
  let sem = inicioSem(hoje);
  if (!comTreino.has(sem)) sem = somarDias(sem, -7);
  let n = 0;
  while (comTreino.has(sem) && !deloadSem.has(sem) && n < 60) {
    n++;
    sem = somarDias(sem, -7);
  }
  return n;
}

/* ================= CALIBRAGEM PESSOAL DO SONO ================= */

const LIMIARES_SONO = [5, 5.5, 6, 6.5, 7, 7.5];

/** Procura o corte de horas de sono abaixo do qual o desempenho nos compostos cai mais (pelo menos 2%). */
export function calibrarSono({ sono, sessoes, cfg, hoje }: { sono: SonoRegras; sessoes: SessaoRegras[]; cfg: RegrasCompletas; hoje: string }): Calibragem {
  const forca = sessoes.filter((s) => s.tipo === "forca");
  const primeira = forca.length ? forca[forca.length - 1]!.data : hoje;
  const semanas = Math.floor((deChave(hoje).getTime() - deChave(primeira).getTime()) / (7 * 864e5));

  /* desempenho relativo por exercício composto */
  const porEx: Record<string, number[]> = {};
  for (const s of forca)
    for (const e of s.ex || []) {
      if (e.cat === "iso") continue;
      const b = melhor(e.series);
      if (b && b.kg > 0) (porEx[e.id] ??= []).push(e1rm(b));
    }
  const mediaEx: Record<string, number | null> = {};
  for (const id of Object.keys(porEx)) mediaEx[id] = media(porEx[id]!);

  const pares: { h: number; perf: number }[] = [];
  for (const s of forca) {
    const n = sono[s.data];
    if (!n || !ehNumero(n.h)) continue;
    const rel: number[] = [];
    for (const e of s.ex || []) {
      const m = mediaEx[e.id];
      if (e.cat === "iso" || !m) continue;
      const b = melhor(e.series);
      if (b && b.kg > 0) rel.push(e1rm(b) / m);
    }
    if (rel.length) pares.push({ h: n.h, perf: media(rel)! });
  }

  const base = { sessoes: pares.length, semanas: Math.max(0, semanas), minSessoes: cfg.calibMinSessoes, minSemanas: cfg.calibMinSemanas };
  if (semanas < cfg.calibMinSemanas || pares.length < cfg.calibMinSessoes) return { pronto: false, ...base };

  let best: { limiar: number; queda: number; abaixo: number; acima: number } | null = null;
  for (const x of LIMIARES_SONO) {
    const ab = pares.filter((p) => p.h < x);
    const ac = pares.filter((p) => p.h >= x);
    if (ab.length < 3 || ac.length < 3) continue;
    const mA = media(ac.map((p) => p.perf))!;
    const mB = media(ab.map((p) => p.perf))!;
    const queda = ((mA - mB) / mA) * 100;
    if (!best || queda > best.queda) best = { limiar: x, queda, abaixo: ab.length, acima: ac.length };
  }
  if (!best || best.queda < 2) return { pronto: true, semEfeito: true, ...base };
  return {
    pronto: true,
    limiar: best.limiar,
    queda: best.queda,
    abaixo: best.abaixo,
    acima: best.acima,
    sugestao: { sonoAmareloNoite: best.limiar, sonoVerdeNoite: best.limiar + 0.5, sonoCritico: Math.max(3, best.limiar - 1) },
    ...base,
  };
}
