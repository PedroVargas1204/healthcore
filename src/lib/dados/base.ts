"use client";

import { useMemo } from "react";
import {
  useCalibracoes,
  useConfig,
  useDeloads,
  useMedidas,
  useNoites,
  usePerfil,
  useProprios,
  useRascunho,
  useSemana,
  useSessoes,
  useTreinos,
} from "./hooks";
import { regrasCompletas } from "../dominio/recomendacao";

/** Tudo o que as telas principais leem, já carregado. `null` enquanto o banco do celular abre. */
export function useBase() {
  const treinos = useTreinos();
  const sessoes = useSessoes();
  const noites = useNoites();
  const medidas = useMedidas();
  const deloads = useDeloads();
  const calibracoes = useCalibracoes();
  const proprios = useProprios();
  const semana = useSemana();
  const perfil = usePerfil();
  const config = useConfig();
  const rascunho = useRascunho();
  return useMemo(() => {
    if (!treinos || !sessoes || !noites || !medidas || !deloads || !calibracoes || !proprios || !semana || !perfil || !config || rascunho === undefined)
      return null;
    const treinoPorId = new Map(treinos.map((t) => [t.id, t]));
    return {
      treinos,
      treinoPorId,
      sessoes,
      noites,
      medidas,
      deloads,
      calibracoes,
      proprios,
      semana,
      perfil,
      config,
      regras: regrasCompletas(config),
      rascunho,
    };
  }, [treinos, sessoes, noites, medidas, deloads, calibracoes, proprios, semana, perfil, config, rascunho]);
}

export type Base = NonNullable<ReturnType<typeof useBase>>;
