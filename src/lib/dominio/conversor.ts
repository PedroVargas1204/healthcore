// Backup do app antigo (versões 1 e 2) → pedido da função importar_backup.
// Ids determinísticos (UUID v5 a partir da conta e do id antigo): importar de novo não duplica.

import { EX, MODELOS } from "./catalogo";
import { Rec } from "../legado/recomendacao";

export const NS_HEALTHCORE = "6f1c2a3e-9b7d-5e41-8a2c-4d3b5e6f7a80";

const CHAVES_REGRAS = Object.keys(Rec.PADRAO);

export async function uuidv5(nome: string, ns = NS_HEALTHCORE): Promise<string> {
  const nsBytes = new Uint8Array((ns.replace(/-/g, "").match(/../g) ?? []).map((h) => parseInt(h, 16)));
  const nomeBytes = new TextEncoder().encode(nome);
  const dados = new Uint8Array(nsBytes.length + nomeBytes.length);
  dados.set(nsBytes);
  dados.set(nomeBytes, nsBytes.length);
  const h = new Uint8Array(await crypto.subtle.digest("SHA-1", dados));
  h[6] = (h[6]! & 0x0f) | 0x50;
  h[8] = (h[8]! & 0x3f) | 0x80;
  const x = [...h.subarray(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}

/* ---------- Formato antigo ---------- */
type Antigo = Record<string, unknown>;
type SerieAntiga = { kg?: number; reps?: number; rir?: number | null };
type SessaoAntiga = {
  id: string;
  tipo?: string;
  treinoId?: string;
  letra?: string;
  nome?: string;
  data: string;
  inicio?: number;
  fim?: number;
  duracaoMin?: number;
  kcal?: number | null;
  energia?: number | null;
  dorMusc?: number | null;
  dorArt?: { sim?: boolean; onde?: string; ex?: string[] };
  obs?: string;
  nota?: string;
  prontidao?: { nivel?: string; motivo?: string };
  deload?: boolean;
  cond?: { tempoTotal?: number | null; voltasPlan?: number; voltasFeitas?: number; rpe?: number | null; marcos?: { v: number; i: number; nome?: string; seg: number }[] };
  sug?: { motivo?: string };
  ex?: { id: string; cat?: string; alvo?: string; sug?: Record<string, unknown>; sugAceita?: boolean; series: SerieAntiga[] }[];
};
type TreinoAntigo = {
  id?: string;
  nome: string;
  tipo?: string;
  tags?: string[];
  voltas?: number;
  descanso?: number;
  finalizador?: string;
  obs?: string;
  ex?: { exId: string; series: number; reps: string | number; desc?: number | null; obs?: string; cat?: string }[];
  itens?: { nome: string; alvo?: string; sub?: string }[];
};
type EstadoAntigo = {
  plano?: Record<string, { nome: string; ex: { id: string; series: number; reps: string }[] }>;
  dias?: boolean[];
  modelo?: string;
  perfil?: { nome?: string; altura?: number | null };
  treinos?: Record<string, TreinoAntigo>;
  ordem?: string[];
  semana?: (string | null)[];
  sono?: Record<string, { h: number; q?: number | null; score?: number | null }>;
  medidas?: { id?: string; data: string; peso?: number; cintura?: number; ombro?: number; bf?: number }[];
  exCustom?: Record<string, { nome: string; grupo: string; equip: string; tipo: string; reps?: string; musc?: string[]; sec?: string[]; semCarga?: number | boolean }>;
  config?: { rec?: Record<string, number>; som?: boolean; descComposto?: number; descIsolado?: number };
  deload?: { inicio: string; fim: string } | null;
  deloads?: string[];
  deloadDispensado?: string | null;
  calibracao?: { em: string; limiar: number; queda: number; sessoes?: number } | null;
  calibDispensada?: string | null;
};
export type BackupAntigo = { app: "healthcore"; v?: number; exportadoEm?: string; E: EstadoAntigo; T: SessaoAntiga[] };

export class BackupInvalido extends Error {}

/** Lê o texto do arquivo e confere se é um backup do HealthCore. */
export function lerBackup(texto: string): BackupAntigo {
  let b: unknown;
  try {
    b = JSON.parse(texto);
  } catch {
    throw new BackupInvalido("Esse arquivo não é um backup do HealthCore.");
  }
  const o = b as Antigo;
  if (!o || o.app !== "healthcore" || !o.E || typeof o.E !== "object") throw new BackupInvalido("Esse arquivo não é um backup do HealthCore.");
  return { ...(o as unknown as BackupAntigo), T: Array.isArray(o.T) ? (o.T as SessaoAntiga[]) : [] };
}

/** A mesma migração do app antigo: a versão 1 (plano A a E e dias marcados) vira treinos e semana. */
export function migrarEstado(e: EstadoAntigo): EstadoAntigo {
  if (e.plano && !e.treinos) {
    const treinos: Record<string, TreinoAntigo> = {};
    const ordem: string[] = [];
    for (const L of ["A", "B", "C", "D", "E"]) {
      const p = e.plano[L];
      if (!p) continue;
      treinos[L] = {
        id: L,
        nome: p.nome,
        tipo: "forca",
        tags: L === "B" || L === "E" ? ["pernas"] : [],
        ex: p.ex.map((x) => ({ exId: x.id, series: x.series, reps: x.reps === "40s" ? "40 s" : x.reps, desc: null, obs: "", cat: EX[x.id]?.tipo ?? "comp" })),
      };
      ordem.push(L);
    }
    let i = 0;
    const semana = (e.dias ?? [true, true, true, false, true, true, false]).map((d) => (d && ordem.length ? ordem[i++ % ordem.length]! : null));
    const rec: Record<string, number> = {};
    if (e.config?.descComposto) rec.descComposto = e.config.descComposto;
    if (e.config?.descIsolado) rec.descIsolado = e.config.descIsolado;
    return { ...e, modelo: "dimorfismo5", treinos, ordem, semana, config: { rec, som: e.config?.som !== false } };
  }
  const treinos = e.treinos && typeof e.treinos === "object" ? e.treinos : {};
  const ordem = (Array.isArray(e.ordem) ? e.ordem : []).filter((id) => treinos[id]);
  for (const id of Object.keys(treinos)) if (!ordem.includes(id)) ordem.push(id);
  return { ...e, treinos, ordem, semana: Array.isArray(e.semana) && e.semana.length === 7 ? e.semana : [null, null, null, null, null, null, null] };
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const texto = (s: unknown) => (typeof s === "string" && s.trim() ? s.trim() : null);
const somarDias = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** O app antigo guardava "amarelo"/"vermelho"; o banco usa "amarela"/"vermelha". */
const nivel = (n: unknown) => (n === "verde" ? "verde" : n === "amarelo" || n === "amarela" ? "amarela" : n === "vermelho" || n === "vermelha" ? "vermelha" : null);

export type PedidoImportacao = Awaited<ReturnType<typeof converter>>;

export async function converter(backup: BackupAntigo, uid: string) {
  const E = migrarEstado(backup.E);
  const T = backup.T;
  const id = (tipo: string, antigo: string) => uuidv5(`${uid}:${tipo}:${antigo}`);
  const treinosAntigos = E.treinos ?? {};
  const mapaTreino = new Map<string, string>();
  for (const k of Object.keys(treinosAntigos)) mapaTreino.set(k, await id("treino", k));
  const idTreino = (antigo: string | null | undefined) => (antigo ? (mapaTreino.get(antigo) ?? null) : null);
  const rec = E.config?.rec ?? {};
  const regras = Object.fromEntries(CHAVES_REGRAS.filter((k) => Number.isFinite(rec[k])).map((k) => [k, rec[k]!]));

  const treinos = (E.ordem ?? []).map((k, i) => {
    const t = treinosAntigos[k]!;
    const cond = t.tipo === "cond";
    return {
      id: mapaTreino.get(k)!,
      nome: t.nome,
      tipo: cond ? "cond" : "forca",
      tags: (t.tags ?? []).filter((x) => x === "pernas" || x === "hyrox"),
      voltas: cond ? num(t.voltas) : null,
      descanso_voltas_s: cond ? num(t.descanso) : null,
      finalizador_id: idTreino(t.finalizador),
      obs: texto(t.obs),
      posicao: i,
      exercicios: (t.ex ?? []).map((e) => ({
        ex_chave: e.exId,
        series: e.series,
        reps: String(e.reps),
        descanso_s: num(e.desc),
        obs: texto(e.obs),
        cat: e.cat === "iso" ? "iso" : "comp",
      })),
      estacoes: (t.itens ?? []).map((s) => ({ nome: s.nome, alvo: texto(s.alvo), substituto: texto(s.sub) })),
    };
  });

  const sessoes = [];
  for (const s0 of T) {
    // normSessao do app antigo
    const s = { ...s0, tipo: s0.tipo ?? "forca", treinoId: s0.treinoId ?? s0.letra, obs: s0.obs ?? s0.nota };
    const dor = s.dorArt ?? { sim: false, onde: "", ex: [] };
    const dorEx = Array.isArray(dor.ex) ? dor.ex.filter((x) => typeof x === "string" && x) : [];
    // Regra nova (aprovada): dor articular precisa do exercício. Registro antigo sem exercício vira observação.
    const dorSemEx = !!dor.sim && !dorEx.length;
    const obs = [texto(s.obs), dorSemEx ? `Dor articular sem exercício marcado${dor.onde ? `: ${dor.onde}` : ""}.` : null].filter(Boolean).join(" ") || null;
    const cond = s.tipo === "cond" ? (s.cond ?? {}) : null;
    sessoes.push({
      id: await id("sessao", s.id),
      tipo: s.tipo === "cond" ? "cond" : "forca",
      treino_id: idTreino(s.treinoId),
      nome: texto(s.nome) ?? "Treino",
      data: s.data,
      inicio: s.inicio ? new Date(s.inicio).toISOString() : null,
      fim: s.fim ? new Date(s.fim).toISOString() : null,
      duracao_min: num(s.duracaoMin),
      kcal: num(s.kcal),
      energia: num(s.energia),
      dor_muscular: num(s.dorMusc),
      dor_articular: !!(dor.sim && dorEx.length),
      dor_articular_onde: dor.sim && dorEx.length ? texto(dor.onde) : null,
      dor_articular_ex: dor.sim ? dorEx : [],
      obs,
      prontidao: nivel(s.prontidao?.nivel),
      prontidao_motivo: texto(s.prontidao?.motivo),
      em_deload: !!s.deload,
      tempo_total_s: cond ? num(cond.tempoTotal) : null,
      voltas_plan: cond ? num(cond.voltasPlan) : null,
      voltas_feitas: cond ? num(cond.voltasFeitas) : null,
      rpe: cond ? num(cond.rpe) : null,
      sugestao_motivo: texto(s.sug?.motivo),
      exercicios: (s.ex ?? []).map((e) => ({
        ex_chave: e.id,
        cat: e.cat === "iso" ? "iso" : e.cat === "comp" ? "comp" : (EX[e.id]?.tipo ?? "comp"),
        alvo: e.alvo ? String(e.alvo) : null,
        sugestao: e.sug ?? null,
        sugestao_aceita: e.sug && typeof e.sugAceita === "boolean" ? e.sugAceita : null,
        series: (e.series ?? []).map((r) => ({ kg: num(r.kg) ?? 0, reps: num(r.reps) ?? 0, rir: num(r.rir) })),
      })),
      tempos: cond && Array.isArray(cond.marcos) ? cond.marcos.map((m) => ({ volta: m.v, estacao_pos: m.i, nome: m.nome ?? null, seg: m.seg })) : [],
    });
  }

  const noites = [];
  for (const [data, n] of Object.entries(E.sono ?? {})) {
    if (!n || !Number.isFinite(n.h)) continue;
    noites.push({ id: await id("noite", data), data, horas: n.h, qualidade: num(n.q), score: num(n.score) });
  }
  const medidas = [];
  for (const m of E.medidas ?? []) {
    medidas.push({ id: await id("medida", m.id ?? m.data), data: m.data, peso_kg: num(m.peso), cintura_cm: num(m.cintura), ombro_cm: num(m.ombro), gordura_pct: num(m.bf) });
  }
  const inicios = new Set([...(E.deloads ?? []), ...(E.deload ? [E.deload.inicio] : [])]);
  const deloads = [];
  for (const d of inicios) deloads.push({ id: await id("deload", d), inicio: d, fim: E.deload?.inicio === d ? E.deload.fim : somarDias(d, 6) });
  const calibracoes = E.calibracao
    ? [{ id: await id("calibracao", E.calibracao.em), aplicada_em: E.calibracao.em, limiar_h: E.calibracao.limiar, queda_pct: E.calibracao.queda, sessoes: E.calibracao.sessoes ?? 0 }]
    : [];
  const exercicios_proprios = [];
  for (const [chave, x] of Object.entries(E.exCustom ?? {})) {
    exercicios_proprios.push({
      id: await id("exercicio", chave),
      chave,
      nome: x.nome,
      grupo: x.grupo,
      equip: x.equip,
      tipo: x.tipo === "iso" ? "iso" : "comp",
      reps_padrao: x.reps || "10",
      musc: x.musc ?? [],
      sec: x.sec ?? [],
      sem_carga: !!x.semCarga,
    });
  }

  return {
    perfil: { nome: E.perfil?.nome ?? "", altura_cm: num(E.perfil?.altura), modelo: E.modelo ?? null, onboarding_concluido: true },
    configuracoes: {
      regras,
      som_descanso: E.config?.som !== false,
      deload_dispensado_ate: E.deloadDispensado ?? null,
      calibracao_dispensada_ate: E.calibDispensada ?? null,
    },
    exercicios_proprios,
    treinos,
    semana: (E.semana ?? []).map((k) => idTreino(k)),
    sessoes,
    noites,
    medidas,
    deloads,
    calibracoes,
  };
}

/** O que o arquivo tem, para a tela de prévia. */
export function resumoBackup(b: BackupAntigo) {
  const E = migrarEstado(b.E);
  const treinos = (E.ordem ?? []).map((k) => E.treinos![k]!);
  const medidas = E.medidas ?? [];
  const ultima = [...medidas].sort((a, c) => c.data.localeCompare(a.data))[0];
  const diasComTreino = (E.semana ?? []).filter(Boolean).length;
  return {
    exportadoEm: b.exportadoEm ?? null,
    perfil: { nome: E.perfil?.nome ?? "", altura: num(E.perfil?.altura) },
    treinos: treinos.map((t) => t.nome),
    letras: (E.ordem ?? []).filter((k) => /^[A-Z]\d?$/.test(k)),
    diasComTreino,
    medidas: medidas.length,
    ultimaMedida: ultima ? { peso: num(ultima.peso), bf: num(ultima.bf) } : null,
    sessoes: b.T.length,
    noites: Object.keys(E.sono ?? {}).length,
    proprios: Object.keys(E.exCustom ?? {}).length,
  };
}

/** Modelo do app antigo com id dado (para a tela de boas-vindas). */
export const modeloPorId = (id: string) => MODELOS.find((m) => m.id === id);

/* ---------- Backup do app novo (v3): exportado em Ajustes › Conta ---------- */

type Rotulado = { id: string };
export type BackupNovo = {
  app: "healthcore";
  v: 3;
  exportadoEm?: string;
  conta?: string;
  dados: Omit<PedidoImportacao, "treinos" | "sessoes" | "noites" | "medidas" | "deloads" | "calibracoes" | "exercicios_proprios"> & {
    treinos: (PedidoImportacao["treinos"][number] & Rotulado)[];
    sessoes: (PedidoImportacao["sessoes"][number] & Rotulado)[];
    noites: (Rotulado & Record<string, unknown>)[];
    medidas: (Rotulado & Record<string, unknown>)[];
    deloads: (Rotulado & Record<string, unknown>)[];
    calibracoes: (Rotulado & Record<string, unknown>)[];
    exercicios_proprios: (Rotulado & Record<string, unknown>)[];
  };
};
export type Backup = { tipo: "antigo"; b: BackupAntigo } | { tipo: "novo"; b: BackupNovo };

/** Aceita o backup do app antigo (v1 e v2) e o do app novo (v3). */
export function lerQualquerBackup(texto: string): Backup {
  let o: Antigo;
  try {
    o = JSON.parse(texto) as Antigo;
  } catch {
    throw new BackupInvalido("Esse arquivo não é um backup do HealthCore.");
  }
  if (o && o.app === "healthcore" && o.v === 3 && o.dados && typeof o.dados === "object") return { tipo: "novo", b: o as unknown as BackupNovo };
  return { tipo: "antigo", b: lerBackup(texto) };
}

/** Na mesma conta os ids ficam (importar de novo não duplica); em outra conta ganham ids novos e fixos. */
export async function converterNovo(b: BackupNovo, uid: string): Promise<PedidoImportacao> {
  if (b.conta === uid) return b.dados as unknown as PedidoImportacao;
  const mapa = new Map<string, string>();
  const novo = async (id: string | null | undefined) => {
    if (!id) return null;
    if (!mapa.has(id)) mapa.set(id, await uuidv5(`${uid}:v3:${id}`));
    return mapa.get(id)!;
  };
  const d = b.dados;
  const lista = async <T extends Rotulado>(l: T[]) => Promise.all(l.map(async (x) => ({ ...x, id: (await novo(x.id))! })));
  const treinos = await Promise.all(d.treinos.map(async (t) => ({ ...t, id: (await novo(t.id))!, finalizador_id: await novo(t.finalizador_id) })));
  const sessoes = await Promise.all(d.sessoes.map(async (s) => ({ ...s, id: (await novo(s.id))!, treino_id: await novo(s.treino_id) })));
  return {
    ...(d as unknown as PedidoImportacao),
    treinos,
    sessoes,
    semana: await Promise.all(d.semana.map((x) => novo(x))),
    noites: (await lista(d.noites)) as unknown as PedidoImportacao["noites"],
    medidas: (await lista(d.medidas)) as unknown as PedidoImportacao["medidas"],
    deloads: (await lista(d.deloads)) as unknown as PedidoImportacao["deloads"],
    calibracoes: (await lista(d.calibracoes)) as unknown as PedidoImportacao["calibracoes"],
    exercicios_proprios: (await lista(d.exercicios_proprios)) as unknown as PedidoImportacao["exercicios_proprios"],
  };
}

export function resumoQualquer(x: Backup) {
  if (x.tipo === "antigo") return resumoBackup(x.b);
  const d = x.b.dados;
  const ultima = [...d.medidas].sort((a, c) => String(c.data).localeCompare(String(a.data)))[0] as { peso_kg?: number | null; gordura_pct?: number | null } | undefined;
  return {
    exportadoEm: x.b.exportadoEm ?? null,
    perfil: { nome: d.perfil?.nome ?? "", altura: d.perfil?.altura_cm ?? null },
    treinos: d.treinos.map((t) => t.nome),
    letras: [] as string[],
    diasComTreino: d.semana.filter(Boolean).length,
    medidas: d.medidas.length,
    ultimaMedida: ultima ? { peso: ultima.peso_kg ?? null, bf: ultima.gordura_pct ?? null } : null,
    sessoes: d.sessoes.length,
    noites: d.noites.length,
    proprios: d.exercicios_proprios.length,
  };
}

export const converterQualquer = (x: Backup, uid: string) => (x.tipo === "antigo" ? converter(x.b, uid) : converterNovo(x.b, uid));
