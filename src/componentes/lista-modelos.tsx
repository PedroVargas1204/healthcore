"use client";

import { useState } from "react";
import { Botao } from "./ui/botao";
import { Cartao, Confirmar } from "./ui/pecas";
import { TODOS_MODELOS } from "@/lib/dominio/modelos";
import { PLANO_EVIDENCIA } from "@/lib/dominio/catalogo";
import { DIAS_LETRA } from "@/lib/util/datas";
import type { Modelo } from "@/lib/dominio/tipos";
import { cn } from "@/lib/util/cn";

function Semana({ m }: { m: Modelo }) {
  const nome = (id: string | null) => m.treinos.find((t) => t.id === id)?.id ?? "";
  return (
    <div className="grid grid-cols-7 gap-1" aria-label="Dias de treino">
      {m.semana.map((id, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span className="t-legenda text-mut">{DIAS_LETRA[i]}</span>
          <span className={cn("t-legenda flex h-8 w-full items-center justify-center rounded-[6px] font-semibold", id ? "bg-s2 text-tx" : "text-dim")}>
            {id ? nome(id) : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Biblioteca de planos prontos. Usar um plano cria os treinos e troca a semana; os treinos de antes ficam guardados. */
export function ListaModelos({ aoUsar, temTreinos, emUso }: { aoUsar: (m: Modelo) => Promise<void>; temTreinos: boolean; emUso?: string | null }) {
  const [confirmar, setConfirmar] = useState<Modelo | null>(null);
  const [usando, setUsando] = useState<string | null>(null);
  const usar = async (m: Modelo) => {
    setUsando(m.id);
    try {
      await aoUsar(m);
    } finally {
      setUsando(null);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      {TODOS_MODELOS.map((m) => (
        <Cartao key={m.id} className={cn(m.id === PLANO_EVIDENCIA.id && "outline-2 outline-ac")}>
          {m.id === PLANO_EVIDENCIA.id && <span className="t-legenda font-semibold text-ac-tx">Aprovado por você · recomendado</span>}
          <h2 className="t-h2">{m.nome}</h2>
          <p className="t-rotulo text-tx2">{m.frase}</p>
          <p className="t-legenda text-mut">
            {m.treinos.filter((t) => !t.finalizadorDe).length} treinos · {m.intensidade} · {m.duracao}
          </p>
          <Semana m={m} />
          <Botao
            tipo={m.id === PLANO_EVIDENCIA.id ? "principal" : "secundario"}
            disabled={!!emUso && (emUso === m.id || emUso.startsWith(`${m.id}:`))}
            carregando={usando === m.id}
            textoCarregando="Montando"
            onClick={() => (temTreinos ? setConfirmar(m) : usar(m))}
          >
            {emUso && (emUso === m.id || emUso.startsWith(`${m.id}:`)) ? "Em uso" : "Usar este plano"}
          </Botao>
        </Cartao>
      ))}
      <Confirmar
        aberta={!!confirmar}
        aoMudar={(v) => !v && setConfirmar(null)}
        titulo={`Usar ${confirmar?.nome ?? ""}?`}
        texto="Os treinos do plano entram na sua semana. Os treinos que você tem hoje ficam guardados na aba Treinos."
        sim="Usar"
        aoConfirmar={() => confirmar && usar(confirmar)}
      />
    </div>
  );
}
