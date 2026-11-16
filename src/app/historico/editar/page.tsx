"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PaginaCheia } from "@/componentes/estrutura";
import { Abertura } from "@/componentes/provedores";
import { Botao, BotaoIcone } from "@/componentes/ui/botao";
import { AreaTexto, Aviso, Campo, Chip, Escala } from "@/componentes/ui/pecas";
import { useAvisoCurto } from "@/componentes/ui/aviso-curto";
import { useBase } from "@/lib/dados/base";
import { salvarRegistro } from "@/lib/dados/repo";
import { exInfo, nomeCurto } from "@/lib/dominio/exercicios";
import type { Sessao } from "@/lib/dominio/tipos";
import { hojeK } from "@/lib/util/datas";
import { fmtKg, lerMmss, lerNumero, mmss } from "@/lib/util/formato";
import { cn } from "@/lib/util/cn";

const RIR = ["0", "1", "2", "3", "4+"];

function Editar() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const base = useBase();
  const aviso = useAvisoCurto();
  const [s, setS] = useState<Sessao | null>(null);
  const [tempo, setTempo] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!base || s) return;
    const x = base.sessoes.find((y) => y.id === id);
    if (x) {
      setS(structuredClone(x));
      setTempo(x.tempo_total_s ? mmss(x.tempo_total_s) : "");
    }
  }, [base, id, s]);

  if (!base) return <Abertura />;
  if (!s)
    return (
      <PaginaCheia voltar={{ href: "/historico/" }}>
        <p className="t-corpo">Sessão não encontrada.</p>
      </PaginaCheia>
    );

  const mudar = (m: Partial<Sessao>) => setS({ ...s, ...m });
  const opcoes = base.treinos.filter((t) => t.tipo === s.tipo);
  const mudarSerie = (ei: number, si: number, campo: "kg" | "reps" | "rir", v: number | null) =>
    mudar({
      exercicios: s.exercicios.map((e, i) =>
        i === ei ? { ...e, series: e.series.map((x, j) => (j === si ? { ...x, [campo]: campo === "rir" ? v : (v ?? 0) } : x)) } : e,
      ),
    });

  async function salvar() {
    if (!s) return;
    if (s.dor_articular && !s.dor_articular_ex.length && s.tipo === "forca") {
      setErro("Escolha em qual exercício doeu.");
      return;
    }
    let tt = s.tempo_total_s;
    if (s.tipo === "cond") {
      tt = tempo.trim() ? lerMmss(tempo) : null;
      if (tempo.trim() && !Number.isFinite(tt)) {
        setErro("Tempo total no formato min:seg, por exemplo 32:15.");
        return;
      }
    }
    const final: Sessao = {
      ...s,
      tempo_total_s: tt,
      dor_articular: s.dor_articular && s.dor_articular_ex.length > 0,
      dor_articular_ex: s.dor_articular ? s.dor_articular_ex : [],
      dor_articular_onde: s.dor_articular ? s.dor_articular_onde : null,
      exercicios: s.exercicios.filter((e) => e.series.length),
      voltas_feitas: s.tipo === "cond" && s.tempos.length ? Math.max(...s.tempos.map((t) => t.volta)) + 1 : s.voltas_feitas,
    };
    await salvarRegistro("sessoes", final);
    aviso("Sessão salva.");
    router.replace(`/historico/sessao/?id=${s.id}`);
  }

  return (
    <PaginaCheia
      voltar={{ href: `/historico/sessao/?id=${s.id}`, rotulo: "Cancelar" }}
      titulo="Editar sessão"
      acao={
        <button type="button" onClick={salvar} className="t-destaque min-h-11 px-1 text-ac-tx">
          Salvar
        </button>
      }
    >
      <label className="flex flex-col gap-2">
        <span className="t-destaque">Treino</span>
        <select
          value={s.treino_id ?? ""}
          onChange={(e) => {
            const t = base.treinoPorId.get(e.target.value);
            mudar({ treino_id: e.target.value || null, nome: t?.nome ?? s.nome });
          }}
          className="t-corpo min-h-12 rounded-ctl bg-s2 px-4"
        >
          {!s.treino_id && <option value="">{s.nome}</option>}
          {opcoes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className="t-destaque">Data</span>
        <input type="date" value={s.data} max={hojeK()} onChange={(e) => e.target.value && mudar({ data: e.target.value })} className="t-corpo min-h-12 rounded-ctl bg-s2 px-4" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Campo
          rotulo="Duração"
          unidade="min"
          inputMode="numeric"
          value={s.duracao_min ?? ""}
          onChange={(e) => {
            const n = Math.round(lerNumero(e.target.value));
            mudar({ duracao_min: Number.isFinite(n) ? Math.min(600, Math.max(1, n)) : null });
          }}
        />
        <Campo
          rotulo="Kcal"
          unidade="kcal"
          inputMode="numeric"
          value={s.kcal ?? ""}
          onChange={(e) => {
            const n = Math.round(lerNumero(e.target.value));
            mudar({ kcal: Number.isFinite(n) ? Math.min(5000, Math.max(0, n)) : null });
          }}
        />
      </div>
      {s.tipo === "cond" && (
        <>
          <Campo rotulo="Tempo total" unidade="min:seg" value={tempo} onChange={(e) => setTempo(e.target.value)} />
          <Escala rotulo="RPE" min={1} max={10} valor={s.rpe} aoMudar={(v) => mudar({ rpe: v })} />
        </>
      )}
      <Escala rotulo="Energia" valor={s.energia} aoMudar={(v) => mudar({ energia: v })} pontas={["sem energia", "cheio"]} />
      <Escala rotulo="Dor muscular" valor={s.dor_muscular} aoMudar={(v) => mudar({ dor_muscular: v })} pontas={["nenhuma", "forte"]} />
      <div className="flex flex-col gap-2">
        <span className="t-destaque">Dor articular</span>
        <div className="grid grid-cols-2 gap-2">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              type="button"
              aria-pressed={s.dor_articular === v}
              onClick={() => mudar({ dor_articular: v, dor_articular_ex: v ? s.dor_articular_ex : [] })}
              className={cn("toque t-destaque min-h-12 rounded-ctl", s.dor_articular === v ? "bg-ac text-on-ac" : "bg-s2")}
            >
              {v ? "Sim" : "Não"}
            </button>
          ))}
        </div>
        {s.dor_articular && (
          <>
            <div className="flex flex-wrap gap-2">
              {s.exercicios.map((e) => {
                const on = s.dor_articular_ex.includes(e.ex_chave);
                return (
                  <Chip
                    key={e.ex_chave}
                    ativo={on}
                    onClick={() => mudar({ dor_articular_ex: on ? s.dor_articular_ex.filter((x) => x !== e.ex_chave) : [...s.dor_articular_ex, e.ex_chave] })}
                  >
                    {nomeCurto(exInfo(e.ex_chave, base.proprios).nome)}
                  </Chip>
                );
              })}
            </div>
            <input
              className="t-corpo min-h-12 rounded-ctl bg-s2 px-4 placeholder:text-mut"
              placeholder="Onde? Ex.: ombro direito"
              maxLength={120}
              value={s.dor_articular_onde ?? ""}
              onChange={(e) => mudar({ dor_articular_onde: e.target.value || null })}
            />
          </>
        )}
      </div>
      <AreaTexto rotulo="Observações" maxLength={1000} value={s.obs ?? ""} onChange={(e) => mudar({ obs: e.target.value || null })} />

      {s.exercicios.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="t-h1">Séries</h2>
          {s.exercicios.map((e, ei) => (
            <div key={ei} className="flex flex-col gap-3 rounded-card bg-s1 p-4">
              <b className="t-destaque">{exInfo(e.ex_chave, base.proprios).nome}</b>
              {e.series.map((x, si) => (
                <div key={`${si}-${e.series.length}`} className="flex flex-col gap-2 border-t border-line pt-3">
                  <div className="grid grid-cols-[24px_1fr_16px_1fr_44px] items-center gap-2">
                    <span className="t-rotulo text-mut">{si + 1}</span>
                    <input
                      inputMode="decimal"
                      aria-label={`Série ${si + 1}: carga em kg`}
                      defaultValue={fmtKg(x.kg)}
                      onBlur={(ev) => {
                        const n = lerNumero(ev.target.value);
                        mudarSerie(ei, si, "kg", Number.isFinite(n) ? Math.min(1000, Math.max(0, n)) : 0);
                      }}
                      className="t-destaque tab-num min-h-11 rounded-ctl bg-s2 px-3"
                    />
                    <span className="text-center text-mut">×</span>
                    <input
                      inputMode="numeric"
                      aria-label={`Série ${si + 1}: repetições`}
                      defaultValue={x.reps}
                      onBlur={(ev) => {
                        const n = Math.round(lerNumero(ev.target.value));
                        mudarSerie(ei, si, "reps", Number.isFinite(n) ? Math.min(200, Math.max(0, n)) : 0);
                      }}
                      className="t-destaque tab-num min-h-11 rounded-ctl bg-s2 px-3"
                    />
                    <BotaoIcone
                      icone="x"
                      plano
                      rotulo={`Apagar série ${si + 1}`}
                      onClick={() => mudar({ exercicios: s.exercicios.map((y, i) => (i === ei ? { ...y, series: y.series.filter((_, j) => j !== si) } : y)) })}
                    />
                  </div>
                  <div role="group" aria-label={`RIR da série ${si + 1}`} className="grid grid-cols-[40px_repeat(5,1fr)] items-center gap-1.5">
                    <span className="t-legenda text-mut">RIR</span>
                    {RIR.map((r, v) => (
                      <button
                        key={r}
                        type="button"
                        aria-pressed={x.rir === v}
                        onClick={() => mudarSerie(ei, si, "rir", x.rir === v ? null : v)}
                        className={cn("t-rotulo min-h-11 rounded-ctl font-semibold", x.rir === v ? "bg-ac text-on-ac" : "bg-s2")}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Botao
                tipo="discreto"
                className="self-start"
                onClick={() => {
                  const u = e.series[e.series.length - 1];
                  mudar({ exercicios: s.exercicios.map((y, i) => (i === ei ? { ...y, series: [...y.series, { kg: u?.kg ?? 0, reps: u?.reps ?? 0, rir: null }] } : y)) });
                }}
              >
                + Série
              </Botao>
            </div>
          ))}
        </section>
      )}

      {s.tempos.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="t-h1">Tempo por estação</h2>
          <div className="flex flex-col rounded-card bg-s1 px-4">
            {s.tempos.map((t, i) => (
              <div key={`${i}-${s.tempos.length}`} className="flex min-h-14 items-center gap-3 border-b border-line last:border-0">
                <span className="flex flex-1 flex-col">
                  <span className="t-rotulo">{t.nome}</span>
                  <span className="t-legenda text-mut">Volta {t.volta + 1}</span>
                </span>
                <input
                  aria-label={`${t.nome}, volta ${t.volta + 1}: tempo em min:seg`}
                  defaultValue={mmss(t.seg)}
                  onBlur={(ev) => {
                    const n = lerMmss(ev.target.value);
                    if (Number.isFinite(n) && n >= 0) mudar({ tempos: s.tempos.map((x, j) => (j === i ? { ...x, seg: Math.round(n) } : x)) });
                  }}
                  className="t-destaque tab-num min-h-11 w-24 rounded-ctl bg-s2 px-3 text-right"
                />
                <BotaoIcone icone="x" plano rotulo={`Apagar tempo de ${t.nome}`} onClick={() => mudar({ tempos: s.tempos.filter((_, j) => j !== i) })} />
              </div>
            ))}
          </div>
          <p className="t-legenda text-mut">Formato min:seg, por exemplo 2:45.</p>
        </section>
      )}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Botao largura="cheia" onClick={salvar}>
        Salvar alterações
      </Botao>
    </PaginaCheia>
  );
}

export default function PaginaEditar() {
  return (
    <Suspense>
      <Editar />
    </Suspense>
  );
}
