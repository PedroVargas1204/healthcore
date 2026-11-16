"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Figura } from "@/componentes/mapa-corpo";
import { FolhaAdesivo } from "@/componentes/adesivo";
import { Abertura } from "@/componentes/provedores";
import { Botao, BotaoIcone } from "@/componentes/ui/botao";
import { Icone } from "@/componentes/ui/icone";
import { useAvisoCurto } from "@/componentes/ui/aviso-curto";
import { useBase } from "@/lib/dados/base";
import { salvarRascunho } from "@/lib/dados/repo";
import { comecar } from "@/lib/acoes/treino";
import { resumoSessao } from "@/lib/dominio/resumo";
import { regioesDoTreino, type Regiao } from "@/lib/dominio/volume";
import type { Treino } from "@/lib/dominio/tipos";
import { dataCurta } from "@/lib/util/datas";
import { fmtKg, mmss } from "@/lib/util/formato";

function Resumo() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const base = useBase();
  const aviso = useAvisoCurto();
  const [adesivo, setAdesivo] = useState(false);
  const sessao = base?.sessoes.find((s) => s.id === id);

  const dados = useMemo(() => {
    if (!base || !sessao) return null;
    const r = resumoSessao(sessao, base.sessoes, base.proprios);
    const comoTreino: Treino = {
      id: sessao.id,
      nome: sessao.nome,
      tipo: "forca",
      tags: [],
      voltas: null,
      descanso_voltas_s: null,
      finalizador_id: null,
      obs: null,
      posicao: 0,
      estacoes: [],
      exercicios: sessao.exercicios.map((e) => ({ ex_chave: e.ex_chave, series: e.series.length, reps: e.alvo ?? "", descanso_s: null, obs: null, cat: e.cat })),
    };
    const { prim, sec } = regioesDoTreino(comoTreino, base.proprios);
    return { r, prim, sec };
  }, [base, sessao]);

  if (!base) return <Abertura />;
  if (!sessao || !dados) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-4 px-5">
        <p className="t-corpo">Treino não encontrado.</p>
        <Botao onClick={() => router.replace("/")}>Ir para hoje</Botao>
      </main>
    );
  }

  const { r, prim, sec } = dados;
  const cor = (x: Regiao) => (prim.has(x) ? "#111214" : sec.has(x) ? "#7C2D20" : "#E2462B");
  const treino = sessao.treino_id ? base.treinoPorId.get(sessao.treino_id) : undefined;
  const finalizador = treino?.finalizador_id ? base.treinoPorId.get(treino.finalizador_id) : undefined;
  const cond = sessao.tipo === "cond";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-4 px-5 pt-seguro pb-seguro">
      <div className="flex justify-end pt-1">
        <BotaoIcone icone="x" rotulo="Fechar" onClick={() => router.replace("/")} />
      </div>
      <h1 className="t-tela">Treino feito</h1>
      <section className="flex flex-col gap-4 rounded-card bg-ac p-5 text-on-ac">
        <div className="flex items-center justify-between">
          <span className="font-disp text-lg font-extrabold uppercase">HealthCore</span>
          <span className="t-rotulo font-semibold">{dataCurta(sessao.data).toLowerCase()}</span>
        </div>
        <h2 className="font-disp text-[2.25rem] leading-none font-extrabold uppercase">{sessao.nome}</h2>
        <div className="flex items-center gap-5">
          {!cond && (
            <div className="flex gap-1" aria-hidden="true">
              <Figura lado="frente" largura={44} cor={cor} base="#E2462B" />
              <Figura lado="costas" largura={44} cor={cor} base="#E2462B" />
            </div>
          )}
          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <dt className="sr-only">Minutos</dt>
              <dd className="t-numero">{r.minutos}</dd>
              <span className="t-rotulo font-semibold" aria-hidden="true">
                minutos
              </span>
            </div>
            {cond ? (
              <div>
                <dt className="sr-only">Tempo do circuito</dt>
                <dd className="t-numero">{sessao.tempo_total_s ? mmss(sessao.tempo_total_s) : "—"}</dd>
                <span className="t-rotulo font-semibold" aria-hidden="true">
                  circuito
                </span>
              </div>
            ) : (
              <div>
                <dt className="sr-only">Séries</dt>
                <dd className="t-numero">{r.series}</dd>
                <span className="t-rotulo font-semibold" aria-hidden="true">
                  séries
                </span>
              </div>
            )}
            {!cond && (
              <>
                <div>
                  <dt className="sr-only">Recordes</dt>
                  <dd className="t-numero">{r.recordes.length}</dd>
                  <span className="t-rotulo font-semibold" aria-hidden="true">
                    {r.recordes.length === 1 ? "recorde" : "recordes"}
                  </span>
                </div>
                <div>
                  <dt className="sr-only">Carga total</dt>
                  <dd className="t-numero">{r.variacao === null ? "—" : `${r.variacao > 0 ? "+" : ""}${r.variacao}%`}</dd>
                  <span className="t-rotulo font-semibold" aria-hidden="true">
                    carga total
                  </span>
                </div>
              </>
            )}
          </dl>
        </div>
        {r.recordes.length > 0 && (
          <ul className="flex flex-col gap-1.5 border-t border-[rgba(17,18,20,.25)] pt-3">
            {r.recordes.map((x) => (
              <li key={x.ex_chave} className="t-rotulo flex items-center gap-2 font-semibold">
                <Icone nome="trofeu" tamanho={18} />
                <span className="flex-1">{x.nome}</span>
                <span className="tab-num">
                  {fmtKg(x.kg)} kg × {x.reps}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {!cond && <p className="t-legenda text-mut">“Carga total” compara kg × repetições com a última vez deste treino.</p>}

      {finalizador && (
        <section className="flex items-center gap-3 rounded-card bg-s1 p-4">
          <span className="flex flex-1 flex-col">
            <span className="t-legenda text-mut">Finalizador</span>
            <span className="t-destaque">{finalizador.nome}</span>
          </span>
          <Botao
            tipo="secundario"
            icone="play"
            onClick={async () => {
              await salvarRascunho(comecar(finalizador, base), { forcarEnvio: true });
              router.push("/treino/");
            }}
          >
            Começar
          </Botao>
        </section>
      )}

      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <Botao tipo="secundario" icone="compartilhar" onClick={() => setAdesivo(true)}>
          Compartilhar
        </Botao>
        <Botao onClick={() => router.replace("/")}>Concluir</Botao>
      </div>
      {adesivo && (
        <FolhaAdesivo
          aberta={adesivo}
          aoMudar={setAdesivo}
          aoAviso={aviso}
          dados={{ nome: sessao.nome, minutos: r.minutos, series: r.series, prim, sec, recordes: r.recordes.map((x) => ({ nome: x.nome, kg: x.kg, reps: x.reps })) }}
        />
      )}
    </main>
  );
}

export default function PaginaResumo() {
  return (
    <Suspense>
      <Resumo />
    </Suspense>
  );
}
