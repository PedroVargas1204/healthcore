"use client";

import { useEffect, useState } from "react";
import { Icone } from "@/componentes/ui/icone";
import { fmtKg, lerNumero } from "@/lib/util/formato";

/** Carga ou reps com um dedo: botões de 60 px e o número no meio (dá para tocar no número e digitar). */
export function Stepper({
  valor,
  passo,
  rotulo,
  legenda,
  min = 0,
  max,
  decimal,
  aoMudar,
}: {
  valor: number | null;
  passo: number;
  rotulo: string;
  legenda: string;
  min?: number;
  max: number;
  decimal?: boolean;
  aoMudar: (v: number | null) => void;
}) {
  const [texto, setTexto] = useState(valor === null ? "" : fmtKg(valor));
  const [editando, setEditando] = useState(false);
  useEffect(() => {
    if (!editando) setTexto(valor === null ? "" : fmtKg(valor));
  }, [valor, editando]);

  const ajustar = (d: number) => {
    const base = valor ?? 0;
    const novo = Math.min(max, Math.max(min, Math.round((base + d) * 100) / 100));
    aoMudar(novo);
  };

  return (
    <div className="grid grid-cols-[60px_minmax(0,1fr)_60px] items-center gap-3">
      <button
        type="button"
        onClick={() => ajustar(-passo)}
        aria-label={`Menos ${fmtKg(passo)} em ${rotulo}`}
        className="toque flex size-[60px] items-center justify-center rounded-ctl bg-s2"
      >
        <Icone nome="menos" tamanho={26} />
      </button>
      <label className="flex flex-col items-center">
        <span className="sr-only">{rotulo}</span>
        <input
          inputMode={decimal ? "decimal" : "numeric"}
          value={texto}
          placeholder="—"
          onFocus={(e) => {
            setEditando(true);
            e.currentTarget.select();
          }}
          onChange={(e) => setTexto(e.target.value.replace(/[^\d.,]/g, ""))}
          onBlur={() => {
            setEditando(false);
            const n = lerNumero(texto);
            aoMudar(Number.isFinite(n) ? Math.min(max, Math.max(min, decimal ? Math.round(n * 100) / 100 : Math.round(n))) : null);
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="font-disp tab-num w-full bg-transparent text-center text-[3rem] leading-none font-extrabold outline-none placeholder:text-dim"
        />
        <span className="t-legenda text-mut">{legenda}</span>
      </label>
      <button
        type="button"
        onClick={() => ajustar(passo)}
        aria-label={`Mais ${fmtKg(passo)} em ${rotulo}`}
        className="toque flex size-[60px] items-center justify-center rounded-ctl bg-s2"
      >
        <Icone nome="mais" tamanho={26} />
      </button>
    </div>
  );
}
