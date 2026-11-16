"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Stepper } from "./stepper";
import { Botao } from "@/componentes/ui/botao";
import { Icone } from "@/componentes/ui/icone";
import { Folha } from "@/componentes/ui/pecas";
import { exInfo, passoCarga } from "@/lib/dominio/exercicios";
import { ehRecorde, type Recorde } from "@/lib/dominio/recordes";
import { concluirSerie, desfazerSerie, trocarEx, usarSugestao } from "@/lib/acoes/treino";
import type { ExercicioAtivo, ExercicioProprio, SessaoAtivaForca } from "@/lib/dominio/tipos";
import { fmtKg, mmss, repsTxt, unidadeReps } from "@/lib/util/formato";
import { cn } from "@/lib/util/cn";

const ROT_RIR = ["0", "1", "2", "3", "4+"];

const corSugestao = (tipo: string) =>
  tipo === "subir" || tipo === "primeira"
    ? "bg-ok-tint text-ok-tx"
    : tipo === "reduzir" || tipo === "deload"
      ? "bg-warn-tint text-warn-tx"
      : tipo === "dor"
        ? "bg-bad-tint text-bad-tx"
        : "bg-s1 text-tx";

function textoSugestao(ex: ExercicioAtivo) {
  const s = ex.sugestao;
  const reps = repsTxt(s.reps);
  const un = unidadeReps(ex.reps);
  return `${s.kg ? `${fmtKg(s.kg)} kg × ` : ""}${reps}${un === "reps" && /\d/.test(reps) && !s.kg ? " reps" : ""}${s.series !== ex.series_plan ? `, ${s.series} séries` : ""}`;
}

export function TreinoForca({
  a,
  proprios,
  regras,
  recordes,
  aoMudar,
  aoAviso,
  aoFechar,
  aoDescartar,
  lista,
  aoLista,
}: {
  a: SessaoAtivaForca;
  proprios: ExercicioProprio[];
  regras: Record<string, number>;
  recordes: Record<string, Recorde>;
  aoMudar: (a: SessaoAtivaForca) => void;
  aoAviso: (m: string) => void;
  aoFechar: () => void;
  aoDescartar: () => void;
  lista: boolean;
  aoLista: (v: boolean) => void;
}) {
  const setLista = aoLista;
  const [detalhe, setDetalhe] = useState(false);
  const idx = Math.min(a.idx, a.exercicios.length - 1);
  const ex = a.exercicios[idx]!;
  const info = exInfo(ex.ex_chave, proprios);
  const un = unidadeReps(ex.reps);
  const passo = passoCarga(info.equip, ex.cat, regras);
  const atual = ex.series.findIndex((s) => !s.feita);
  const feitas = ex.series.map((s, i) => ({ s, i })).filter((x) => x.s.feita);
  const totalSeries = a.exercicios.reduce((n, e) => n + e.series.length, 0);
  const totalFeitas = a.exercicios.reduce((n, e) => n + e.series.filter((s) => s.feita).length, 0);
  const proximo = a.exercicios.findIndex((e, i) => i > idx && e.series.some((s) => !s.feita));
  const anterior = recordes[ex.ex_chave];
  // Recorde ao vivo: a melhor série desta sessão que passou a marca antiga.
  const melhorDaSessao = useMemo(() => {
    let m: number | null = null;
    feitas.forEach(({ s, i }) => {
      const serie = { kg: s.kg ?? 0, reps: s.reps ?? 0, rir: s.rir };
      if (ehRecorde(serie, anterior) && (m === null || serie.kg > (ex.series[m]!.kg ?? 0) || (serie.kg === (ex.series[m]!.kg ?? 0) && serie.reps > (ex.series[m]!.reps ?? 0)))) m = i;
    });
    return m;
  }, [feitas, anterior, ex.series]);

  const mudarSerie = (si: number, campo: "kg" | "reps", v: number | null) => {
    const series = ex.series.map((s, i) => (i === si ? { ...s, [campo]: v } : s));
    // Mudou a carga da série atual: as próximas acompanham (como quem troca o halter).
    if (campo === "kg") for (let i = si + 1; i < series.length; i++) if (!series[i]!.feita) series[i] = { ...series[i]!, kg: v };
    aoMudar(trocarEx(a, idx, { ...ex, series }));
  };

  const concluir = (rir: number) => {
    if (atual < 0) return;
    const r = concluirSerie(a, idx, atual, rir, proprios);
    if (r.erro) return aoAviso(r.erro);
    const s = r.a.exercicios[idx]!.series[atual]!;
    const serie = { kg: s.kg ?? 0, reps: s.reps ?? 0, rir: s.rir };
    const antesMelhor = melhorDaSessao !== null ? ex.series[melhorDaSessao]! : null;
    if (ehRecorde(serie, anterior) && (!antesMelhor || serie.kg > (antesMelhor.kg ?? 0) || (serie.kg === (antesMelhor.kg ?? 0) && serie.reps > (antesMelhor.reps ?? 0))))
      aoAviso(`Recorde: ${fmtKg(serie.kg)} kg × ${serie.reps}`);
    aoMudar(r.a);
  };

  const mudarSeries = (delta: 1 | -1) => {
    if (delta === 1) {
      const u = ex.series[ex.series.length - 1];
      aoMudar(trocarEx(a, idx, { ...ex, series: [...ex.series, { kg: u?.kg ?? null, reps: u?.reps ?? null, rir: null, feita: false }] }));
    } else if (ex.series.length > 1 && !ex.series[ex.series.length - 1]!.feita) {
      aoMudar(trocarEx(a, idx, { ...ex, series: ex.series.slice(0, -1) }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* progresso por exercício */}
      <ol className="flex gap-1.5" aria-label={`Exercício ${idx + 1} de ${a.exercicios.length}, ${totalFeitas} de ${totalSeries} séries`}>
        {a.exercicios.map((e, i) => {
          const pronto = e.series.every((s) => s.feita);
          return (
            <li key={i} className="flex-1">
              <button
                type="button"
                onClick={() => aoMudar({ ...a, idx: i })}
                aria-label={`${exInfo(e.ex_chave, proprios).nome}${pronto ? ", feito" : ""}`}
                aria-current={i === idx ? "step" : undefined}
                className="flex h-6 w-full items-center"
              >
                <span className={cn("h-1.5 w-full rounded-full", i === idx || pronto ? "bg-ac" : "bg-s3", pronto && i !== idx && "opacity-60")} />
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-1">
        <span className="t-rotulo text-mut">
          Exercício {idx + 1} de {a.exercicios.length} · {ex.cat === "comp" ? "composto" : "isolado"}
        </span>
        <h1 className="font-disp text-[2.5rem] leading-[0.92] font-extrabold text-balance uppercase">{info.nome}</h1>
        <p className="t-rotulo text-tx2">
          {ex.series.length} séries de {repsTxt(ex.reps)}
          {un !== "reps" ? "" : /\d/.test(ex.reps) ? "" : ""}, descanso de {ex.descanso_s % 60 === 0 ? `${ex.descanso_s / 60} min` : mmss(ex.descanso_s)}
        </p>
        {ex.obs && <span className="t-legenda self-start rounded-full bg-ac-tint px-3 py-1 font-semibold text-ac-tx">{ex.obs}</span>}
      </div>

      <button type="button" onClick={() => setDetalhe(true)} className={cn("toque flex items-start gap-3 rounded-card p-4 text-left", corSugestao(ex.sugestao.tipo))}>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="t-destaque">Sugestão: {textoSugestao(ex)}</span>
          <span className="t-rotulo text-tx2">{ex.sugestao.motivo}</span>
        </span>
        <Icone nome="info" tamanho={20} className="mt-0.5" />
      </button>

      {feitas.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Séries feitas">
          {feitas.map(({ s, i }) =>
            i === melhorDaSessao ? (
              <li key={i} className="flex items-center gap-3 rounded-card bg-ac-tint p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ac text-on-ac">
                  <Icone nome="trofeu" tamanho={18} />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="t-legenda text-mut">
                    Série {i + 1}
                    {s.rir !== null ? ` · RIR ${ROT_RIR[s.rir]}` : ""}
                  </span>
                  <span className="t-h2 tab-num">
                    {s.kg ? `${fmtKg(s.kg)} kg × ` : ""}
                    {s.reps}
                  </span>
                </span>
                <span className="t-rotulo font-semibold text-ac-tx">Recorde</span>
                <button type="button" onClick={() => aoMudar(desfazerSerie(a, idx, i))} className="t-legenda min-h-11 px-1 text-mut" aria-label={`Desfazer série ${i + 1}`}>
                  Desfazer
                </button>
              </li>
            ) : (
              <li key={i} className="flex items-center gap-3 rounded-card bg-s1 px-4 py-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ok-tint text-ok-tx">
                  <Icone nome="check" tamanho={16} traco={2.4} />
                </span>
                <span className="t-rotulo text-mut">Série {i + 1}</span>
                <span className="t-h2 tab-num flex-1">
                  {s.kg ? `${fmtKg(s.kg)} kg × ` : ""}
                  {s.reps}
                </span>
                {s.rir !== null && <span className="t-legenda rounded-[6px] bg-s2 px-2 py-1 font-semibold">RIR {ROT_RIR[s.rir]}</span>}
                <button type="button" onClick={() => aoMudar(desfazerSerie(a, idx, i))} className="t-legenda min-h-11 px-1 text-mut" aria-label={`Desfazer série ${i + 1}`}>
                  Desfazer
                </button>
              </li>
            ),
          )}
        </ul>
      )}

      {atual >= 0 ? (
        <section className="flex flex-col gap-4 rounded-card bg-s1 p-4" aria-label={`Série ${atual + 1} de ${ex.series.length}`}>
          <h2 className="t-h2">
            Série {atual + 1} de {ex.series.length}
          </h2>
          <Stepper
            rotulo="carga"
            legenda={info.semCarga ? `kg extra, passo de ${fmtKg(passo)}` : `kg, passo de ${fmtKg(passo)}`}
            valor={ex.series[atual]!.kg}
            passo={passo}
            max={1000}
            decimal
            aoMudar={(v) => mudarSerie(atual, "kg", v)}
          />
          <Stepper
            rotulo={un === "s" ? "segundos" : un === "m" ? "metros" : "repetições"}
            legenda={un === "s" ? "segundos" : un === "m" ? "metros" : "repetições"}
            valor={ex.series[atual]!.reps}
            passo={un === "reps" ? 1 : 5}
            min={0}
            max={200}
            aoMudar={(v) => mudarSerie(atual, "reps", v)}
          />
          <div role="group" aria-label="RIR: quantas repetições ainda sobravam. Tocar conclui a série." className="grid grid-cols-5 gap-2">
            {ROT_RIR.map((r, i) => (
              <button key={r} type="button" onClick={() => concluir(i)} className="toque t-h2 tab-num min-h-14 rounded-ctl bg-s2 active:bg-ac active:text-on-ac">
                {r}
              </button>
            ))}
          </div>
          <p className="t-legenda text-center text-mut">Quantas ainda sobravam? Tocar no número conclui a série.</p>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-card bg-s1 p-4">
          <h2 className="t-h2">Exercício feito</h2>
          <p className="t-rotulo text-tx2">
            {ex.series.length} {ex.series.length === 1 ? "série" : "séries"} de {info.nome.toLowerCase()}.
          </p>
          <Botao tipo="secundario" icone="mais" onClick={() => mudarSeries(1)}>
            Mais uma série
          </Botao>
        </section>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-2">
        {proximo >= 0 ? (
          <button type="button" onClick={() => aoMudar({ ...a, idx: proximo })} className="toque flex min-h-14 items-center justify-between rounded-card bg-s1 px-4">
            <span className="t-corpo">
              <span className="text-mut">Próximo: </span>
              <b className="font-semibold">{exInfo(a.exercicios[proximo]!.ex_chave, proprios).nome}</b>
            </span>
            <Icone nome="next" tamanho={20} />
          </button>
        ) : (
          <Botao largura="cheia" onClick={aoFechar} tipo={totalFeitas === totalSeries ? "principal" : "secundario"}>
            Fechar treino
          </Botao>
        )}
      </div>

      <Folha aberta={lista} aoMudar={setLista} titulo="Exercícios" rotuloCancelar="Fechar">
        <ol className="flex flex-col gap-2">
          {a.exercicios.map((e, i) => {
            const f = e.series.filter((s) => s.feita).length;
            const ok = f === e.series.length;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    aoMudar({ ...a, idx: i });
                    setLista(false);
                  }}
                  className={cn("toque flex min-h-14 w-full items-center gap-3 rounded-ctl px-3 text-left", i === idx ? "bg-s2" : "bg-transparent")}
                >
                  <span className={cn("t-legenda flex size-7 items-center justify-center rounded-full font-bold", ok ? "bg-ac text-on-ac" : "bg-s3")}>
                    {ok ? <Icone nome="check" tamanho={14} traco={3} /> : i + 1}
                  </span>
                  <span className="t-destaque flex-1">{exInfo(e.ex_chave, proprios).nome}</span>
                  <span className="t-rotulo tab-num text-mut">
                    {f}/{e.series.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="grid grid-cols-2 gap-2">
          <Botao tipo="secundario" onClick={() => mudarSeries(1)}>
            + Série
          </Botao>
          <Botao tipo="secundario" disabled={ex.series.length <= 1 || ex.series[ex.series.length - 1]!.feita} onClick={() => mudarSeries(-1)}>
            − Última série
          </Botao>
        </div>
        <Link href={`/exercicio/?id=${ex.ex_chave}`} className="t-destaque flex min-h-12 items-center gap-2 text-ac-tx">
          <Icone nome="info" tamanho={20} /> Como fazer {info.nome.toLowerCase()}
        </Link>
        <Botao largura="cheia" onClick={aoFechar}>
          Fechar treino
        </Botao>
        <Botao tipo="perigo" largura="cheia" onClick={aoDescartar}>
          Descartar treino
        </Botao>
      </Folha>

      <Folha aberta={detalhe} aoMudar={setDetalhe} titulo="Sugestão de hoje" rotuloCancelar="Fechar">
        <p className="t-h2">{textoSugestao(ex)}</p>
        <p className="t-corpo text-tx2">{ex.sugestao.motivo}</p>
        {ex.sugestao.ultima && (
          <p className="t-rotulo tab-num text-mut">
            Última vez: {ex.sugestao.ultima.map((s) => `${s.kg ? `${fmtKg(s.kg)}×` : ""}${s.reps}${s.rir !== null ? ` (RIR ${ROT_RIR[s.rir]})` : ""}`).join(", ")}
          </p>
        )}
        <Botao
          tipo="secundario"
          onClick={() => {
            aoMudar(usarSugestao(a, idx));
            setDetalhe(false);
          }}
        >
          Pôr a sugestão nas séries que faltam
        </Botao>
      </Folha>
    </div>
  );
}
