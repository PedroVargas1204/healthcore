"use client";

import { Icone } from "@/componentes/ui/icone";
import { mmss } from "@/lib/util/formato";
import { cn } from "@/lib/util/cn";

/** Descanso em tela cheia. Nos últimos 10 s a tela acende em laranja. */
export function TelaDescanso({
  restante,
  total,
  seguir,
  som,
  aoTrocarSom,
  aoAjustar,
  aoPular,
}: {
  restante: number;
  total: number;
  seguir: { titulo: string; sub: string } | null;
  som: boolean;
  aoTrocarSom: () => void;
  aoAjustar: (s: number) => void;
  aoPular: () => void;
}) {
  const fim = restante <= 10;
  const frac = total > 0 ? Math.max(0, Math.min(1, restante / total)) : 0;
  const R = 116;
  const C = 2 * Math.PI * R;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Descanso"
      className={cn("fixed inset-0 z-50 flex flex-col", fim ? "bg-ac text-on-ac" : "bg-bg text-tx")}
      style={{ transition: "background-color var(--dur-alerta) ease-out" }}
    >
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-5 pt-seguro pb-seguro">
        <div className="flex min-h-11 items-center justify-between pt-3">
          <span className="t-destaque">{fim ? "Prepare-se" : "Descanso"}</span>
          <button
            type="button"
            onClick={aoTrocarSom}
            aria-pressed={som}
            className={cn("t-rotulo flex min-h-11 items-center gap-1.5 px-1", fim ? "text-on-ac" : "text-mut")}
          >
            <Icone nome={som ? "som" : "semSom"} tamanho={18} />
            {som ? "Som no fim" : "Sem som"}
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="relative flex items-center justify-center" style={{ width: 256, height: 256 }}>
            <svg width="256" height="256" viewBox="0 0 256 256" aria-hidden="true" className="absolute inset-0 -rotate-90">
              <circle cx="128" cy="128" r={R} fill="none" stroke={fim ? "rgba(17,18,20,.18)" : "var(--s2)"} strokeWidth="14" />
              <circle
                cx="128"
                cy="128"
                r={R}
                fill="none"
                stroke={fim ? "#111214" : "var(--ac)"}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - frac)}
                style={{ transition: "stroke-dashoffset 250ms linear" }}
              />
            </svg>
            <div className="flex flex-col items-center" role="timer" aria-live="off">
              <span className="font-disp tab-num text-[5.5rem] leading-none font-extrabold">{mmss(restante)}</span>
              <span className={cn("t-rotulo", fim ? "text-on-ac" : "text-mut")}>de {mmss(total)}</span>
            </div>
          </div>
          {seguir && (
            <div className="flex flex-col items-center gap-1 text-center">
              <span className={cn("t-rotulo", fim ? "text-on-ac" : "text-mut")}>A seguir</span>
              <span className="t-h1 font-extrabold uppercase">{seguir.titulo}</span>
              <span className="t-rotulo">{seguir.sub}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => aoAjustar(-15)}
            aria-label="Menos 15 segundos"
            className={cn("toque t-destaque min-h-14 rounded-ctl", fim ? "border-2 border-ink" : "bg-s2")}
          >
            −15 s
          </button>
          <button
            type="button"
            onClick={() => aoAjustar(15)}
            aria-label="Mais 15 segundos"
            className={cn("toque t-destaque min-h-14 rounded-ctl", fim ? "border-2 border-ink" : "bg-s2")}
          >
            +15 s
          </button>
          <button
            type="button"
            onClick={aoPular}
            className={cn("toque t-botao min-h-14 rounded-ctl", fim ? "bg-ink text-white" : "bg-ac text-on-ac")}
          >
            Pular
          </button>
        </div>
        <p className={cn("t-legenda pt-3 text-center", fim ? "text-on-ac" : "text-mut")}>A tela fica acesa durante o treino.</p>
      </div>
    </div>
  );
}
