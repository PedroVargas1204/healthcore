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

/**
 * Guarda o app no celular e cuida das atualizações. Uma versão nova baixa sozinha e fica esperando; ela só entra
 * quando o app acaba de abrir ou quando vai para segundo plano, e aí a página recarrega escondida. Assim nunca
 * recarrega no meio de um treino ou de um formulário.
 */
function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    const abriuEm = Date.now();
    let reg: ServiceWorkerRegistration | undefined;
    let recarregar = false;
    // Logo depois de abrir não há nada digitado; fora isso, espera o app sair da tela.
    const momentoSeguro = () => document.visibilityState === "hidden" || Date.now() - abriuEm < 5000;
    const ativar = () => {
      if (!reg?.waiting || !sw.controller || !momentoSeguro()) return;
      recarregar = true;
      reg.waiting.postMessage("atualizar");
    };
    const trocou = () => {
      if (recarregar) window.location.reload();
    };
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "hidden") ativar();
      else void reg?.update().catch(() => {});
    };
    sw.addEventListener("controllerchange", trocou);
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    sw.register("/sw.js", { scope: "/" })
      .then((r) => {
        reg = r;
        ativar();
        r.addEventListener("updatefound", () => {
          const novo = r.installing;
          novo?.addEventListener("statechange", () => novo.state === "installed" && ativar());
        });
      })
      .catch(() => {});
    return () => {
      sw.removeEventListener("controllerchange", trocou);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
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
