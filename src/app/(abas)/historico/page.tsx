"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PaginaAba, TituloTela } from "@/componentes/estrutura";
import { BotaoIcone } from "@/componentes/ui/botao";
import { Icone } from "@/componentes/ui/icone";
import { Aviso, Esqueleto, Segmentado } from "@/componentes/ui/pecas";
import { useBase, type Base } from "@/lib/dados/base";
import { recordesDaSessao } from "@/lib/dominio/recordes";
import { GRUPOS, somaGrupo, volumeFeito } from "@/lib/dominio/volume";
import { MESES, chave, dataCurta, hojeK, inicioSemana, rotData, somarDias } from "@/lib/util/datas";
import { fmt, media, minTxt } from "@/lib/util/formato";

type Periodo = "semana" | "mes" | "tudo";

function periodo(p: Periodo, off: number) {
  const hoje = hojeK();
  if (p === "semana") {
    const ini = somarDias(inicioSemana(hoje), off * 7);
    const fim = somarDias(ini, 6);
    return { ini, fim, rot: `${rotData(ini)} a ${rotData(fim)}` };
  }
  if (p === "mes") {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + off);
    const f = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const nome = MESES[d.getMonth()]!;
    return { ini: chave(d), fim: chave(f), rot: `${nome.charAt(0).toUpperCase()}${nome.slice(1)} ${d.getFullYear()}` };
  }
  return { ini: "0000-00-00", fim: "9999-12-31", rot: "Tudo" };
}

function ConteudoHistorico({ base }: { base: Base }) {
  const [per, setPer] = useState<Periodo>("semana");
  const [off, setOff] = useState(0);
  const [filtro, setFiltro] = useState("todos");
  const p = periodo(per, off);
  const hoje = hojeK();

  const nomes = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of base.sessoes) if (s.treino_id) m.set(s.treino_id, s.nome);
    for (const t of base.treinos) m.set(t.id, t.nome);
    return m;
  }, [base]);

  const ss = base.sessoes.filter((s) => s.data >= p.ini && s.data <= p.fim && (filtro === "todos" || s.treino_id === filtro));
  const minutos = ss.reduce((t, s) => t + (s.duracao_min ?? 0), 0);
  const kcals = ss.map((s) => s.kcal).filter((k): k is number => k !== null);
  const noites = base.noites.filter((n) => n.data >= p.ini && n.data <= p.fim && n.data <= hoje).map((n) => n.horas);
  const sono = media(noites);
  const lateral = somaGrupo(volumeFeito(ss, base.proprios), GRUPOS[0]!);

  const nums: [string, string][] = [
    [String(ss.length), ss.length === 1 ? "treino" : "treinos"],
    [`${Math.floor(minutos / 60)}:${String(minutos % 60).padStart(2, "0")}`, "horas"],
    [kcals.length ? fmt(kcals.reduce((a, b) => a + b, 0), 0) : "—", "kcal"],
    [sono !== null ? `${fmt(sono)} h` : "—", "sono médio"],
    [fmt(lateral), "séries de lateral"],
    [ss.length ? `${Math.round(minutos / ss.length)} min` : "—", "por treino"],
  ];

  return (
    <>
      <TituloTela>Histórico</TituloTela>
      <Segmentado
        rotulo="Período"
        valor={per}
        aoMudar={(v) => {
          setPer(v);
          setOff(0);
        }}
        opcoes={[
          { valor: "semana", rotulo: "Semana" },
          { valor: "mes", rotulo: "Mês" },
          { valor: "tudo", rotulo: "Tudo" },
        ]}
      />
      {per !== "tudo" && (
        <div className="flex items-center justify-between">
          <BotaoIcone icone="prev" rotulo="Período anterior" onClick={() => setOff(off - 1)} />
          <span className="t-h2" aria-live="polite">
            {p.rot}
          </span>
          <BotaoIcone icone="next" rotulo="Próximo período" disabled={off >= 0} className="disabled:opacity-40" onClick={() => setOff(off + 1)} />
        </div>
      )}
      <label className="flex flex-col gap-2">
        <span className="t-destaque">Treino</span>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="t-corpo min-h-12 rounded-ctl bg-s2 px-4">
          <option value="todos">Todos os treinos</option>
          {[...nomes.entries()].map(([id, n]) => (
            <option key={id} value={id}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <dl className="grid grid-cols-3 gap-2">
        {nums.map(([v, r]) => (
          <div key={r} className="flex flex-col rounded-card bg-s1 p-3">
            <dd className="font-disp tab-num text-[1.75rem] leading-none font-extrabold">{v}</dd>
            <dt className="t-legenda text-mut">{r}</dt>
          </div>
        ))}
      </dl>
      <section className="flex flex-col gap-2" aria-label="Sessões">
        {ss.length === 0 ? (
          <Aviso tipo="info">Nenhuma sessão neste período. Quando você salvar um treino, ele aparece aqui.</Aviso>
        ) : (
          ss.map((s) => {
            const rec = s.tipo === "forca" ? recordesDaSessao(s, base.sessoes).length : 0;
            return (
              <Link key={s.id} href={`/historico/sessao/?id=${s.id}`} className="toque flex min-h-16 items-center gap-3 rounded-card bg-s1 px-4 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-ctl bg-s2">
                  <Icone nome={s.tipo === "cond" ? "clock" : "dumbbell"} tamanho={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="t-destaque truncate">{s.nome}</span>
                  <span className="t-legenda tab-num text-mut">
                    {dataCurta(s.data)}, {minTxt(s.duracao_min)}
                    {s.kcal !== null ? `, ${fmt(s.kcal, 0)} kcal` : ""}
                  </span>
                </span>
                {rec > 0 && (
                  <span className="t-legenda flex items-center gap-1 rounded-full bg-ac-tint px-2 py-1 font-semibold text-ac-tx">
                    <Icone nome="trofeu" tamanho={14} />
                    {rec}
                  </span>
                )}
                <Icone nome="next" tamanho={18} className="text-mut" />
              </Link>
            );
          })
        )}
      </section>
    </>
  );
}

export default function Historico() {
  const base = useBase();
  return <PaginaAba>{base ? <ConteudoHistorico base={base} /> : <Esqueleto linhas={4} />}</PaginaAba>;
}
