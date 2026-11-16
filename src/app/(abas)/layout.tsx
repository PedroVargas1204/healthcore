"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Abas } from "@/componentes/estrutura";
import { Abertura } from "@/componentes/provedores";
import { Aviso } from "@/componentes/ui/pecas";
import { useEstadoSync, usePerfil, useTemPerfil } from "@/lib/dados/hooks";
import { agendarSincronia } from "@/lib/dados/sync";

export default function LayoutAbas({ children }: LayoutProps<"/">) {
  const router = useRouter();
  const temPerfil = useTemPerfil();
  const perfil = usePerfil();
  const sync = useEstadoSync();

  useEffect(() => {
    if (temPerfil && perfil && !perfil.onboarding_concluido) router.replace("/boas-vindas/");
  }, [temPerfil, perfil, router]);

  if (temPerfil === undefined) return <Abertura />;
  if (!temPerfil) {
    // Primeira vez neste celular: os dados ainda não desceram da nuvem.
    if (sync.fase === "offline" || sync.fase === "erro")
      return (
        <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-4 px-5">
          <h1 className="t-tela">Sem conexão</h1>
          <Aviso tipo="offline" acao={{ rotulo: "Tentar de novo", aoTocar: () => agendarSincronia(0) }}>
            Para abrir pela primeira vez neste celular, o app precisa baixar seus treinos. Depois, ele funciona sem internet.
          </Aviso>
        </main>
      );
    return <Abertura />;
  }
  if (!perfil?.onboarding_concluido) return <Abertura />;
  return (
    <>
      {children}
      <Abas />
    </>
  );
}
