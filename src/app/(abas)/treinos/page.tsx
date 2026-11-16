"use client";

import Link from "next/link";
import { useState } from "react";
import { PaginaAba, TituloTela } from "@/componentes/estrutura";
import { Figura } from "@/componentes/mapa-corpo";
import { Icone } from "@/componentes/ui/icone";
import { Aviso, Esqueleto, Folha } from "@/componentes/ui/pecas";
import { useBase, type Base } from "@/lib/dados/base";
import { salvarSemana } from "@/lib/dados/repo";
import { avisosSemana, descricaoTreino } from "@/lib/dominio/semana";
import { situacaoRampa } from "@/lib/dominio/modelos";
import { regioesDoTreino, type Regiao } from "@/lib/dominio/volume";
import type { Treino } from "@/lib/dominio/tipos";
import { DIAS_AB, DIAS_L, hojeK } from "@/lib/util/datas";
import { cn } from "@/lib/util/cn";

function MiniMapa({ t, base }: { t: Treino; base: Base }) {
  if (t.tipo !== "forca") return <Icone nome="clock" tamanho={22} className="text-mut" />;
  const { prim, sec } = regioesDoTreino(t, base.proprios);
  const cor = (r: Regiao) => (prim.has(r) ? "var(--mapa-4)" : sec.has(r) ? "var(--mapa-2)" : "var(--mapa-0)");
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      <Figura lado="frente" largura={16} cor={cor} base="var(--mapa-base)" />
      <Figura lado="costas" largura={16} cor={cor} base="var(--mapa-base)" />
    </span>
  );
}

function ItemTreino({ t, base }: { t: Treino; base: Base }) {
  return (
    <Link href={`/treinos/editar/?id=${t.id}`} className="toque flex min-h-16 items-center gap-3 rounded-card bg-s1 px-4 py-3">
      <span className="flex w-9 shrink-0 justify-center">
        <MiniMapa t={t} base={base} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="t-destaque">{t.nome}</span>
        <span className="t-legenda text-mut">{descricaoTreino(t, base.regras)}</span>
      </span>
      <Icone nome="next" tamanho={18} className="text-mut" />
    </Link>
  );
}

function ConteudoTreinos({ base }: { base: Base }) {
  const [dia, setDia] = useState<number | null>(null);
  const avisos = avisosSemana(base.semana, base.treinos, base.proprios);
  const naSemana = new Set(base.semana.filter(Boolean) as string[]);
  const usados = base.treinos.filter((t) => naSemana.has(t.id));
  const guardados = base.treinos.filter((t) => !naSemana.has(t.id));
  const rampa = situacaoRampa(base.perfil.modelo, hojeK());

  return (
    <>
      <TituloTela>Treinos</TituloTela>
      {rampa && !rampa.pronta && (
        <Aviso tipo="info" icone="target" titulo={`Dimorfismo 5x · evidência, semana ${rampa.semana} de 2 da adaptação.`}>
          O plano completo libera em {14 - rampa.dias} {14 - rampa.dias === 1 ? "dia" : "dias"}, no Hoje.
        </Aviso>
      )}
      <section className="flex flex-col gap-3">
        <h2 className="t-h1">Sua semana</h2>
        <ul className="flex flex-col rounded-card bg-s1">
          {base.semana.map((id, i) => {
            const t = id ? base.treinoPorId.get(id) : undefined;
            return (
              <li key={i} className="border-b border-line last:border-0">
                <button type="button" onClick={() => setDia(i)} className="flex min-h-14 w-full items-center gap-3 px-4 text-left" aria-label={`${DIAS_L[i]}: ${t ? t.nome : "descanso"}. Trocar`}>
                  <span className="t-rotulo w-10 text-mut">{DIAS_AB[i]}</span>
                  <span className={cn("t-destaque flex-1", !t && "font-medium text-mut")}>{t ? t.nome : "Descanso"}</span>
                  {t?.tipo === "cond" && <span className="t-legenda rounded-full bg-s2 px-2 py-1">Condicionamento</span>}
                  <Icone nome="next" tamanho={18} className="text-mut" />
                </button>
              </li>
            );
          })}
        </ul>
        {avisos.length > 0 && (
          <Aviso tipo="offline" icone="alerta" titulo="Atenção à recuperação.">
            {avisos.join(". ")}. Coloque um dia de descanso ou um treino leve entre eles.
          </Aviso>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="t-h1">Meus treinos</h2>
        {usados.map((t) => (
          <ItemTreino key={t.id} t={t} base={base} />
        ))}
        {guardados.length > 0 && (
          <>
            <h3 className="t-rotulo pt-2 text-mut">Fora da semana (guardados)</h3>
            {guardados.map((t) => (
              <ItemTreino key={t.id} t={t} base={base} />
            ))}
          </>
        )}
        {!base.treinos.length && <Aviso tipo="info">Nenhum treino ainda. Crie um ou use um plano pronto.</Aviso>}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/treinos/editar/?novo=forca" className="toque t-destaque flex min-h-12 items-center justify-center gap-2 rounded-ctl bg-s2 px-3 text-center">
            <Icone nome="mais" tamanho={18} /> Musculação
          </Link>
          <Link href="/treinos/editar/?novo=cond" className="toque t-destaque flex min-h-12 items-center justify-center gap-2 rounded-ctl bg-s2 px-3 text-center">
            <Icone nome="mais" tamanho={18} /> Condicionamento
          </Link>
        </div>
      </section>

      <nav className="flex flex-col rounded-card bg-s1" aria-label="Mais">
        {(
          [
            ["/treinos/modelos/", "target", "Planos prontos", "Dimorfismo 5x · evidência e outros"],
            ["/biblioteca/", "dumbbell", "Biblioteca de exercícios", "Como fazer, erros comuns e seu histórico"],
          ] as const
        ).map(([href, ic, t, d]) => (
          <Link key={href} href={href} className="flex min-h-16 items-center gap-3 border-b border-line px-4 py-3 last:border-0">
            <Icone nome={ic} className="text-mut" />
            <span className="flex flex-1 flex-col">
              <span className="t-destaque">{t}</span>
              <span className="t-legenda text-mut">{d}</span>
            </span>
            <Icone nome="next" tamanho={18} className="text-mut" />
          </Link>
        ))}
      </nav>

      <Folha aberta={dia !== null} aoMudar={(v) => !v && setDia(null)} titulo={dia !== null ? DIAS_L[dia]! : ""} rotuloCancelar="Fechar">
        {[null, ...base.treinos.map((t) => t.id)].map((id) => {
          const t = id ? base.treinoPorId.get(id) : null;
          const atual = dia !== null && (base.semana[dia] ?? null) === id;
          return (
            <button
              key={id ?? "descanso"}
              type="button"
              aria-pressed={atual}
              onClick={async () => {
                if (dia === null) return;
                await salvarSemana([{ dia, treino_id: id }]);
                setDia(null);
              }}
              className={cn("toque flex min-h-14 items-center justify-between gap-3 rounded-ctl px-4 text-left", atual ? "bg-ac text-on-ac" : "bg-s2")}
            >
              <span className="flex flex-col">
                <span className="t-destaque">{t ? t.nome : "Descanso"}</span>
                {t && <span className={cn("t-legenda", atual ? "text-on-ac" : "text-mut")}>{descricaoTreino(t, base.regras)}</span>}
              </span>
              {atual && <Icone nome="check" tamanho={18} />}
            </button>
          );
        })}
      </Folha>
    </>
  );
}

export default function Treinos() {
  const base = useBase();
  return <PaginaAba>{base ? <ConteudoTreinos base={base} /> : <Esqueleto linhas={5} />}</PaginaAba>;
}
