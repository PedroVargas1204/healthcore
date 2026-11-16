"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProvedorConta, useConta } from "@/lib/dados/conta";
import { ProvedorAvisoCurto } from "./ui/aviso-curto";
import { Marca } from "./estrutura";

const PUBLICAS = ["/entrar/", "/privacidade/"];

function Portao({ children }: { children: React.ReactNode }) {
  const conta = useConta();
  const caminho = usePathname();
  const router = useRouter();
  const publica = PUBLICAS.some((p) => caminho.startsWith(p.slice(0, -1)));

  useEffect(() => {
    if (conta.estado === "fora" && !publica) router.replace("/entrar/");
    if (conta.estado === "dentro" && caminho.startsWith("/entrar")) router.replace("/");
  }, [conta.estado, publica, caminho, router]);

  if (publica && conta.estado !== "dentro") return <>{children}</>;
  if (conta.estado !== "dentro") return <Abertura />;
  // A chave troca tudo quando a conta muda: nenhum dado de uma conta aparece na outra.
  return <div key={conta.uid}>{children}</div>;
}

export function Abertura({ texto = "Carregando seus treinos…" }: { texto?: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-3 px-5">
      <Marca className="text-[2.5rem]" />
      <p className="t-corpo text-mut" role="status">
        {texto}
      </p>
    </main>
  );
}

function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}

export function Provedores({ children }: { children: React.ReactNode }) {
  return (
    <ProvedorConta>
      <ProvedorAvisoCurto>
        <RegistrarServiceWorker />
        <Portao>{children}</Portao>
      </ProvedorAvisoCurto>
    </ProvedorConta>
  );
}
