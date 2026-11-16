"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PaginaCheia } from "@/componentes/estrutura";
import { Abertura } from "@/componentes/provedores";
import { Botao } from "@/componentes/ui/botao";
import { Icone } from "@/componentes/ui/icone";
import { Confirmar } from "@/componentes/ui/pecas";
import { useAvisoCurto } from "@/componentes/ui/aviso-curto";
import { useBase } from "@/lib/dados/base";
import { apagarRegistro } from "@/lib/dados/repo";
import { exInfo } from "@/lib/dominio/exercicios";
import { recordesDaSessao } from "@/lib/dominio/recordes";
import { volumeKg } from "@/lib/dominio/resumo";
import { dataCurta } from "@/lib/util/datas";
import { fmt, fmtKg, minTxt, mmss } from "@/lib/util/formato";

const RIR = ["0", "1", "2", "3", "4+"];

function Detalhe() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const base = useBase();
  const aviso = useAvisoCurto();
  const [apagar, setApagar] = useState(false);
  if (!base) return <Abertura />;
  const s = base.sessoes.find((x) => x.id === id);
  if (!s)
    return (
      <PaginaCheia voltar={{ href: "/historico/" }}>
        <p className="t-corpo">Sessão não encontrada. Ela pode ter sido apagada em outro aparelho.</p>
      </PaginaCheia>
    );
  const nome = (k: string) => exInfo(k, base.proprios).nome;
  const recs = s.tipo === "forca" ? recordesDaSessao(s, base.sessoes) : [];
  const linhas: [string, string][] = [
    ["Duração", minTxt(s.duracao_min)],
    ["Kcal", s.kcal !== null ? fmt(s.kcal, 0) : "—"],
  ];
  if (s.tipo === "forca") {
    linhas.push(["Volume", `${fmt(volumeKg(s), 0)} kg`]);
    linhas.push(["Séries", String(s.exercicios.reduce((t, e) => t + e.series.length, 0))]);
  } else {
    linhas.push(["Tempo do circuito", s.tempo_total_s ? mmss(s.tempo_total_s) : "—"]);
    linhas.push(["RPE", s.rpe ? `${s.rpe} de 10` : "—"]);
  }
  linhas.push(["Energia", s.energia ? `${s.energia} de 5` : "—"]);
  linhas.push(["Dor muscular", s.dor_muscular ? `${s.dor_muscular} de 5` : "—"]);
  linhas.push([
    "Dor articular",
    s.dor_articular ? `Sim${s.dor_articular_onde ? `, ${s.dor_articular_onde}` : ""} (${s.dor_articular_ex.map(nome).join(", ")})` : "Não",
  ]);
  if (s.prontidao) linhas.push(["Prontidão", s.prontidao]);
  const voltas = new Map<number, typeof s.tempos>();
  for (const t of s.tempos) voltas.set(t.volta, [...(voltas.get(t.volta) ?? []), t]);

  return (
    <PaginaCheia
      voltar={{ href: "/historico/" }}
      acao={
        <Link href={`/historico/editar/?id=${s.id}`} className="t-destaque flex min-h-11 items-center px-1 text-ac-tx">
          Editar
        </Link>
      }
    >
      <div className="flex flex-col gap-1">
        <h1 className="t-tela">{s.nome}</h1>
        <p className="t-rotulo text-mut">
          {dataCurta(s.data)}
          {s.em_deload ? " · semana de deload" : ""}
        </p>
      </div>
      <dl className="flex flex-col rounded-card bg-s1 px-4">
        {linhas.map(([r, v]) => (
          <div key={r} className="flex min-h-12 items-center justify-between gap-3 border-b border-line py-2 last:border-0">
            <dt className="t-rotulo text-mut">{r}</dt>
            <dd className="t-rotulo tab-num text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      {recs.length > 0 && (
        <section className="flex flex-col gap-2 rounded-card bg-ac-tint p-4">
          <h2 className="t-h2 flex items-center gap-2 text-ac-tx">
            <Icone nome="trofeu" /> {recs.length === 1 ? "Recorde" : `${recs.length} recordes`}
          </h2>
          {recs.map((r) => (
            <p key={r.ex_chave} className="t-rotulo flex justify-between">
              <span>{nome(r.ex_chave)}</span>
              <b className="tab-num">
                {fmtKg(r.kg)} kg × {r.reps}
              </b>
            </p>
          ))}
        </section>
      )}
      {s.exercicios.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="t-h1">Exercícios</h2>
          {s.exercicios.map((e, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-card bg-s1 p-4">
              <b className="t-destaque">{nome(e.ex_chave)}</b>
              <span className="t-rotulo tab-num">
                {e.series.map((x) => `${x.kg ? `${fmtKg(x.kg)}×` : ""}${x.reps}${x.rir !== null ? ` (RIR ${RIR[x.rir]})` : ""}`).join(", ")}
              </span>
              {e.sugestao && (e.sugestao.kg || e.sugestao.reps) && (
                <span className="t-legenda text-mut">
                  Sugerido: {e.sugestao.kg ? `${fmtKg(e.sugestao.kg)} kg × ` : ""}
                  {e.sugestao.reps}
                  {e.sugestao_aceita === true ? " (seguido)" : e.sugestao_aceita === false ? " (mudado)" : ""}
                </span>
              )}
            </div>
          ))}
        </section>
      )}
      {voltas.size > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="t-h1">Tempos</h2>
          {[...voltas.entries()].map(([v, ms]) => (
            <div key={v} className="flex flex-col gap-1 rounded-card bg-s1 p-4">
              <p className="t-destaque flex justify-between">
                <span>Volta {v + 1}</span>
                <span className="tab-num">{mmss(ms.reduce((t, m) => t + m.seg, 0))}</span>
              </p>
              {ms.map((m, i) => (
                <p key={i} className="t-rotulo flex justify-between text-mut">
                  <span>{m.nome}</span>
                  <span className="tab-num">{mmss(m.seg)}</span>
                </p>
              ))}
            </div>
          ))}
        </section>
      )}
      {s.obs && <p className="t-rotulo rounded-card bg-s1 p-4 text-tx2">{s.obs}</p>}
      <Botao tipo="perigo" className="mt-4" onClick={() => setApagar(true)}>
        Apagar sessão
      </Botao>
      <Confirmar
        aberta={apagar}
        aoMudar={setApagar}
        titulo="Apagar esta sessão?"
        texto="Ela sai do histórico, dos gráficos e da recomendação de carga, aqui e na nuvem."
        sim="Apagar"
        perigo
        aoConfirmar={async () => {
          await apagarRegistro("sessoes", s.id);
          aviso("Sessão apagada.");
          router.replace("/historico/");
        }}
      />
    </PaginaCheia>
  );
}

export default function PaginaDetalhe() {
  return (
    <Suspense>
      <Detalhe />
    </Suspense>
  );
}
