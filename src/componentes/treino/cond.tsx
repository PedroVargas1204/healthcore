"use client";

import { Botao } from "@/componentes/ui/botao";
import { SinalProntidao } from "@/componentes/prontidao";
import { condDesfazer, condProxima } from "@/lib/acoes/treino";
import type { SessaoAtivaCond, Tempo } from "@/lib/dominio/tipos";
import { mmss } from "@/lib/util/formato";

export function TreinoCond({
  a,
  agora,
  aoMudar,
  aoFechar,
  aoDescartar,
}: {
  a: SessaoAtivaCond;
  agora: number;
  aoMudar: (a: SessaoAtivaCond) => void;
  aoFechar: () => void;
  aoDescartar: () => void;
}) {
  if (!a.t_inicio) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-disp text-[2.5rem] leading-[0.92] font-extrabold uppercase">{a.nome}</h1>
        <SinalProntidao nivel={a.prontidao.nivel} motivo={a.prontidao.motivo} />
        <section className="flex flex-col gap-1 rounded-card bg-s1 p-4">
          <span className="t-rotulo text-mut">Hoje</span>
          <span className="t-h2">
            {a.voltas} {a.voltas > 1 ? "voltas" : "volta"}
            {a.descanso ? `, ${mmss(a.descanso)} de descanso entre elas` : ""}
          </span>
          <p className="t-rotulo text-tx2">{a.sugestao_motivo}</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="t-h1">Estações</h2>
          {a.estacoes.map((e, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-card bg-s1 p-4">
              <div className="flex justify-between gap-3">
                <b className="t-destaque">
                  {i + 1}. {e.nome}
                </b>
                <span className="t-rotulo tab-num text-mut">{e.alvo}</span>
              </div>
              {e.substituto && <span className="t-legenda text-mut">{e.substituto}</span>}
            </div>
          ))}
        </section>
        {a.obs && <p className="t-rotulo rounded-card bg-s1 p-4 text-tx2">{a.obs}</p>}
        <Botao icone="play" largura="cheia" onClick={() => aoMudar(condProxima(a))}>
          Iniciar cronômetro
        </Botao>
        <p className="t-legenda text-center text-mut">Sem cronômetro? Faça o treino e toque em Fechar treino para digitar o tempo.</p>
        <div className="grid grid-cols-2 gap-2">
          <Botao tipo="secundario" onClick={aoFechar}>
            Fechar treino
          </Botao>
          <Botao tipo="perigo" onClick={aoDescartar}>
            Descartar
          </Botao>
        </div>
      </div>
    );
  }

  const total = a.voltas * a.estacoes.length;
  const fim = a.marcos.length >= total || !!a.fim_timer;
  const est = a.estacoes[a.pos.i];
  const desdeMarco = (agora - (a.ultimo_marco ?? a.t_inicio)) / 1000;
  const porVolta = new Map<number, Tempo[]>();
  for (const m of a.marcos) porVolta.set(m.volta, [...(porVolta.get(m.volta) ?? []), m]);
  const ultimaEstacao = a.pos.i === a.estacoes.length - 1;
  const ultimaVolta = a.pos.v === a.voltas - 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <span className="t-rotulo text-mut">Tempo total</span>
        <span className="font-disp tab-num text-[4rem] leading-none font-extrabold" role="timer">
          {mmss(((a.fim_timer ?? agora) - a.t_inicio) / 1000)}
        </span>
      </div>
      {fim ? (
        <section className="flex flex-col gap-3 rounded-card bg-s1 p-4">
          <h2 className="t-h1">Todas as estações feitas</h2>
          <p className="t-rotulo text-tx2">Feche o treino para registrar kcal, RPE e como você se sentiu.</p>
          <Botao largura="cheia" onClick={aoFechar}>
            Fechar treino
          </Botao>
        </section>
      ) : (
        <>
          <section className="flex flex-col gap-1 rounded-card bg-s1 p-4">
            <span className="t-rotulo text-mut">
              Volta {a.pos.v + 1} de {a.voltas} · estação {a.pos.i + 1} de {a.estacoes.length}
            </span>
            <span className="font-disp text-[2.25rem] leading-none font-extrabold uppercase">{est?.nome}</span>
            {est?.alvo && <span className="t-h2 tab-num">{est.alvo}</span>}
            {est?.substituto && <span className="t-legenda text-mut">{est.substituto}</span>}
            <span className="t-rotulo pt-2 text-mut">
              Nesta estação: <b className="tab-num text-tx">{mmss(desdeMarco)}</b>
            </span>
          </section>
          <Botao largura="cheia" onClick={() => aoMudar(condProxima(a))}>
            {ultimaEstacao ? (ultimaVolta ? "Terminar" : `Fechar volta ${a.pos.v + 1}`) : "Próxima estação"}
          </Botao>
        </>
      )}
      {a.marcos.length > 0 && (
        <Botao tipo="discreto" className="self-center text-mut" onClick={() => aoMudar(condDesfazer(a))}>
          Desfazer a última marca
        </Botao>
      )}
      {porVolta.size > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="t-h2">Tempos</h2>
          {[...porVolta.entries()].map(([v, ms]) => (
            <div key={v} className="flex flex-col gap-1 rounded-card bg-s1 p-4">
              <div className="t-destaque flex justify-between">
                <span>Volta {v + 1}</span>
                <span className="tab-num">{mmss(ms.reduce((s, m) => s + m.seg, 0))}</span>
              </div>
              {ms.map((m, i) => (
                <div key={i} className="t-rotulo flex justify-between text-mut">
                  <span>{m.nome}</span>
                  <span className="tab-num">{mmss(m.seg)}</span>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}
      {!fim && (
        <Botao tipo="discreto" className="self-center text-mut" onClick={aoFechar}>
          Fechar treino agora
        </Botao>
      )}
    </div>
  );
}
