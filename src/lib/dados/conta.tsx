"use client";

// Login com Google pela Supabase. A sessão fica guardada no celular, então o app abre sem internet.

import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { abrirBanco, fecharEApagarBanco } from "./local";
import { agendarSincronia, sincronizar } from "./sync";

export type Conta =
  | { estado: "carregando" }
  | { estado: "fora"; erro?: string }
  | { estado: "dentro"; uid: string; email: string; nome: string; foto: string | null };

const Contexto = createContext<Conta>({ estado: "carregando" });
export const useConta = () => useContext(Contexto);

function deSessao(s: Session | null): Conta {
  if (!s?.user) return { estado: "fora" };
  const m = (s.user.user_metadata ?? {}) as Record<string, string | undefined>;
  return {
    estado: "dentro",
    uid: s.user.id,
    email: s.user.email ?? "",
    nome: m.full_name ?? m.name ?? "",
    foto: m.avatar_url ?? m.picture ?? null,
  };
}

export function ProvedorConta({ children }: { children: React.ReactNode }) {
  const [conta, setConta] = useState<Conta>({ estado: "carregando" });

  useEffect(() => {
    const supa = supabase();
    let vivo = true;
    // Erro devolvido pelo Google ou pela Supabase na volta do login.
    const url = new URL(window.location.href);
    const erroUrl = url.searchParams.get("error_description") ?? url.hash.match(/error_description=([^&]+)/)?.[1];
    supa.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      const c = deSessao(data.session);
      if (c.estado === "dentro") abrirBanco(c.uid);
      setConta(c.estado === "fora" && erroUrl ? { estado: "fora", erro: decodeURIComponent(erroUrl.replace(/\+/g, " ")) } : c);
      if (c.estado === "dentro") void sincronizar();
    });
    const { data: ouvinte } = supa.auth.onAuthStateChange((evento, sessao) => {
      if (evento === "INITIAL_SESSION") return;
      const c = deSessao(sessao);
      if (c.estado === "dentro") abrirBanco(c.uid);
      setConta((antes) => (antes.estado === c.estado && antes.estado === "dentro" && c.estado === "dentro" && antes.uid === c.uid ? antes : c));
      if (evento === "SIGNED_IN" || evento === "TOKEN_REFRESHED") agendarSincronia(100);
    });
    const voltar = () => agendarSincronia(100);
    const visivel = () => document.visibilityState === "visible" && agendarSincronia(300);
    window.addEventListener("online", voltar);
    document.addEventListener("visibilitychange", visivel);
    const periodico = setInterval(() => agendarSincronia(0), 60_000);
    return () => {
      vivo = false;
      ouvinte.subscription.unsubscribe();
      window.removeEventListener("online", voltar);
      document.removeEventListener("visibilitychange", visivel);
      clearInterval(periodico);
    };
  }, []);

  return <Contexto.Provider value={conta}>{children}</Contexto.Provider>;
}

export async function entrarComGoogle() {
  const { error } = await supabase().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/`, queryParams: { prompt: "select_account" } },
  });
  if (error) throw error;
}

/** Sai da conta e apaga a cópia deste celular. Os dados continuam na nuvem. */
export async function sair(uid: string) {
  await supabase().auth.signOut({ scope: "local" });
  await fecharEApagarBanco(uid);
}

/** Apaga a conta e todos os dados, na nuvem e no celular. Precisa de internet. */
export async function apagarConta(uid: string) {
  const supa = supabase();
  const { error } = await supa.rpc("apagar_minha_conta");
  if (error) throw error;
  await supa.auth.signOut({ scope: "local" });
  await fecharEApagarBanco(uid);
}
