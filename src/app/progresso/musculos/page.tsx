"use client";

import { useState } from "react";
import { PaginaCheia } from "@/componentes/estrutura";
import { Corpo, CORES_MAPA } from "@/componentes/mapa-corpo";
import { Abertura } from "@/componentes/provedores";
import { BotaoIcone } from "@/componentes/ui/botao";
import { useBase } from "@/lib/dados/base";
import { GRUPOS, POUCO, metaDoGrupo, nivelMapa, somaGrupo, volumeFeito, volumePlanejado, type Grupo } from "@/lib/dominio/volume";
import { MES_AB, deChave, diaSemana, hojeK, inicioSemana, somarDias } from "@/lib/util/datas";
import { fmt } from "@/lib/util/formato";
import { cn } from "@/lib/util/cn";

export default function Musculos() {
  const base = useBase();
  const [off, setOff] = useState(0);
  const [sel, setSel] = useState<Grupo>(GRUPOS[0]!);
  if (!base) return <Abertura />;

  const hoje = hojeK();
  const ini = somarDias(inicioSemana(hoje), off * 7);
  const fim = somarDias(ini, 6);
  const ss = base.sessoes.filter((s) => s.data >= ini && s.data <= fim);
  const vol = volumeFeito(ss, base.proprios);
  const atual = off === 0;
  const feitoHoje = ss.some((s) => s.data === hoje);
  const dHoje = diaSemana(new Date());
  const restantes = atual
    ? base.semana
        .map((id, i) => ({ id, i }))
        .filter(({ id, i }) => id && (i > dHoje || (i === dHoje && !feitoHoje)))
        .map(({ id }) => base.treinoPorId.get(id!))
        .filter((t): t is NonNullable<typeof t> => !!t && t.tipo === "forca")
    : [];
  const prev = volumePlanejado(restantes, base.proprios);
  const series = ss.reduce((t, s) => t + s.exercicios.reduce((u, e) => u + e.series.length, 0), 0);
  const dias = new Set(ss.map((s) => s.data)).size;
  const planejados = base.semana.filter(Boolean).length;
  const a = deChave(ini);
  const b = deChave(fim);
  const rot = `${atual ? "Esta semana, " : off === -1 ? "Semana passada, " : ""}${a.getDate()}${a.getMonth() !== b.getMonth() ? ` ${MES_AB[a.getMonth()]}` : ""} a ${b.getDate()} de ${MES_AB[b.getMonth()]}`;

  const feitoSel = somaGrupo(vol, sel);
  const prevSel = somaGrupo(prev, sel);
  const metaSel = metaDoGrupo(sel);
  const textoSel = [
    atual && prevSel > 0 ? `Com o previsto até domingo chega a ${fmt(feitoSel + prevSel)}.` : null,
    metaSel ? `A meta é de ${metaSel.min} a ${metaSel.max}.` : "Sem meta: ele trabalha junto com outros exercícios.",
    feitoSel + prevSel < POUCO && metaSel ? `Menos de ${POUCO} séries quase não estimula o músculo.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const linha = (g: Grupo) => {
    const f = somaGrupo(vol, g);
    const p = somaGrupo(prev, g);
    const meta = metaDoGrupo(g);
    const max = Math.max(20, f + p); // mesma escala em todas as linhas
    return (
      <li key={g.nome}>
        <button type="button" onClick={() => setSel(g)} aria-pressed={sel.nome === g.nome} className={cn("grid min-h-12 w-full grid-cols-[minmax(0,8.5rem)_1fr_3.5rem] items-center gap-3 rounded-ctl px-2 text-left", sel.nome === g.nome && "bg-s2")}>
          <span className={cn("t-rotulo", g.tipo === "foco" && "font-semibold")}>{g.nome}</span>
          <span className="relative h-3" aria-hidden="true">
            {meta && <span className="absolute inset-y-0 rounded-full bg-s3" style={{ left: `${(meta.min / max) * 100}%`, width: `${((meta.max - meta.min) / max) * 100}%` }} />}
            <span className={cn("absolute inset-y-0 left-0 rounded-full", g.tipo === "semMeta" ? "bg-dim" : "bg-ac")} style={{ width: `${(f / max) * 100}%` }} />
            {p > 0 && <span className="absolute inset-y-0 rounded-full border border-dashed border-ac" style={{ left: `${(f / max) * 100}%`, width: `${(p / max) * 100}%` }} />}
          </span>
          <span className="flex flex-col items-end">
            <b className="t-destaque tab-num">{fmt(f)}</b>
            {atual && p > 0 && <span className="t-legenda tab-num text-mut">→ {fmt(f + p)}</span>}
          </span>
        </button>
      </li>
    );
  };

  return (
    <PaginaCheia voltar={{ href: "/progresso/" }} titulo="Músculos na semana">
      <div className="flex items-center justify-between gap-2">
        <BotaoIcone icone="prev" rotulo="Semana anterior" onClick={() => setOff(off - 1)} />
        <div className="flex flex-col items-center text-center" aria-live="polite">
          <span className="t-destaque">{rot}</span>
          <span className="t-legenda text-mut">
            {dias} de {planejados} treinos, {series} séries
          </span>
        </div>
        <BotaoIcone icone="next" rotulo="Próxima semana" disabled={off >= 0} className="disabled:opacity-40" onClick={() => setOff(off + 1)} />
      </div>
      <section className="flex flex-col gap-4 rounded-card bg-s1 p-4">
        <Corpo
          largura={120}
          legenda
          base="var(--mapa-base)"
          cor={(r) => (sel.regioes.includes(r) ? CORES_MAPA[Math.max(1, nivelMapa(vol[r] ?? 0))] : CORES_MAPA[nivelMapa(vol[r] ?? 0)])}
          rotulo={`Mapa muscular da semana. ${GRUPOS.map((g) => `${g.nome}: ${fmt(somaGrupo(vol, g))}`).join("; ")}.`}
        />
        <div className="flex flex-col gap-1" aria-hidden="true">
          <div className="grid grid-cols-5 gap-1">
            {CORES_MAPA.map((c, i) => (
              <span key={i} className="h-2.5 rounded-sm" style={{ background: c }} />
            ))}
          </div>
          <div className="t-legenda grid grid-cols-5 text-center text-mut">
            {["0", "1–4", "5–9", "10–14", "15+"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <span className="t-legenda text-center text-mut">séries feitas na semana</span>
        </div>
        <div className="flex items-center gap-3 rounded-ctl bg-s2 p-4" aria-live="polite">
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="t-destaque">{sel.nome}</span>
            <span className="t-rotulo text-tx2">{textoSel}</span>
          </span>
          <span className="t-numero">{fmt(feitoSel)}</span>
        </div>
      </section>
      <section className="flex flex-col gap-2 rounded-card bg-s1 p-3">
        <div className="t-legenda flex flex-wrap gap-x-4 gap-y-1 px-2 pt-1 text-mut" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-full bg-ac" /> feito
          </span>
          {atual && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-full border border-dashed border-ac" /> previsto até domingo
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-full bg-s3" /> meta
          </span>
        </div>
        <h2 className="t-legenda px-2 pt-2 font-semibold text-tx2">Foco do seu objetivo</h2>
        <ul>{GRUPOS.filter((g) => g.tipo === "foco").map(linha)}</ul>
        <h2 className="t-legenda border-t border-line px-2 pt-3 font-semibold text-tx2">Outros músculos</h2>
        <ul>{GRUPOS.filter((g) => g.tipo === "outro").map(linha)}</ul>
        <h2 className="t-legenda border-t border-line px-2 pt-3 font-semibold text-tx2">Sem meta</h2>
        <ul>{GRUPOS.filter((g) => g.tipo === "semMeta").map(linha)}</ul>
      </section>
      <p className="t-legenda text-mut">
        Cada série conta 1 para o músculo principal do exercício e meia para os auxiliares. Menos de {POUCO} séries na semana quase não estimula o músculo.
      </p>
    </PaginaCheia>
  );
}
