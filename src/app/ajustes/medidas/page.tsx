"use client";

import { useState } from "react";
import { PaginaCheia } from "@/componentes/estrutura";
import { FolhaMedida } from "@/componentes/folha-medida";
import { Botao, BotaoIcone } from "@/componentes/ui/botao";
import { Aviso } from "@/componentes/ui/pecas";
import { useAvisoCurto } from "@/componentes/ui/aviso-curto";
import { useMedidas } from "@/lib/dados/hooks";
import { apagarRegistro } from "@/lib/dados/repo";
import { dataCurta } from "@/lib/util/datas";
import { fmt } from "@/lib/util/formato";

export default function Medidas() {
  const medidas = useMedidas();
  const aviso = useAvisoCurto();
  const [nova, setNova] = useState(false);
  const lista = [...(medidas ?? [])].reverse();
  return (
    <PaginaCheia voltar={{ href: "/ajustes/", rotulo: "Ajustes" }} titulo="Medidas">
      <h1 className="t-tela">Medidas</h1>
      <Botao tipo="secundario" icone="mais" onClick={() => setNova(true)}>
        Nova medida
      </Botao>
      {lista.length === 0 ? (
        <Aviso tipo="info">Nenhuma medida ainda. Ombro e cintura juntos alimentam o painel do objetivo no Progresso.</Aviso>
      ) : (
        <ul className="flex flex-col rounded-card bg-s1">
          {lista.map((m) => {
            const p = [
              m.peso_kg !== null ? `${fmt(m.peso_kg)} kg` : null,
              m.cintura_cm !== null ? `cintura ${fmt(m.cintura_cm)} cm` : null,
              m.ombro_cm !== null ? `ombro ${fmt(m.ombro_cm)} cm` : null,
              m.gordura_pct !== null ? `${fmt(m.gordura_pct)}% de gordura` : null,
            ].filter(Boolean);
            return (
              <li key={m.id} className="flex min-h-16 items-center gap-3 border-b border-line px-4 py-2 last:border-0">
                <span className="flex flex-1 flex-col">
                  <span className="t-destaque">{dataCurta(m.data)}</span>
                  <span className="t-legenda tab-num text-mut">{p.join(", ")}</span>
                </span>
                <BotaoIcone
                  icone="lixo"
                  plano
                  rotulo={`Apagar medida de ${dataCurta(m.data)}`}
                  onClick={async () => {
                    await apagarRegistro("medidas", m.id);
                    aviso("Medida apagada.");
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
      {nova && <FolhaMedida aberta={nova} aoMudar={setNova} aoSalvar={() => aviso("Medida salva.")} />}
    </PaginaCheia>
  );
}
