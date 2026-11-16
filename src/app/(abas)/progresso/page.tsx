"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PaginaAba, TituloTela } from "@/componentes/estrutura";
import { Figura, CORES_MAPA } from "@/componentes/mapa-corpo";
import { FolhaMedida } from "@/componentes/folha-medida";
import { Linha, type Ponto } from "@/componentes/graficos";
import { Botao } from "@/componentes/ui/botao";
import { Icone } from "@/componentes/ui/icone";
import { Cartao, Esqueleto } from "@/componentes/ui/pecas";
import { useAvisoCurto } from "@/componentes/ui/aviso-curto";
import { useBase, type Base } from "@/lib/dados/base";
import { e1rm } from "@/lib/dominio/recomendacao";
import { exInfo, nomeCurto } from "@/lib/dominio/exercicios";
import { PRINCIPAIS } from "@/lib/dominio/catalogo";
import { GRUPOS, META_FOCO, metaDoGrupo, nivelMapa, somaGrupo, volumeFeito, volumePlanejado, type Regiao } from "@/lib/dominio/volume";
import { MES_AB, deChave, diaSemana, hojeK, inicioSemana, rotData, somarDias, MESES } from "@/lib/util/datas";
import { fmt, fmtKg, media } from "@/lib/util/formato";
import { cn } from "@/lib/util/cn";

const tempo = (k: string) => deChave(k).getTime();

/** Rótulos de mês no eixo x (primeiro dia de cada mês no intervalo). */
function rotulosMeses(ini: string, fim: string) {
  const out: { x: number; rotulo: string }[] = [];
  const d = deChave(ini);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  while (d.getTime() <= tempo(fim)) {
    out.push({ x: d.getTime(), rotulo: MES_AB[d.getMonth()]! });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

function Delta({ v, casas = 1, unidade = "", inverter }: { v: number | null; casas?: number; unidade?: string; inverter?: boolean }) {
  if (v === null || !Number.isFinite(v)) return null;
  const txt = `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmt(Math.abs(v), casas)}${unidade}`;
  return <span className={cn("t-legenda", v === 0 ? "text-mut" : (v > 0) !== !!inverter ? "text-ok-tx" : "text-mut")}>{txt}</span>;
}

function ConteudoProgresso({ base }: { base: Base }) {
  const aviso = useAvisoCurto();
  const [medida, setMedida] = useState(false);
  const hoje = hojeK();
  const ini12 = somarDias(hoje, -84);
  const sem0 = inicioSemana(hoje);
  const forca = base.sessoes.filter((s) => s.tipo === "forca");

  const dados = useMemo(() => {
    const md = [...base.medidas].sort((a, b) => a.data.localeCompare(b.data));
    const razao = md.filter((m) => m.ombro_cm && m.cintura_cm).map((m) => ({ data: m.data, v: m.ombro_cm! / m.cintura_cm! }));
    const peso = md.filter((m) => m.peso_kg !== null).map((m) => ({ data: m.data, v: m.peso_kg! }));
    const cintura = md.filter((m) => m.cintura_cm !== null).map((m) => ({ data: m.data, v: m.cintura_cm! }));
    const ombro = md.filter((m) => m.ombro_cm !== null).map((m) => ({ data: m.data, v: m.ombro_cm! }));
    const daSemana = (ini: string) => base.sessoes.filter((s) => s.data >= ini && s.data <= somarDias(ini, 6));
    const estaSemana = daSemana(sem0);
    const anterior = daSemana(somarDias(sem0, -7));
    const vol = volumeFeito(estaSemana, base.proprios);
    // Previsto até domingo: treinos da semana nos dias que ainda vêm (hoje conta se ainda não treinou).
    const feitoHoje = estaSemana.some((s) => s.data === hoje);
    const restantes = base.semana
      .map((id, i) => ({ id, i }))
      .filter(({ id, i }) => id && (i > diaSemana(new Date()) || (i === diaSemana(new Date()) && !feitoHoje)))
      .map(({ id }) => base.treinoPorId.get(id!))
      .filter((t): t is NonNullable<typeof t> => !!t);
    const previsto = volumePlanejado(restantes, base.proprios);
    const noites = (ini: string) => media(base.noites.filter((n) => n.data >= ini && n.data <= somarDias(ini, 6)).map((n) => n.horas));
    const soma = (ss: typeof estaSemana, f: (s: (typeof estaSemana)[number]) => number | null) => ss.reduce((t, s) => t + (f(s) ?? 0), 0);
    return { razao, peso, cintura, ombro, estaSemana, anterior, vol, previsto, noites, soma };
  }, [base, hoje, sem0]);

  const vazio = !base.sessoes.length && !base.medidas.length;
  if (vazio) {
    return (
      <>
        <TituloTela>Progresso</TituloTela>
        <Cartao>
          <div className="flex items-center gap-4">
            <div className="flex gap-1" aria-hidden="true">
              <Figura lado="frente" largura={36} cor={() => "var(--mapa-0)"} base="var(--mapa-base)" />
              <Figura lado="costas" largura={36} cor={() => "var(--mapa-0)"} base="var(--mapa-base)" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="t-h2">Seu progresso começa no primeiro treino</h2>
              <p className="t-rotulo text-tx2">O corpo vai enchendo de laranja conforme você treina.</p>
            </div>
          </div>
          <ol className="flex flex-col">
            {[
              ["Trazer o histórico do app antigo", "Treinos, sono e medidas entram de uma vez.", <Link key="i" href="/importar/" className="toque t-destaque flex min-h-12 items-center gap-2 rounded-ctl bg-ac px-4 text-on-ac"><Icone nome="upload" tamanho={18} />Importar</Link>],
              ["Lançar a noite de sono", "Com 3 noites, a prontidão fica mais precisa.", null],
              ["Fazer o primeiro treino", "O mapa muscular aparece na hora.", null],
            ].map(([t, d, acao], i) => (
              <li key={i} className="flex items-center gap-3 border-t border-line py-3">
                <span className="t-rotulo flex size-8 shrink-0 items-center justify-center rounded-full bg-s2 font-bold">{i + 1}</span>
                <span className="flex flex-1 flex-col">
                  <span className="t-destaque">{t}</span>
                  <span className="t-rotulo text-tx2">{d}</span>
                </span>
                {acao}
              </li>
            ))}
          </ol>
        </Cartao>
        <Cartao>
          <h2 className="t-h2">Quando cada parte aparece</h2>
          {[
            ["Músculos na semana", "1º treino"],
            ["Carga nos principais", "2 semanas"],
            ["Ombro e cintura", "2 medidas"],
            ["Calibragem do sono", "4 semanas"],
          ].map(([a, b]) => (
            <p key={a} className="t-rotulo flex justify-between">
              <span>{a}</span>
              <b>{b}</b>
            </p>
          ))}
        </Cartao>
      </>
    );
  }

  const { razao, peso, cintura, ombro, estaSemana, anterior, vol, previsto, noites, soma } = dados;
  const ultR = razao[razao.length - 1];
  const r12 = razao.filter((x) => x.data >= ini12);
  const varR = r12.length > 1 ? r12[r12.length - 1]!.v - r12[0]!.v : null;
  const delta = (lista: { data: string; v: number }[]) => {
    const l = lista.filter((x) => x.data >= ini12);
    return l.length > 1 ? l[l.length - 1]!.v - l[0]!.v : null;
  };
  const foco = GRUPOS.filter((g) => g.tipo === "foco");
  const abaixo = GRUPOS.filter((g) => g.tipo === "outro" && somaGrupo(vol, g) + somaGrupo(previsto, g) < (metaDoGrupo(g)?.min ?? 0)).map((g) => g.curto);
  const planejados = base.semana.filter(Boolean).length;
  const diasFeitos = new Set(estaSemana.map((s) => s.data)).size;
  const diasAntes = new Set(anterior.map((s) => s.data)).size;
  const minA = soma(estaSemana, (s) => s.duracao_min);
  const minB = soma(anterior, (s) => s.duracao_min);
  const kA = soma(estaSemana, (s) => s.kcal);
  const kB = soma(anterior, (s) => s.kcal);
  const sA = noites(sem0);
  const sB = noites(somarDias(sem0, -7));
  const d0 = deChave(sem0);
  const d6 = deChave(somarDias(sem0, 6));
  const rotSemana = `${d0.getDate()}${d0.getMonth() !== d6.getMonth() ? ` de ${MESES[d0.getMonth()]}` : ""} a ${d6.getDate()} de ${MESES[d6.getMonth()]}`;

  const carga = PRINCIPAIS.map((id) => {
    const pts: Ponto[] = [];
    for (const s of [...forca].reverse()) {
      if (s.data < ini12) continue;
      const e = s.exercicios.find((x) => x.ex_chave === id);
      if (!e || !e.series.length) continue;
      const melhor = Math.max(...e.series.map((x) => e1rm({ kg: Number(x.kg), reps: x.reps, rir: x.rir })));
      if (melhor > 0) pts.push({ x: tempo(s.data), y: melhor });
    }
    return { id, pts };
  }).filter((c) => c.pts.length > 0);

  const ptos = (l: { data: string; v: number }[]) => l.filter((x) => x.data >= ini12).map((x) => ({ x: tempo(x.data), y: x.v }));

  return (
    <>
      <TituloTela>Progresso</TituloTela>

      <section className="flex flex-col gap-4 rounded-card bg-s1 p-4 outline-2 outline-ac" aria-label="Seu objetivo">
        <span className="t-rotulo flex items-center gap-2 font-semibold text-ac-tx">
          <Icone nome="target" tamanho={18} /> Seu objetivo
        </span>
        <h2 className="t-h1">Ombros largos, cintura fina</h2>
        {ultR ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-disp tab-num text-[3.5rem] leading-none font-extrabold">{fmt(ultR.v, 2)}</span>
                <span className="t-rotulo text-tx2">ombro dividido pela cintura</span>
              </div>
              <div className="t-rotulo flex flex-col items-end text-right text-tx2">
                {varR !== null && (
                  <span>
                    <b className="text-tx">{`${varR >= 0 ? "+" : "−"}${fmt(Math.abs(varR), 2)}`}</b> em 12 semanas
                  </span>
                )}
                {ombro.length > 0 && (
                  <span>
                    ombro {fmt(ombro[ombro.length - 1]!.v)} cm{delta(ombro) !== null ? `, ${delta(ombro)! >= 0 ? "+" : "−"}${fmt(Math.abs(delta(ombro)!))}` : ""}
                  </span>
                )}
                {cintura.length > 0 && (
                  <span>
                    cintura {fmt(cintura[cintura.length - 1]!.v)} cm{delta(cintura) !== null ? `, ${delta(cintura)! >= 0 ? "+" : "−"}${fmt(Math.abs(delta(cintura)!))}` : ""}
                  </span>
                )}
              </div>
            </div>
            {r12.length > 1 && (
              <Linha
                pontos={r12.map((x) => ({ x: tempo(x.data), y: x.v }))}
                rotulosX={rotulosMeses(r12[0]!.data, hoje)}
                casas={2}
                resumo={`Ombro dividido pela cintura nas últimas 12 semanas: de ${fmt(r12[0]!.v, 2)} para ${fmt(ultR.v, 2)}.`}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="t-rotulo text-tx2">Meça ombro e cintura para acompanhar a proporção que mais muda o visual do V.</p>
            <Botao tipo="secundario" icone="regua" onClick={() => setMedida(true)}>
              Medir ombro e cintura
            </Botao>
          </div>
        )}
        <div className="flex flex-col gap-3 border-t border-line pt-3">
          <span className="t-rotulo text-tx2">
            Séries nesta semana, meta {META_FOCO.min} a {META_FOCO.max}
          </span>
          {foco.map((g) => {
            const feito = somaGrupo(vol, g);
            const prev = somaGrupo(previsto, g);
            const max = Math.max(META_FOCO.max, feito + prev);
            return (
              <div key={g.nome} className="grid grid-cols-[1fr_1.2fr_auto] items-center gap-3">
                <span className="t-destaque">{g.nome}</span>
                <span className="relative h-3 rounded-full bg-s3" aria-hidden="true">
                  <span className="absolute inset-y-0 left-0 rounded-full bg-ac" style={{ width: `${(feito / max) * 100}%` }} />
                  <span
                    className="absolute inset-y-0 rounded-full border border-dashed border-ac"
                    style={{ left: `${(feito / max) * 100}%`, width: `${(prev / max) * 100}%` }}
                  />
                </span>
                <span className="t-rotulo tab-num">
                  <b>{fmt(feito)}</b> de {META_FOCO.min}–{META_FOCO.max}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <Link href="/progresso/musculos/" className="toque flex items-center gap-4 rounded-card bg-s1 p-4">
        <div className="flex gap-1" aria-hidden="true">
          <Figura lado="frente" largura={34} cor={(r: Regiao) => CORES_MAPA[nivelMapa(vol[r] ?? 0)]} base="var(--mapa-base)" />
          <Figura lado="costas" largura={34} cor={(r: Regiao) => CORES_MAPA[nivelMapa(vol[r] ?? 0)]} base="var(--mapa-base)" />
        </div>
        <span className="flex flex-1 flex-col gap-1">
          <span className="t-h2">Músculos na semana</span>
          <span className="t-rotulo text-tx2">
            {diasFeitos} de {planejados} treinos.{abaixo.length ? ` Abaixo da meta: ${abaixo.join(", ")}.` : " Tudo dentro da meta até domingo."}
          </span>
        </span>
        <Icone nome="next" tamanho={20} className="text-mut" />
      </Link>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="t-h1">Semana em números</h2>
          <p className="t-rotulo text-mut">{rotSemana}, comparado com a semana anterior</p>
        </div>
        <dl className="grid grid-cols-2 gap-2">
          {(
            [
              ["Treinos", `${diasFeitos} de ${planejados}`, diasFeitos === diasAntes ? <span className="t-legenda text-mut">igual</span> : <Delta v={diasFeitos - diasAntes} casas={0} />],
              ["Tempo treinando", `${fmt(minA / 60)} h`, <Delta key="t" v={(minA - minB) / 60} unidade=" h" />],
              ["Kcal do relógio", kA ? fmt(kA, 0) : "—", kA && kB ? <Delta key="k" v={kA - kB} casas={0} /> : null],
              ["Sono médio", sA !== null ? `${fmt(sA)} h` : "—", sA !== null && sB !== null ? <Delta key="s" v={sA - sB} unidade=" h" /> : null],
            ] as const
          ).map(([r, v, d]) => (
            <div key={r} className="flex flex-col gap-1 rounded-card bg-s1 p-4">
              <dt className="t-rotulo text-tx2">{r}</dt>
              <dd className="t-numero">{v}</dd>
              {d}
            </div>
          ))}
        </dl>
      </section>

      {carga.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="t-h1">Carga nos principais</h2>
            <p className="t-rotulo text-mut">1RM estimado com o RIR, últimas 12 semanas</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {carga.map(({ id, pts }) => {
              const info = exInfo(id, base.proprios);
              const ult = pts[pts.length - 1]!.y;
              const var12 = pts.length > 1 ? Math.round(((ult - pts[0]!.y) / pts[0]!.y) * 100) : null;
              return (
                <div key={id} className="flex flex-col gap-1 rounded-card bg-s1 p-3">
                  <span className="t-destaque">{nomeCurto(info.nome)}</span>
                  <span className="flex items-baseline gap-1">
                    <span className="font-disp tab-num text-[1.75rem] leading-none font-extrabold">{fmtKg(Math.round(ult * 10) / 10)}</span>
                    <span className="t-legenda text-mut">{info.equip === "Halteres" ? "kg por halter" : "kg"}</span>
                  </span>
                  {var12 !== null && <span className="t-legenda text-mut">{`${var12 >= 0 ? "+" : "−"}${Math.abs(var12)}% em 12 semanas`}</span>}
                  {pts.length > 1 ? (
                    <Linha pontos={pts} rotulosX={[]} casas={0} altura={90} resumo={`${info.nome}: 1RM estimado foi de ${fmt(pts[0]!.y, 1)} para ${fmt(ult, 1)} kg.`} />
                  ) : (
                    <span className="t-legenda text-mut">O gráfico aparece a partir do segundo treino.</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="t-h1">Peso e cintura</h2>
          <Botao tipo="discreto" onClick={() => setMedida(true)}>
            + Medida
          </Botao>
        </div>
        <Cartao>
          {(
            [
              ["Peso", peso, "kg"],
              ["Cintura", cintura, "cm"],
            ] as const
          ).map(([nome, lista, un]) => {
            const p = ptos(lista);
            const ult = lista[lista.length - 1];
            const d = delta(lista);
            return (
              <div key={nome} className="flex flex-col gap-2 border-b border-line pb-3 last:border-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="t-destaque">{nome}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="t-h1 tab-num">{ult ? `${fmt(ult.v)} ${un}` : "—"}</span>
                    {d !== null && <span className="t-legenda text-mut">{`${d >= 0 ? "+" : "−"}${fmt(Math.abs(d))} em 12 semanas`}</span>}
                  </span>
                </div>
                {p.length > 1 ? (
                  <Linha pontos={p} media rotulosX={rotulosMeses(lista.find((x) => x.data >= ini12)!.data, hoje)} resumo={`${nome} nas últimas 12 semanas.`} />
                ) : (
                  <p className="t-legenda text-mut">{ult ? "Com a segunda medida aparece a linha." : "Sem medidas ainda."}</p>
                )}
              </div>
            );
          })}
          <p className="t-legenda text-mut">Pontos: cada medida. Linha: média das 3 últimas, para tirar o vai e vem do dia a dia.</p>
        </Cartao>
        {base.medidas.length > 0 && (
          <p className="t-legenda text-mut">
            Última medida em {rotData(base.medidas[base.medidas.length - 1]!.data)}. Para apagar uma medida, use Ajustes › Medidas.
          </p>
        )}
      </section>
      {medida && <FolhaMedida aberta={medida} aoMudar={setMedida} aoSalvar={() => aviso("Medida salva.")} />}
    </>
  );
}

export default function Progresso() {
  const base = useBase();
  return <PaginaAba>{base ? <ConteudoProgresso base={base} /> : <Esqueleto linhas={5} />}</PaginaAba>;
}

