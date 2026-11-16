"use client";

import { useState } from "react";
import { Folha } from "./ui/pecas";
import { apagarRegistro, salvarRegistro, novoId } from "@/lib/dados/repo";
import type { Noite } from "@/lib/dominio/tipos";
import { lerNumero, fmt } from "@/lib/util/formato";
import { cn } from "@/lib/util/cn";
import { dataCurta, hojeK } from "@/lib/util/datas";

const HORAS = [5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5];

/** Lançar ou editar uma noite. A data é o dia em que você acordou. */
export function FolhaNoite({
  aberta,
  aoMudar,
  data,
  noite,
  aoSalvar,
  aoApagar,
}: {
  aberta: boolean;
  aoMudar: (v: boolean) => void;
  data: string;
  noite: Noite | undefined;
  aoSalvar?: () => void;
  aoApagar?: () => void;
}) {
  const [horas, setHoras] = useState<number | null>(noite?.horas ?? null);
  const [outro, setOutro] = useState(noite && !HORAS.includes(noite.horas) ? fmt(noite.horas, 2) : "");
  const [usandoOutro, setUsandoOutro] = useState(!!noite && !HORAS.includes(noite.horas));
  const [qualidade, setQualidade] = useState<number | null>(noite?.qualidade ?? null);
  const [score, setScore] = useState(noite?.score != null ? String(noite.score) : "");
  const [erro, setErro] = useState<string | null>(null);

  const titulo = data === hojeK() ? "Noite de ontem" : `Noite até ${dataCurta(data)}`;

  async function salvar() {
    const h = usandoOutro ? lerNumero(outro) : horas;
    if (h === null || !Number.isFinite(h) || h < 0 || h > 14) {
      setErro("Escolha as horas dormidas (de 0 a 14).");
      return;
    }
    const sc = score.trim() ? Math.round(lerNumero(score)) : null;
    if (sc !== null && (!Number.isFinite(sc) || sc < 0 || sc > 100)) {
      setErro("O score do relógio vai de 0 a 100.");
      return;
    }
    await salvarRegistro("noites", { id: noite?.id ?? novoId(), data, horas: Math.round(h * 100) / 100, qualidade, score: sc });
    aoMudar(false);
    aoSalvar?.();
  }

  return (
    <Folha aberta={aberta} aoMudar={aoMudar} titulo={titulo} acao={{ rotulo: "Salvar", aoTocar: salvar }}>
      <div className="flex flex-col gap-2">
        <span id="rot-horas" className="t-destaque">
          Horas dormidas
        </span>
        <div role="radiogroup" aria-labelledby="rot-horas" className="grid grid-cols-5 gap-2">
          {HORAS.map((h) => (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={!usandoOutro && horas === h}
              onClick={() => {
                setHoras(h);
                setUsandoOutro(false);
                setErro(null);
              }}
              className={cn("toque t-destaque tab-num min-h-12 rounded-ctl", !usandoOutro && horas === h ? "bg-ac text-on-ac" : "bg-s2")}
            >
              {fmt(h)}
            </button>
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={usandoOutro}
            onClick={() => setUsandoOutro(true)}
            className={cn("toque t-rotulo min-h-12 rounded-ctl font-semibold", usandoOutro ? "bg-ac text-on-ac" : "bg-s2")}
          >
            Outro
          </button>
        </div>
        {usandoOutro && (
          <label className="flex min-h-12 items-center gap-3 rounded-ctl bg-s2 px-4">
            <span className="sr-only">Horas dormidas</span>
            <input
              autoFocus
              inputMode="decimal"
              value={outro}
              onChange={(e) => setOutro(e.target.value)}
              placeholder="Ex.: 7,25"
              className="t-h2 tab-num min-w-0 flex-1 bg-transparent outline-none placeholder:text-mut"
            />
            <span className="t-rotulo text-mut">h</span>
          </label>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <span id="rot-q" className="t-destaque">
          Qualidade, de 1 a 5, ou o score do relógio
        </span>
        <div role="radiogroup" aria-labelledby="rot-q" className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              type="button"
              role="radio"
              aria-checked={qualidade === q}
              onClick={() => setQualidade(qualidade === q ? null : q)}
              className={cn("toque t-destaque min-h-12 rounded-ctl", qualidade === q ? "bg-ac text-on-ac" : "bg-s2")}
            >
              {q}
            </button>
          ))}
        </div>
        <label className="flex min-h-12 items-center gap-3 rounded-ctl bg-s2 px-4">
          <span className="t-rotulo flex-1 text-mut">Score do relógio</span>
          <input
            inputMode="numeric"
            value={score}
            onChange={(e) => setScore(e.target.value.replace(/\D/g, "").slice(0, 3))}
            placeholder="0 a 100"
            className="t-destaque tab-num w-24 bg-transparent text-right outline-none placeholder:text-mut"
          />
        </label>
      </div>
      {erro && (
        <p role="alert" className="t-rotulo text-bad-tx">
          {erro}
        </p>
      )}
      {noite && aoApagar && (
        <button
          type="button"
          onClick={async () => {
            await apagarRegistro("noites", noite.id);
            aoMudar(false);
            aoApagar();
          }}
          className="t-destaque min-h-12 self-start text-bad-tx"
        >
          Apagar esta noite
        </button>
      )}
    </Folha>
  );
}
