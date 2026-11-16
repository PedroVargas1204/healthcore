"use client";

// Leituras reativas do banco do celular: a tela se atualiza sozinha quando algo muda.

import { useLiveQuery } from "dexie-react-hooks";
import { useSyncExternalStore } from "react";
import { banco, CONFIG_VAZIA, PERFIL_VAZIO } from "./local";
import { lerEstadoSync, ouvirSync } from "./sync";
import type { Configuracoes, Perfil, Sessao, SessaoAtiva, Treino } from "../dominio/tipos";

const ordenarSessoes = (a: Sessao, b: Sessao) => b.data.localeCompare(a.data) || (b.inicio ?? "").localeCompare(a.inicio ?? "");

export const useTreinos = () => useLiveQuery(() => banco().treinos.orderBy("posicao").toArray(), []);

export const useTreino = (id: string | null | undefined) =>
  useLiveQuery(async () => (id ? ((await banco().treinos.get(id)) ?? null) : null), [id]);

/** Sessões da mais recente para a mais antiga. */
export const useSessoes = () => useLiveQuery(async () => (await banco().sessoes.toArray()).sort(ordenarSessoes), []);

export const useSessao = (id: string | null | undefined) =>
  useLiveQuery(async () => (id ? ((await banco().sessoes.get(id)) ?? null) : null), [id]);

export const useNoites = () => useLiveQuery(() => banco().noites.orderBy("data").reverse().toArray(), []);
export const useMedidas = () => useLiveQuery(() => banco().medidas.orderBy("data").toArray(), []);
export const useDeloads = () => useLiveQuery(() => banco().deloads.orderBy("inicio").toArray(), []);
export const useCalibracoes = () => useLiveQuery(() => banco().calibracoes.orderBy("aplicada_em").toArray(), []);
export const useProprios = () => useLiveQuery(() => banco().exercicios_proprios.toArray(), []);

/** Os 7 dias da semana (segunda = 0) com o id do treino de cada um. */
export const useSemana = () =>
  useLiveQuery(async () => {
    const dias = await banco().semana.toArray();
    const s: (string | null)[] = [null, null, null, null, null, null, null];
    for (const d of dias) if (d.dia >= 0 && d.dia <= 6) s[d.dia] = d.treino_id;
    return s;
  }, []);

export const usePerfil = (): Perfil | undefined =>
  useLiveQuery(async () => {
    const u = await banco().unicos.get("perfil");
    return u?.chave === "perfil" ? u.valor : PERFIL_VAZIO;
  }, []);

export const useTemPerfil = () => useLiveQuery(async () => !!(await banco().unicos.get("perfil")), []);

export const useConfig = (): Configuracoes | undefined =>
  useLiveQuery(async () => {
    const u = await banco().unicos.get("configuracoes");
    return u?.chave === "configuracoes" ? u.valor : CONFIG_VAZIA;
  }, []);

export const useRascunho = (): SessaoAtiva | null | undefined =>
  useLiveQuery(async () => {
    const u = await banco().unicos.get("rascunho");
    return u?.chave === "rascunho" ? u.valor : null;
  }, []);

export const useEstadoSync = () => useSyncExternalStore(ouvirSync, lerEstadoSync, lerEstadoSync);

export type TreinosPorId = Map<string, Treino>;
