"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PaginaCheia } from "@/componentes/estrutura";
import { Corpo } from "@/componentes/mapa-corpo";
import { Linha } from "@/componentes/graficos";
import { Abertura } from "@/componentes/provedores";
import { Segmentado } from "@/componentes/ui/pecas";
import { useBase } from "@/lib/dados/base";
import { exInfo } from "@/lib/dominio/exercicios";
import { e1rm } from "@/lib/dominio/recomendacao";
import { recordesAte } from "@/lib/dominio/recordes";
import { regioesDoMusculo, type Regiao } from "@/lib/dominio/volume";
import { dataCurta, deChave } from "@/lib/util/datas";
import { fmt, fmtKg, repsTxt, unidadeReps } from "@/lib/util/formato";

const RIR = ["0", "1", "2", "3", "4+"];

function Exercicio() {
  const router = useRouter();
  const id = useSearchParams().get("id") ?? "";
  const base = useBase();
  const [aba, setAba] = useState<"exec" | "erros" | "hist">("exec");
  if (!base) return <Abertura />;
  const e = exInfo(id, base.proprios);
  const prim = new Set<Regiao>(e.musc.flatMap(regioesDoMusculo));
  const sec = new Set<Regiao>(e.sec.flatMap(regioesDoMusculo).filter((r) => !prim.has(r)));
  const hist = base.sessoes
    .filter((s) => s.tipo === "forca")
    .map((s) => ({ s, ex: s.exercicios.find((x) => x.ex_chave === id) }))
    .filter((x): x is { s: (typeof x)["s"]; ex: NonNullable<(typeof x)["ex"]> } => !!x.ex && x.ex.series.length > 0);
  const recorde = recordesAte(base.sessoes)[id];
  const pts = [...hist]
    .reverse()
    .slice(-16)
    .map(({ s, ex }) => ({ x: deChave(s.data).getTime(), y: Math.max(...ex.series.map((x) => e1rm({ kg: Number(x.kg), reps: x.reps, rir: x.rir }))) }));

  return (
    <PaginaCheia voltar={{ aoTocar: () => router.back() }}>
      <div className="flex flex-col gap-1">
        <h1 className="t-tela">{e.nome}</h1>
        <p className="t-rotulo text-mut">
          {e.equip}, {e.tipo === "comp" ? "composto" : "isolado"}, {repsTxt(e.reps)}
          {unidadeReps(e.reps) === "reps" && /\d/.test(e.reps) ? " reps" : ""}
        </p>
      </div>
      <div className="flex items-center gap-4 rounded-card bg-s1 p-4">
        <Corpo largura={52} base="var(--mapa-base)" cor={(r) => (prim.has(r) ? "var(--mapa-4)" : sec.has(r) ? "var(--mapa-2)" : "var(--mapa-0)")} rotulo={`Principais: ${e.musc.join(", ")}. Auxiliares: ${e.sec.join(", ") || "nenhum"}.`} />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {e.musc.map((m) => (
              <span key={m} className="t-legenda rounded-full bg-ac-tint px-2.5 py-1 font-semibold text-ac-tx">
                {m}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {e.sec.map((m) => (
              <span key={m} className="t-legenda rounded-full bg-s2 px-2.5 py-1">
                {m}
              </span>
            ))}
          </div>
          <p className="t-legenda text-mut">Principal conta 1 série; auxiliar conta meia.</p>
        </div>
      </div>
      <Segmentado
        rotulo="Seção"
        valor={aba}
        aoMudar={setAba}
        opcoes={[
          { valor: "exec", rotulo: "Execução" },
          { valor: "erros", rotulo: "Erros comuns" },
          { valor: "hist", rotulo: "Seu histórico" },
        ]}
      />
      {aba === "exec" && (
        <div className="flex flex-col gap-3">
          {e.passos.length ? (
            <ol className="flex flex-col gap-3">
              {e.passos.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="t-rotulo flex size-7 shrink-0 items-center justify-center rounded-full bg-s2 font-bold">{i + 1}</span>
                  <span className="t-corpo">{p}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="t-corpo text-mut">Exercício criado por você.</p>
          )}
          {e.var && <p className="t-rotulo rounded-card bg-s1 p-4 text-tx2">Se doer: {e.var}.</p>}
        </div>
      )}
      {aba === "erros" && (
        <div className="flex flex-col gap-2">
          {e.erros.length ? (
            e.erros.map(([t, d]) => (
              <div key={t} className="flex flex-col gap-1 rounded-card bg-s1 p-4">
                <b className="t-destaque">{t}</b>
                <span className="t-rotulo text-tx2">{d}</span>
              </div>
            ))
          ) : (
            <p className="t-corpo text-mut">Sem erros cadastrados.</p>
          )}
        </div>
      )}
      {aba === "hist" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1 rounded-card bg-s1 p-4">
              <span className="t-legenda text-mut">Última vez</span>
              <span className="t-destaque tab-num">
                {hist[0] ? hist[0].ex.series.map((x) => `${x.kg ? `${fmtKg(Number(x.kg))}×` : ""}${x.reps}${x.rir !== null ? ` (${RIR[x.rir]})` : ""}`).join(", ") : "—"}
              </span>
              {hist[0] && <span className="t-legenda text-mut">{dataCurta(hist[0].s.data)}</span>}
            </div>
            <div className="flex flex-col gap-1 rounded-card bg-s1 p-4">
              <span className="t-legenda text-mut">Recorde</span>
              <span className="t-h2 tab-num">{recorde ? `${recorde.kg ? `${fmtKg(recorde.kg)} kg × ` : ""}${recorde.reps}` : "—"}</span>
              {recorde && <span className="t-legenda text-mut">{dataCurta(recorde.data)}</span>}
            </div>
          </div>
          {pts.length > 1 ? (
            <div className="flex flex-col gap-2 rounded-card bg-s1 p-4">
              <span className="t-destaque">1RM estimado com o RIR</span>
              <Linha pontos={pts} rotulosX={[]} casas={0} resumo={`1RM estimado de ${e.nome}: de ${fmt(pts[0]!.y)} para ${fmt(pts[pts.length - 1]!.y)} kg.`} />
            </div>
          ) : (
            <p className="t-corpo text-mut">{hist.length ? "O gráfico aparece a partir do segundo treino." : "Ainda sem registros deste exercício."}</p>
          )}
        </div>
      )}
    </PaginaCheia>
  );
}

export default function PaginaExercicio() {
  return (
    <Suspense>
      <Exercicio />
    </Suspense>
  );
}
