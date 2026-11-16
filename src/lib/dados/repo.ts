// Gravações: primeiro no celular, depois na fila de envio. Nada aqui espera a internet.

import { banco, CONFIG_VAZIA, PERFIL_VAZIO, type ItemFila, type TabelaRaiz, type TabelaSync } from "./local";
import { agendarSincronia } from "./sync";
import type {
  Calibracao,
  Configuracoes,
  Deload,
  ExercicioProprio,
  Medida,
  Noite,
  Perfil,
  Sessao,
  SessaoAtiva,
  Treino,
} from "../dominio/tipos";

export const novoId = () => crypto.randomUUID();

async function enfileirar(tabela: TabelaSync, id: string, op: ItemFila["op"]) {
  await banco().fila.put({ chave: `${tabela}:${id}`, tabela, id, op, em: Date.now(), tentativas: 0 });
}

type Registros = {
  treinos: Treino;
  sessoes: Sessao;
  noites: Noite;
  medidas: Medida;
  deloads: Deload;
  calibracoes: Calibracao;
  exercicios_proprios: ExercicioProprio;
};

export async function salvarRegistro<T extends TabelaRaiz>(tabela: T, registro: Registros[T]) {
  const db = banco();
  const t = db.table(tabela);
  await db.transaction("rw", t, db.fila, async () => {
    await t.put(registro);
    await enfileirar(tabela, registro.id, "salvar");
  });
  agendarSincronia();
}

export async function salvarVarios<T extends TabelaRaiz>(tabela: T, registros: Registros[T][]) {
  const db = banco();
  const t = db.table(tabela);
  await db.transaction("rw", t, db.fila, async () => {
    for (const r of registros) {
      await t.put(r);
      await enfileirar(tabela, r.id, "salvar");
    }
  });
  agendarSincronia();
}

export async function apagarRegistro(tabela: TabelaRaiz, id: string) {
  const db = banco();
  const t = db.table(tabela);
  await db.transaction("rw", [t, db.fila, db.semana, db.treinos, db.sessoes], async () => {
    await t.delete(id);
    await enfileirar(tabela, id, "apagar");
    // O banco faz o mesmo sozinho (on delete set null); aqui o celular acompanha na hora.
    if (tabela === "treinos") {
      await db.semana.where("dia").between(0, 6, true, true).modify((d) => {
        if (d.treino_id === id) d.treino_id = null;
      });
      await db.treinos.toCollection().modify((t2) => {
        if (t2.finalizador_id === id) t2.finalizador_id = null;
      });
      await db.sessoes.where("treino_id").equals(id).modify((s) => {
        s.treino_id = null;
      });
    }
  });
  agendarSincronia();
}

/** Troca o treino de um ou mais dias da semana (dia 0 = segunda). */
export async function salvarSemana(dias: { dia: number; treino_id: string | null }[]) {
  const db = banco();
  await db.transaction("rw", db.semana, db.fila, async () => {
    for (const d of dias) {
      await db.semana.put({ dia: d.dia, treino_id: d.treino_id });
      await enfileirar("semana", String(d.dia), "salvar");
    }
  });
  agendarSincronia();
}

export async function lerPerfil(): Promise<Perfil> {
  const u = await banco().unicos.get("perfil");
  return u?.chave === "perfil" ? u.valor : PERFIL_VAZIO;
}

export async function salvarPerfil(mudanca: Partial<Perfil>) {
  const db = banco();
  await db.transaction("rw", db.unicos, db.fila, async () => {
    const atual = await lerPerfil();
    await db.unicos.put({ chave: "perfil", valor: { ...atual, ...mudanca } });
    await enfileirar("perfis", "eu", "salvar");
  });
  agendarSincronia();
}

export async function lerConfig(): Promise<Configuracoes> {
  const u = await banco().unicos.get("configuracoes");
  return u?.chave === "configuracoes" ? u.valor : CONFIG_VAZIA;
}

export async function salvarConfig(mudanca: Partial<Configuracoes>) {
  const db = banco();
  await db.transaction("rw", db.unicos, db.fila, async () => {
    const atual = await lerConfig();
    await db.unicos.put({ chave: "configuracoes", valor: { ...atual, ...mudanca } });
    await enfileirar("configuracoes", "eu", "salvar");
  });
  agendarSincronia();
}

/* ---------- Treino em andamento ---------- */

export async function lerRascunho(): Promise<SessaoAtiva | null> {
  const u = await banco().unicos.get("rascunho");
  return u?.chave === "rascunho" ? u.valor : null;
}

let ultimoEnvioRascunho = 0;

/** Guarda o treino em andamento no celular a cada mudança; a cópia na nuvem sobe no máximo a cada 15 s. */
export async function salvarRascunho(a: SessaoAtiva, { forcarEnvio = false } = {}) {
  const db = banco();
  const enviar = forcarEnvio || Date.now() - ultimoEnvioRascunho > 15000;
  await db.transaction("rw", db.unicos, db.fila, async () => {
    await db.unicos.put({ chave: "rascunho", valor: a });
    if (enviar) await enfileirar("sessao_rascunho", "eu", "salvar");
  });
  if (enviar) {
    ultimoEnvioRascunho = Date.now();
    agendarSincronia();
  }
}

/** Descarta o treino em andamento (aqui e na nuvem). */
export async function descartarRascunho() {
  const db = banco();
  await db.transaction("rw", db.unicos, db.fila, async () => {
    await db.unicos.delete("rascunho");
    await enfileirar("sessao_rascunho", "eu", "apagar");
  });
  agendarSincronia();
}

/** Salva a sessão terminada e tira o rascunho. A função do banco apaga o rascunho da nuvem junto. */
export async function concluirSessao(s: Sessao) {
  const db = banco();
  await db.transaction("rw", db.sessoes, db.unicos, db.fila, async () => {
    await db.sessoes.put(s);
    await db.unicos.delete("rascunho");
    await db.fila.delete("sessao_rascunho:eu");
    await enfileirar("sessoes", s.id, "salvar");
  });
  agendarSincronia();
}
