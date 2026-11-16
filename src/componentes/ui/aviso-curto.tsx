"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Icone } from "./icone";

type Ctx = (mensagem: string) => void;
const Contexto = createContext<Ctx>(() => {});

/** Confirmação curta no pé da tela (fundo claro no escuro e vice-versa), lida pelo leitor de tela. */
export function ProvedorAvisoCurto({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mostrar = useCallback((m: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg(m);
    timer.current = setTimeout(() => setMsg(null), 2800);
  }, []);
  return (
    <Contexto.Provider value={mostrar}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-5 pb-[calc(env(safe-area-inset-bottom)+88px)]">
        {msg && (
          <p className="t-rotulo flex max-w-[440px] items-center gap-2 rounded-ctl bg-tx px-4 py-3 font-semibold text-bg" style={{ animation: "surgir var(--dur-troca) ease-out" }}>
            <Icone nome="check" tamanho={18} />
            {msg}
          </p>
        )}
      </div>
    </Contexto.Provider>
  );
}

export const useAvisoCurto = () => useContext(Contexto);
