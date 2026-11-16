"use client";

import { useState } from "react";
import { Campo, Folha } from "./ui/pecas";
import { novoId, salvarRegistro } from "@/lib/dados/repo";
import type { Medida } from "@/lib/dominio/tipos";
import { hojeK } from "@/lib/util/datas";
import { fmtKg, lerNumero } from "@/lib/util/formato";

const FAIXAS = {
  peso_kg: [30, 250, "Peso de 30 a 250 kg."],
  cintura_cm: [45, 200, "Cintura de 45 a 200 cm."],
  ombro_cm: [60, 200, "Ombro de 60 a 200 cm."],
  gordura_pct: [3, 60, "Gordura de 3% a 60%."],
} as const;

export function FolhaMedida({ aberta, aoMudar, aoSalvar }: { aberta: boolean; aoMudar: (v: boolean) => void; aoSalvar?: () => void }) {
  const [data, setData] = useState(hojeK());
  const [v, setV] = useState<Record<keyof typeof FAIXAS, string>>({ peso_kg: "", cintura_cm: "", ombro_cm: "", gordura_pct: "" });
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    const m: Medida = { id: novoId(), data, peso_kg: null, cintura_cm: null, ombro_cm: null, gordura_pct: null };
    for (const k of Object.keys(FAIXAS) as (keyof typeof FAIXAS)[]) {
      if (!v[k].trim()) continue;
      const n = lerNumero(v[k]);
      const [min, max, msg] = FAIXAS[k];
      if (!Number.isFinite(n) || n < min || n > max) {
        setErro(msg);
        return;
      }
      m[k] = Math.round(n * 10) / 10;
    }
    if (m.peso_kg === null && m.cintura_cm === null && m.ombro_cm === null && m.gordura_pct === null) {
      setErro("Preencha ao menos uma medida.");
      return;
    }
    await salvarRegistro("medidas", m);
    aoMudar(false);
    aoSalvar?.();
  }

  const campo = (k: keyof typeof FAIXAS, rotulo: string, unidade: string) => (
    <Campo rotulo={rotulo} unidade={unidade} inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} placeholder={k === "peso_kg" ? fmtKg(75) : ""} />
  );

  return (
    <Folha aberta={aberta} aoMudar={aoMudar} titulo="Nova medida" acao={{ rotulo: "Salvar", aoTocar: salvar }}>
      <label className="flex flex-col gap-2">
        <span className="t-destaque">Data</span>
        <input type="date" value={data} max={hojeK()} onChange={(e) => e.target.value && setData(e.target.value)} className="t-corpo min-h-12 rounded-ctl bg-s2 px-4" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        {campo("peso_kg", "Peso", "kg")}
        {campo("cintura_cm", "Cintura", "cm")}
        {campo("ombro_cm", "Ombro", "cm")}
        {campo("gordura_pct", "Gordura", "%")}
      </div>
      <p className="t-legenda text-mut">Cintura na altura do umbigo, ombro na parte mais larga, sempre no mesmo horário. Só um valor já basta.</p>
      {erro && (
        <p role="alert" className="t-rotulo text-bad-tx">
          {erro}
        </p>
      )}
    </Folha>
  );
}
