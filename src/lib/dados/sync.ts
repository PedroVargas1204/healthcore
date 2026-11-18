// Sincronização com a Supabase.
// Envio: a fila sobe em ordem (treinos antes da semana e das sessões); a última mudança de cada registro vence.
// Puxada: cada tabela por (atualizado_em, id), com 2 minutos de sobreposição para não perder nada que
// estava sendo gravado na hora; as remoções vêm por id. Um registro com mudança local pendente não é sobrescrito.

import { banco, uidAtual, type BancoLocal, type ItemFila, type TabelaRaiz } from "./local";
import { supabase, type Supa } from "./supabase";
import { ehTransitorio, mensagemDoErro, type ErroBanco } from "./erros";
import type {
  Calibracao,
  Deload,
  ExercicioProprio,
  Medida,
  Noite,
  Sessao,
  SessaoAtiva,
  Treino,
} from "../dominio/tipos";

/* ---------- Estado visível na tela ---------- */

export type EstadoSync = {
  fase: "ocioso" | "sincronizando" | "offline" | "erro";
  pendentes: number;
  falhas: { chave: string; mensagem: string }[];
  ultimaVez: number | null;
  primeiraCarga: boolean;
};

let estado: EstadoSync = { fase: "ocioso", pendentes: 0, falhas: [], ultimaVez: null, primeiraCarga: false };
const ouvintes = new Set<() => void>();
const mudar = (m: Partial<EstadoSync>) => {
  estado = { ...estado, ...m };
  ouvintes.forEach((f) => f());
};
export const lerEstadoSync = () => estado;
export const ouvirSync = (f: () => void) => {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
};

/* ---------- Agendamento ---------- */

let timer: ReturnType<typeof setTimeout> | null = null;
let rodando: Promise<void> | null = null;
let deNovo = false;

export function agendarSincronia(atraso = 400) {
  if (typeof window === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void sincronizar();
  }, atraso);
}

export async function sincronizar(): Promise<void> {
  if (rodando) {
    deNovo = true;
    return rodando;
  }
  rodando = (async () => {
    try {
      do {
        deNovo = false;
        await umaRodada();
      } while (deNovo);
    } finally {
      rodando = null;
    }
  })();
  return rodando;
}

let espera = 0;

async function umaRodada() {
  const uid = uidAtual();
  if (!uid) return;
  const db = banco();
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    mudar({ fase: "offline", pendentes: await db.fila.count() });
    return;
  }
  const supa = supabase();
  // A sessão pode trocar no meio da rodada (sair e entrar com outra conta). Cada etapa confere que ainda é a mesma
  // pessoa, para nada de uma conta subir com o login da outra nem descer para o banco errado.
  const mesmaConta = async () => uidAtual() === uid && (await supa.auth.getSession()).data.session?.user.id === uid;
  mudar({ fase: "sincronizando" });
  try {
    if (!(await mesmaConta())) return;
    const ok = await enviar(db, supa, uid);
    if (!ok) {
      mudar({ fase: "offline", pendentes: await db.fila.count() });
      tentarDepois();
      return;
    }
    if (!(await mesmaConta())) return;
    await puxar(db, supa);
    espera = 0;
    const fila = await db.fila.toArray();
    const falhas = fila.filter((f) => f.erro).map((f) => ({ chave: f.chave, mensagem: f.erro ?? "" }));
    mudar({ fase: falhas.length ? "erro" : "ocioso", pendentes: fila.length, falhas, ultimaVez: Date.now(), primeiraCarga: true });
  } catch (e) {
    const erro = e as ErroBanco;
    mudar({ fase: ehTransitorio(erro) ? "offline" : "erro", pendentes: await db.fila.count() });
    tentarDepois();
  }
}

function tentarDepois() {
  espera = Math.min(espera ? espera * 2 : 5000, 120000);
  agendarSincronia(espera);
}

/* ---------- Envio ---------- */

const PRIORIDADE: Record<string, number> = {
  perfis: 0, configuracoes: 0, exercicios_proprios: 1, treinos: 2, semana: 3, sessoes: 4,
  noites: 5, medidas: 5, deloads: 5, calibracoes: 5, sessao_rascunho: 6,
};

class FalhaDeEnvio extends Error {
  constructor(public erro: ErroBanco) {
    super(erro.message);
  }
}

const checar = (r: { error: ErroBanco | null }) => {
  if (r.error) throw new FalhaDeEnvio(r.error);
};

/** Devolve false se parou por falta de conexão. */
async function enviar(db: BancoLocal, supa: Supa, uid: string): Promise<boolean> {
  const fila = await db.fila.toArray();
  const treinosLocais = new Map((await db.treinos.toArray()).map((t) => [t.id, t]));
  // Treinos que são finalizadores sobem antes dos que apontam para eles.
  const peso = (f: ItemFila) => (f.tabela === "treinos" && treinosLocais.get(f.id)?.finalizador_id ? 1 : 0);
  fila.sort((a, b) => (PRIORIDADE[a.tabela] ?? 9) - (PRIORIDADE[b.tabela] ?? 9) || peso(a) - peso(b) || a.em - b.em);
  for (const item of fila) {
    if (item.erro && item.tentativas >= 3) continue;
    try {
      await enviarItem(db, supa, uid, item);
      // Só tira da fila se ninguém mudou o registro enquanto ele subia.
      await db.transaction("rw", db.fila, async () => {
        const agora = await db.fila.get(item.chave);
        if (agora && agora.em === item.em) await db.fila.delete(item.chave);
      });
    } catch (e) {
      const erro = e instanceof FalhaDeEnvio ? e.erro : ({ message: String(e) } as ErroBanco);
      if (ehTransitorio(erro)) return false;
      await db.fila.update(item.chave, { erro: mensagemDoErro(erro), tentativas: item.tentativas + 1 });
    }
  }
  return true;
}

async function enviarItem(db: BancoLocal, supa: Supa, uid: string, item: ItemFila) {
  const { tabela, id, op } = item;
  if (op === "apagar") {
    if (tabela === "sessao_rascunho") return checar(await supa.from("sessao_rascunho").delete().eq("user_id", uid));
    if (tabela === "semana" || tabela === "perfis" || tabela === "configuracoes") return;
    return checar(await supa.from(tabela).delete().eq("id", id));
  }
  switch (tabela) {
    case "treinos": {
      const t = await db.treinos.get(id);
      if (!t) return;
      return checar(await supa.rpc("salvar_treino", { p: semDatas(t) }));
    }
    case "sessoes": {
      const s = await db.sessoes.get(id);
      if (!s) return;
      return checar(await supa.rpc("salvar_sessao", { p: semDatas(s) }));
    }
    case "semana": {
      const d = await db.semana.get(Number(id));
      if (!d) return;
      return checar(await supa.from("semana").upsert({ dia: d.dia, treino_id: d.treino_id }, { onConflict: "user_id,dia" }));
    }
    case "perfis": {
      const u = await db.unicos.get("perfil");
      if (u?.chave !== "perfil") return;
      const { nome, altura_cm, modelo, onboarding_concluido } = u.valor;
      return checar(await supa.from("perfis").update({ nome, altura_cm, modelo, onboarding_concluido }).eq("user_id", uid));
    }
    case "configuracoes": {
      const u = await db.unicos.get("configuracoes");
      if (u?.chave !== "configuracoes") return;
      const { regras, som_descanso, deload_dispensado_ate, calibracao_dispensada_ate } = u.valor;
      return checar(
        await supa.from("configuracoes").update({ regras, som_descanso, deload_dispensado_ate, calibracao_dispensada_ate }).eq("user_id", uid),
      );
    }
    case "sessao_rascunho": {
      const u = await db.unicos.get("rascunho");
      if (u?.chave !== "rascunho") return;
      return checar(await supa.from("sessao_rascunho").upsert({ dados: u.valor as never }, { onConflict: "user_id" }));
    }
    case "noites": {
      const n = await db.noites.get(id);
      if (!n) return;
      return checar(await supa.from("noites").upsert(semDatas(n), { onConflict: "user_id,data" }));
    }
    case "deloads": {
      const d = await db.deloads.get(id);
      if (!d) return;
      return checar(await supa.from("deloads").upsert(semDatas(d), { onConflict: "user_id,inicio" }));
    }
    case "medidas":
    case "calibracoes":
    case "exercicios_proprios": {
      const r = await db.table(tabela).get(id);
      if (!r) return;
      return checar(await supa.from(tabela).upsert(semDatas(r) as never, { onConflict: "id" }));
    }
  }
}

function semDatas<T extends { atualizado_em?: string; criado_em?: string }>(r: T) {
  const { atualizado_em: _a, criado_em: _c, ...resto } = r;
  return resto as never;
}

/* ---------- Puxada ---------- */

const NADA = "00000000-0000-0000-0000-000000000000";
const SOBREPOSICAO_MS = 120_000;

type Cursor = { ts: string; id: string };

async function lerCursor(db: BancoLocal, tabela: string): Promise<Cursor | null> {
  const m = await db.meta.get(`cursor:${tabela}`);
  return typeof m?.valor === "string" ? (JSON.parse(m.valor) as Cursor) : null;
}
const gravarCursor = (db: BancoLocal, tabela: string, c: Cursor) => db.meta.put({ chave: `cursor:${tabela}`, valor: JSON.stringify(c) });

async function pendentes(db: BancoLocal, tabela: string) {
  const f = await db.fila.where("chave").startsWith(`${tabela}:`).toArray();
  return new Set(f.map((x) => x.id));
}

const SELECT: Record<TabelaRaiz, string> = {
  treinos: "*, treino_exercicios(*), treino_estacoes(*)",
  sessoes: "*, sessao_exercicios(*, series(*)), sessao_tempos(*)",
  noites: "*",
  medidas: "*",
  deloads: "*",
  calibracoes: "*",
  exercicios_proprios: "*",
};
const LOTE: Record<TabelaRaiz, number> = { treinos: 200, sessoes: 100, noites: 500, medidas: 500, deloads: 500, calibracoes: 500, exercicios_proprios: 500 };

async function puxar(db: BancoLocal, supa: Supa) {
  await puxarRemocoes(db, supa);
  await puxarUnicos(db, supa);
  for (const t of ["exercicios_proprios", "treinos", "sessoes", "noites", "medidas", "deloads", "calibracoes"] as TabelaRaiz[]) {
    await puxarTabela(db, supa, t);
  }
  await puxarSemana(db, supa);
  // Treino em andamento que já foi salvo em outro aparelho sai daqui também.
  const r = await db.unicos.get("rascunho");
  if (r?.chave === "rascunho" && (await db.sessoes.get(r.valor.sessao_id))) await db.unicos.delete("rascunho");
}

async function puxarTabela(db: BancoLocal, supa: Supa, tabela: TabelaRaiz) {
  const cursor = await lerCursor(db, tabela);
  let ts = cursor ? new Date(Date.parse(cursor.ts) - SOBREPOSICAO_MS).toISOString() : "1970-01-01T00:00:00Z";
  let id = NADA;
  let maior = cursor;
  for (;;) {
    const r = await supa
      .from(tabela)
      .select(SELECT[tabela])
      .or(`atualizado_em.gt.${ts},and(atualizado_em.eq.${ts},id.gt.${id})`)
      .order("atualizado_em", { ascending: true })
      .order("id", { ascending: true })
      .limit(LOTE[tabela]);
    if (r.error) throw r.error;
    const linhas = (r.data ?? []) as unknown as Record<string, unknown>[];
    if (!linhas.length) break;
    await aplicar(db, tabela, linhas);
    const ultima = linhas[linhas.length - 1] as { atualizado_em: string; id: string };
    ts = ultima.atualizado_em;
    id = ultima.id;
    if (!maior || ts > maior.ts || (ts === maior.ts && id > maior.id)) maior = { ts, id };
    if (linhas.length < LOTE[tabela]) break;
  }
  if (maior) await gravarCursor(db, tabela, maior);
}

async function aplicar(db: BancoLocal, tabela: TabelaRaiz, linhas: Record<string, unknown>[]) {
  const pend = await pendentes(db, tabela);
  const tab = db.table(tabela);
  await db.transaction("rw", tab, async () => {
    for (const l of linhas) {
      const id = l.id as string;
      if (pend.has(id)) continue;
      const reg = paraLocal(tabela, l);
      // Chaves naturais: uma noite por data, um deload por início. A versão da nuvem fica.
      if (tabela === "noites" || tabela === "deloads") {
        const campo = tabela === "noites" ? "data" : "inicio";
        const valor = l[campo] as string;
        const iguais = await tab.where(campo).equals(valor).toArray();
        for (const x of iguais as { id: string }[]) if (x.id !== id && !pend.has(x.id)) await tab.delete(x.id);
      }
      await tab.put(reg);
    }
  });
}

type Linha = Record<string, unknown>;
const porPosicao = (a: Linha, b: Linha) => (a.posicao as number) - (b.posicao as number);
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function paraLocal(tabela: TabelaRaiz, l: Linha): unknown {
  const { user_id: _u, ...r } = l;
  if (tabela === "treinos") {
    const ex = ((r.treino_exercicios as Linha[]) ?? []).sort(porPosicao);
    const est = ((r.treino_estacoes as Linha[]) ?? []).sort(porPosicao);
    const { treino_exercicios: _e, treino_estacoes: _s, ...t } = r;
    return {
      ...t,
      exercicios: ex.map((e) => ({ ex_chave: e.ex_chave, series: e.series, reps: e.reps, descanso_s: e.descanso_s, obs: e.obs, cat: e.cat })),
      estacoes: est.map((e) => ({ nome: e.nome, alvo: e.alvo, substituto: e.substituto })),
    } as Treino;
  }
  if (tabela === "sessoes") {
    const ex = ((r.sessao_exercicios as Linha[]) ?? []).sort(porPosicao);
    const tempos = ((r.sessao_tempos as Linha[]) ?? []).sort(
      (a, b) => (a.volta as number) - (b.volta as number) || (a.estacao_pos as number) - (b.estacao_pos as number),
    );
    const { sessao_exercicios: _e, sessao_tempos: _t, ...s } = r;
    return {
      ...s,
      exercicios: ex.map((e) => ({
        ex_chave: e.ex_chave,
        cat: e.cat,
        alvo: e.alvo,
        sugestao: e.sugestao,
        sugestao_aceita: e.sugestao_aceita,
        series: ((e.series as Linha[]) ?? []).sort(porPosicao).map((x) => ({ kg: Number(x.kg), reps: x.reps, rir: x.rir })),
      })),
      tempos: tempos.map((t) => ({ volta: t.volta, estacao_pos: t.estacao_pos, nome: t.nome, seg: t.seg })),
    } as Sessao;
  }
  if (tabela === "noites") return { ...r, horas: Number(r.horas) } as Noite;
  if (tabela === "medidas")
    return { ...r, peso_kg: num(r.peso_kg), cintura_cm: num(r.cintura_cm), ombro_cm: num(r.ombro_cm), gordura_pct: num(r.gordura_pct) } as Medida;
  if (tabela === "calibracoes") return { ...r, limiar_h: Number(r.limiar_h), queda_pct: Number(r.queda_pct) } as Calibracao;
  if (tabela === "deloads") return r as Deload;
  return r as ExercicioProprio;
}

/** Tabelas do celular que uma remoção vinda da nuvem pode apagar. Outro nome é ignorado. */
const TABELAS_REMOVIVEIS = ["treinos", "sessoes", "noites", "medidas", "deloads", "calibracoes", "exercicios_proprios"] as const;

async function puxarRemocoes(db: BancoLocal, supa: Supa) {
  const m = await db.meta.get("cursor:remocoes");
  let desde = typeof m?.valor === "number" ? m.valor : 0;
  for (;;) {
    const r = await supa.from("remocoes").select("id, tabela, registro_id").gt("id", desde).order("id").limit(1000);
    if (r.error) throw r.error;
    const linhas = r.data ?? [];
    if (!linhas.length) break;
    const pend = await db.fila.toCollection().primaryKeys();
    const pendSet = new Set(pend);
    const tabelas = new Set<string>(TABELAS_REMOVIVEIS);
    for (const l of linhas) {
      if (!tabelas.has(l.tabela) || pendSet.has(`${l.tabela}:${l.registro_id}`)) continue;
      await db.table(l.tabela).delete(l.registro_id);
    }
    desde = linhas[linhas.length - 1]!.id;
    await db.meta.put({ chave: "cursor:remocoes", valor: desde });
    if (linhas.length < 1000) break;
  }
}

async function puxarUnicos(db: BancoLocal, supa: Supa) {
  const pend = new Set(await db.fila.toCollection().primaryKeys());
  const [perfil, config, rascunho] = await Promise.all([
    supa.from("perfis").select("nome, altura_cm, modelo, onboarding_concluido, atualizado_em").maybeSingle(),
    supa.from("configuracoes").select("regras, som_descanso, deload_dispensado_ate, calibracao_dispensada_ate, atualizado_em").maybeSingle(),
    supa.from("sessao_rascunho").select("dados, atualizado_em").maybeSingle(),
  ]);
  if (perfil.error) throw perfil.error;
  if (config.error) throw config.error;
  if (rascunho.error) throw rascunho.error;
  if (perfil.data && !pend.has("perfis:eu")) {
    await db.unicos.put({ chave: "perfil", valor: { ...perfil.data, altura_cm: num(perfil.data.altura_cm) } });
  }
  if (config.data && !pend.has("configuracoes:eu")) {
    await db.unicos.put({ chave: "configuracoes", valor: { ...config.data, regras: (config.data.regras ?? {}) as Record<string, number> } });
  }
  // Treino em andamento em outro aparelho: só entra se este celular não tem um e a sessão ainda não foi salva.
  if (rascunho.data && !pend.has("sessao_rascunho:eu")) {
    const local = await db.unicos.get("rascunho");
    const dados = rascunho.data.dados as unknown as SessaoAtiva;
    if (!local && dados?.sessao_id && !(await db.sessoes.get(dados.sessao_id))) {
      await db.unicos.put({ chave: "rascunho", valor: dados });
    }
  }
}

async function puxarSemana(db: BancoLocal, supa: Supa) {
  const r = await supa.from("semana").select("dia, treino_id, atualizado_em");
  if (r.error) throw r.error;
  const pend = await pendentes(db, "semana");
  for (const d of r.data ?? []) if (!pend.has(String(d.dia))) await db.semana.put(d);
}

/** Usado na tela de conta: quantos registros ainda não subiram. */
export async function contarPendentes() {
  return banco().fila.count();
}

export async function tentarDeNovoFalhas() {
  await banco().fila.toCollection().modify((f) => {
    f.tentativas = 0;
    delete f.erro;
  });
  agendarSincronia(0);
}
