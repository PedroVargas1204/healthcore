"use client";

import { useMemo, useState } from "react";
import { PaginaAba, TituloTela } from "@/componentes/estrutura";
import { FolhaNoite } from "@/componentes/folha-noite";
import { Barras } from "@/componentes/graficos";
import { Barras as BarrasProntidao } from "@/componentes/prontidao";
import { Botao } from "@/componentes/ui/botao";
import { Icone } from "@/componentes/ui/icone";
import { Aviso, Cartao, Esqueleto } from "@/componentes/ui/pecas";
import { useAvisoCurto } from "@/componentes/ui/aviso-curto";
import { useBase, type Base } from "@/lib/dados/base";
import { novoId, salvarConfig, salvarRegistro } from "@/lib/dados/repo";
import { calibrarSono } from "@/lib/dominio/recomendacao";
import type { Noite } from "@/lib/dominio/tipos";
import { dataCurta, deChave, hojeK, somarDias } from "@/lib/util/datas";
import { fmt, horasTxt, media } from "@/lib/util/formato";
import { cn } from "@/lib/util/cn";

function ConteudoSono({ base }: { base: Base }) {
  const aviso = useAvisoCurto();
  const hoje = hojeK();
  const r = base.regras;
  const [editar, setEditar] = useState<{ data: string; noite?: Noite } | null>(null);
  const [todas, setTodas] = useState(false);
  const porData = useMemo(() => new Map(base.noites.map((n) => [n.data, n])), [base.noites]);
  const ontem = porData.get(hoje);

  const ult = (ini: number) => {
    const v: number[] = [];
    for (let i = ini; i < ini + 7; i++) {
      const n = porData.get(somarDias(hoje, -i));
      if (n) v.push(n.horas);
    }
    return v;
  };
  const m7 = media(ult(0));
  const mAnt = media(ult(7));
  const catorze = Array.from({ length: 14 }, (_, i) => somarDias(hoje, i - 13));
  const lancadas = catorze.filter((k) => porData.has(k));
  const baixas = catorze.filter((k) => (porData.get(k)?.horas ?? 99) < r.sonoAmareloNoite!);
  const cal = useMemo(() => calibrarSono({ noites: base.noites, sessoes: base.sessoes, config: base.config, hoje }), [base, hoje]);
  const ultimaCalib = base.calibracoes[base.calibracoes.length - 1];
  const lista = todas ? base.noites : base.noites.slice(0, 5);
  const maxH = Math.max(9, ...catorze.map((k) => porData.get(k)?.horas ?? 0));

  return (
    <>
      <TituloTela>Sono</TituloTela>
      <Cartao className="flex-row items-center justify-between">
        <div className="flex flex-col">
          <span className="t-rotulo text-mut">
            Noite de ontem{ontem?.qualidade ? `, qualidade ${ontem.qualidade}` : ""}
            {ontem?.score != null ? `, score ${ontem.score}` : ""}
          </span>
          <span className="t-numero">{ontem ? horasTxt(ontem.horas) : "— h"}</span>
        </div>
        <Botao tipo="secundario" icone={ontem ? "edit" : "mais"} onClick={() => setEditar({ data: hoje, noite: ontem })}>
          {ontem ? "Editar" : "Lançar"}
        </Botao>
      </Cartao>

      <Cartao>
        <h2 className="t-h2">Últimas 14 noites</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col">
            <span className="t-numero text-[1.75rem]">{m7 !== null ? `${fmt(m7)} h` : "—"}</span>
            <span className="t-legenda text-tx2">média de 7 dias</span>
            {m7 !== null && mAnt !== null && (
              <span className="t-legenda text-mut">
                {m7 - mAnt >= 0 ? "+" : "−"}
                {fmt(Math.abs(m7 - mAnt))} h vs anterior
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="t-numero text-[1.75rem]">{baixas.length}</span>
            <span className="t-legenda text-tx2">
              {baixas.length === 1 ? "noite" : "noites"} abaixo de {fmt(r.sonoAmareloNoite)}{"\u00a0"}h
            </span>
            {baixas.length > 0 && <span className="t-legenda text-mut">{baixas.map((k) => `dia ${deChave(k).getDate()}`).join(", ")}</span>}
          </div>
          <div className="flex flex-col">
            <span className="t-numero text-[1.75rem]">{lancadas.length}</span>
            <span className="t-legenda text-tx2">de 14 lançadas</span>
          </div>
        </div>
        <Barras
          barras={catorze.map((k) => {
            const n = porData.get(k);
            return {
              rotulo: String(deChave(k).getDate()),
              valor: n?.horas ?? null,
              cor: k === hoje ? "var(--ac)" : (n?.horas ?? 99) < r.sonoAmareloNoite! ? "var(--warn)" : "var(--dim)",
            };
          })}
          meta={{ valor: r.sonoVerdeMedia!, rotulo: "meta" }}
          marcas={[0, r.sonoAmareloNoite!, r.sonoVerdeMedia!]}
          max={maxH}
          unidade="h"
          resumo={`Horas de sono nas últimas 14 noites. Média de 7 dias ${m7 !== null ? fmt(m7) : "sem dados"} horas; ${baixas.length} abaixo de ${fmt(r.sonoAmareloNoite)} horas.`}
        />
        <div className="t-legenda flex flex-wrap gap-x-4 gap-y-1 text-mut" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-ac" /> ontem
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-warn" /> abaixo de {fmt(r.sonoAmareloNoite)} h
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-4 border-t-2 border-dashed border-ok" /> meta da média
          </span>
        </div>
      </Cartao>

      <Cartao>
        <h2 className="t-h2">Como o sono mexe no treino</h2>
        {(
          [
            ["verde", "Verde: sobe a carga", `Média de ${fmt(r.sonoVerdeMedia)} h ou mais e a última noite com ${fmt(r.sonoVerdeNoite)} h ou mais.`, "text-ok-tx"],
            ["amarelo", "Amarela: mantém", `Média entre ${fmt(r.sonoVermelhoMedia)} e ${fmt(r.sonoVerdeMedia)} h, ou noite abaixo de ${fmt(r.sonoVerdeNoite)} h.`, "text-warn-tx"],
            ["vermelho", "Vermelha: alivia", `Média abaixo de ${fmt(r.sonoVermelhoMedia)} h, ou ${r.noitesCriticas} noites abaixo de ${fmt(r.sonoCritico)} h na semana.`, "text-bad-tx"],
          ] as const
        ).map(([n, t, d, c]) => (
          <div key={n} className="flex gap-3 border-t border-line pt-3">
            <BarrasProntidao nivel={n} tamanho={18} />
            <p className="flex flex-col">
              <span className={cn("t-destaque", c)}>{t}</span>
              <span className="t-rotulo text-tx2">{d}</span>
            </p>
          </div>
        ))}
        <p className="t-legenda text-mut">Os números são seus e mudam em Ajustes.</p>
      </Cartao>

      <Cartao>
        <h2 className="t-h2">Calibragem pessoal</h2>
        {!cal.pronto ? (
          <>
            <p className="t-corpo text-tx2">
              Depois de {cal.minSemanas} semanas e {cal.minSessoes} treinos com sono lançado, o app mostra a partir de quantas horas o seu desempenho cai,
              e você decide se troca os limites.
            </p>
            <div className="flex gap-1" aria-hidden="true">
              {Array.from({ length: cal.minSessoes }, (_, i) => (
                <span key={i} className={cn("h-2 flex-1 rounded-sm", i < cal.sessoes ? "bg-ac" : "bg-s3")} />
              ))}
            </div>
            <p className="t-legenda text-mut">
              {Math.min(cal.sessoes, cal.minSessoes)} de {cal.minSessoes} treinos · {Math.min(cal.semanas, cal.minSemanas)} de {cal.minSemanas} semanas
            </p>
          </>
        ) : cal.semEfeito ? (
          <p className="t-corpo text-tx2">
            Com {cal.sessoes} treinos analisados, não apareceu queda clara de desempenho com menos sono. Os limites atuais continuam.
          </p>
        ) : (
          <>
            <p className="t-destaque">
              Com menos de {fmt(cal.limiar)} h de sono, seu desempenho nos compostos cai em média {fmt(cal.queda)}%.
            </p>
            <p className="t-legenda text-mut">
              Baseado em {cal.sessoes} treinos: {cal.abaixo} depois de noites com menos de {fmt(cal.limiar)} h e {cal.acima} depois de noites mais longas.
            </p>
            {ultimaCalib && ultimaCalib.limiar_h === cal.limiar ? (
              <span className="t-legenda self-start rounded-full bg-ok-tint px-3 py-1 font-semibold text-ok-tx">Limites pessoais em uso</span>
            ) : base.config.calibracao_dispensada_ate && base.config.calibracao_dispensada_ate >= hoje ? (
              <p className="t-legenda text-mut">Você deixou para depois. A sugestão volta em alguns dias.</p>
            ) : (
              <>
                <p className="t-rotulo text-tx2">
                  Limites sugeridos: noite verde a partir de {fmt(cal.sugestao!.sonoVerdeNoite)} h, amarela abaixo de {fmt(cal.sugestao!.sonoAmareloNoite)} h,
                  crítica abaixo de {fmt(cal.sugestao!.sonoCritico)} h.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Botao
                    onClick={async () => {
                      await salvarConfig({ regras: { ...base.config.regras, ...cal.sugestao! } });
                      await salvarRegistro("calibracoes", {
                        id: novoId(),
                        aplicada_em: hoje,
                        limiar_h: cal.limiar!,
                        queda_pct: Math.round(cal.queda! * 100) / 100,
                        sessoes: cal.sessoes,
                      });
                      aviso("Limites pessoais aplicados.");
                    }}
                  >
                    Aplicar
                  </Botao>
                  <Botao tipo="secundario" onClick={() => salvarConfig({ calibracao_dispensada_ate: somarDias(hoje, 14) })}>
                    Agora não
                  </Botao>
                </div>
              </>
            )}
          </>
        )}
      </Cartao>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="t-h1">Noites lançadas</h2>
          <div className="flex items-center gap-1">
            {base.noites.length > 5 && (
              <Botao tipo="discreto" onClick={() => setTodas(!todas)}>
                {todas ? "Ver menos" : "Ver todas"}
              </Botao>
            )}
          </div>
        </div>
        {base.noites.length === 0 ? (
          <Aviso tipo="info">Nenhuma noite lançada ainda. Lance a de ontem para a prontidão usar o seu sono.</Aviso>
        ) : (
          <ul className="flex flex-col rounded-card bg-s1">
            {lista.map((n) => (
              <li key={n.id} className="border-b border-line last:border-0">
                <button type="button" onClick={() => setEditar({ data: n.data, noite: n })} className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
                  <span className="t-rotulo w-28 text-tx2">{dataCurta(n.data)}</span>
                  <b className={cn("t-destaque tab-num", n.horas < r.sonoAmareloNoite! && "text-warn-tx")}>{horasTxt(n.horas)}</b>
                  <span className="t-rotulo flex-1 text-mut">
                    {n.qualidade ? `qualidade ${n.qualidade}` : ""}
                    {n.score != null ? `${n.qualidade ? " · " : ""}score ${n.score}` : ""}
                  </span>
                  <Icone nome="next" tamanho={18} className="text-mut" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="t-legenda text-mut">Toque numa noite para editar ou apagar.</p>
          <Botao tipo="discreto" onClick={() => setEditar({ data: "" })}>
            + Outra noite
          </Botao>
        </div>
      </section>

      {editar && (
        <FolhaNoiteComData
          key={editar.noite?.id ?? editar.data}
          inicial={editar}
          porData={porData}
          aoFechar={() => setEditar(null)}
          aoSalvar={() => aviso("Noite salva.")}
          aoApagar={() => aviso("Noite apagada.")}
        />
      )}
    </>
  );
}

/** Para "+ Outra noite", escolhe a data antes. */
function FolhaNoiteComData({
  inicial,
  porData,
  aoFechar,
  aoSalvar,
  aoApagar,
}: {
  inicial: { data: string; noite?: Noite };
  porData: Map<string, Noite>;
  aoFechar: () => void;
  aoSalvar: () => void;
  aoApagar: () => void;
}) {
  const [data, setData] = useState(inicial.data);
  if (!data) {
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={aoFechar}>
        <div className="mx-auto flex w-full max-w-[480px] flex-col gap-3 rounded-t-folha bg-s1 p-5 pb-seguro" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Escolher a data">
          <label className="flex flex-col gap-2">
            <span className="t-destaque">Dia em que você acordou</span>
            <input type="date" max={hojeK()} className="t-corpo min-h-14 rounded-ctl bg-s2 px-4" onChange={(e) => e.target.value && setData(e.target.value)} autoFocus />
          </label>
          <Botao tipo="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
        </div>
      </div>
    );
  }
  const noite = inicial.noite ?? porData.get(data);
  return <FolhaNoite key={noite?.id ?? data} aberta aoMudar={(v) => !v && aoFechar()} data={data} noite={noite} aoSalvar={aoSalvar} aoApagar={aoApagar} />;
}

export default function Sono() {
  const base = useBase();
  return <PaginaAba>{base ? <ConteudoSono base={base} /> : <Esqueleto linhas={4} />}</PaginaAba>;
}
