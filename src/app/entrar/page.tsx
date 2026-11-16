"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Corpo } from "@/componentes/mapa-corpo";
import { Marca } from "@/componentes/estrutura";
import { Aviso } from "@/componentes/ui/pecas";
import { entrarComGoogle, useConta } from "@/lib/dados/conta";
import type { Regiao } from "@/lib/dominio/volume";

const ACESO: Regiao[] = ["delt_lat", "dorsal"];
const MEDIO: Regiao[] = ["quad", "gluteo", "peit", "peit_sup", "trap_med", "romboides", "posterior", "biceps", "triceps", "abdomen"];

function LogoGoogle() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function Entrar() {
  const conta = useConta();
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const atualizar = () => setOnline(navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  const erroDaVolta = conta.estado === "fora" ? conta.erro : undefined;

  async function entrar() {
    setErro(null);
    setAbrindo(true);
    try {
      await entrarComGoogle();
    } catch {
      setAbrindo(false);
      setErro("Confira a internet e tente de novo.");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-6 px-6 pt-seguro pb-seguro">
      <div className="pt-6">
        <Marca />
      </div>
      <Corpo
        largura={92}
        base="var(--mapa-base)"
        cor={(r) => (ACESO.includes(r) ? "var(--mapa-4)" : MEDIO.includes(r) ? "var(--mapa-3)" : "var(--mapa-1)")}
      />
      <div className="flex flex-col gap-3">
        <h1 className="t-tela" style={{ fontSize: "min(2.5rem, 52px)" }}>
          Treino, carga e sono num lugar só
        </h1>
        <p className="t-corpo text-tx2">
          O app sugere a carga de cada série pelo que você fez da última vez e por como dormiu. Funciona sem internet no meio do treino.
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        {!online && (
          <Aviso tipo="offline">Para entrar pela primeira vez, o celular precisa de internet. Depois, o treino funciona sem.</Aviso>
        )}
        {(erro || erroDaVolta) && (
          <Aviso tipo="erro" titulo="Não deu para entrar com o Google.">
            {erro ?? "Tente de novo."}
          </Aviso>
        )}
        <button
          type="button"
          onClick={entrar}
          disabled={abrindo || !online}
          aria-busy={abrindo || undefined}
          className="toque t-destaque flex min-h-14 items-center justify-center gap-3 rounded-ctl bg-white px-5 text-[#1f1f1f] disabled:opacity-60"
        >
          {abrindo ? (
            <span aria-hidden="true" className="size-5 rounded-full border-[3px] border-[#1f1f1f] border-r-transparent" style={{ animation: "giro 0.8s linear infinite" }} />
          ) : (
            <LogoGoogle />
          )}
          {abrindo ? "Abrindo o Google" : "Continuar com Google"}
        </button>
        <p className="t-legenda text-center text-mut">
          Seus dados ficam na sua conta e só você vê.{" "}
          <Link href="/privacidade/" className="inline-block min-h-6 font-semibold text-ac-tx underline">
            Privacidade
          </Link>
        </p>
      </div>
    </main>
  );
}
