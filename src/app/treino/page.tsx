"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TreinoForca } from "@/componentes/treino/forca";
import { TreinoCond } from "@/componentes/treino/cond";
import { TelaDescanso } from "@/componentes/treino/descanso";
import { bipar, liberarSom, useAgora, useFimDoTempo, useTelaAcesa } from "@/componentes/treino/uteis";
import { Abertura } from "@/componentes/provedores";
import { BotaoIcone } from "@/componentes/ui/botao";
import { Confirmar } from "@/componentes/ui/pecas";
import { useAvisoCurto } from "@/componentes/ui/aviso-curto";
import { useBase } from "@/lib/dados/base";
import { descartarRascunho, salvarConfig, salvarRascunho } from "@/lib/dados/repo";
import { exInfo } from "@/lib/dominio/exercicios";
import { recordesAte } from "@/lib/dominio/recordes";
import type { SessaoAtiva } from "@/lib/dominio/tipos";
import { fmtKg, mmss } from "@/lib/util/formato";

export default function Treino() {
  const router = useRouter();
  const base = useBase();
  const aviso = useAvisoCurto();
  const [a, setA] = useState<SessaoAtiva | null>(null);
  const [lista, setLista] = useState(false);
  const [descartar, setDescartar] = useState(false);
  const agora = useAgora(250);

  // O estado da tela espelha o rascunho do celular; cada mudança grava de novo.
  if (base?.rascunho && (!a || a.sessao_id !== base.rascunho.sessao_id)) setA(base.rascunho);
  useEffect(() => {
    if (base && !base.rascunho && !a) router.replace("/");
  }, [base, a, router]);

  useTelaAcesa(!!a);

  const mudar = useCallback((novo: SessaoAtiva) => {
    setA(novo);
    void salvarRascunho(novo);
  }, []);

  const recordes = useMemo(() => (base ? recordesAte(base.sessoes) : {}), [base]);
  const som = base?.config.som_descanso ?? true;

  const fimDescanso = a?.descanso_fim ?? null;
  useFimDoTempo(
    fimDescanso,
    agora,
    useCallback(() => {
      if (som) bipar();
    }, [som]),
  );

  if (!base || !a) return <Abertura texto="Abrindo o treino…" />;

  const descansando = !!a.descanso_fim && a.descanso_fim > agora;
  const totalDescanso = a.tipo === "forca" ? (a.descanso_total ?? 0) : a.descanso;

  let seguir: { titulo: string; sub: string } | null = null;
  if (a.tipo === "forca") {
    const ex = a.exercicios[a.idx];
    const si = ex ? ex.series.findIndex((s) => !s.feita) : -1;
    if (ex && si >= 0) {
      const s = ex.series[si]!;
      seguir = { titulo: `Série ${si + 1} · ${s.kg ? `${fmtKg(s.kg)} kg × ` : ""}${s.reps ?? ""}`, sub: exInfo(ex.ex_chave, base.proprios).nome };
    }
  } else {
    const e = a.estacoes[a.pos.i];
    if (e) seguir = { titulo: `Volta ${a.pos.v + 1} · ${e.nome}`, sub: e.alvo ?? "" };
  }

  const ajustarDescanso = (s: number) => {
    if (!a.descanso_fim) return;
    const fim = Math.max(Date.now() + 1000, a.descanso_fim + s * 1000);
    mudar({ ...a, descanso_fim: fim, ...(a.tipo === "forca" ? { descanso_total: Math.max(0, (a.descanso_total ?? 0) + s) } : {}) } as SessaoAtiva);
  };

  const fechar = () => router.push("/treino/fechar/");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-4 px-5 pt-seguro pb-seguro" onPointerDown={liberarSom}>
      <div className="grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 pt-1">
        <BotaoIcone icone="x" rotulo="Voltar para Hoje (o treino continua aberto)" onClick={() => router.push("/")} />
        <div className="flex min-w-0 flex-col items-center">
          <span className="t-destaque max-w-full truncate">{a.nome}</span>
          <span className="t-legenda tab-num text-mut">{mmss((agora - a.inicio) / 1000)}</span>
        </div>
        {a.tipo === "forca" ? <BotaoIcone icone="lista" rotulo="Exercícios e opções do treino" onClick={() => setLista(true)} /> : <span />}
      </div>

      {a.tipo === "forca" ? (
        <TreinoForca
          a={a}
          proprios={base.proprios}
          regras={base.regras}
          recordes={recordes}
          aoMudar={mudar}
          aoAviso={aviso}
          aoFechar={fechar}
          aoDescartar={() => setDescartar(true)}
          lista={lista}
          aoLista={setLista}
        />
      ) : (
        <TreinoCond a={a} agora={agora} aoMudar={mudar} aoFechar={fechar} aoDescartar={() => setDescartar(true)} />
      )}

      {descansando && (
        <TelaDescanso
          restante={Math.ceil((a.descanso_fim! - agora) / 1000)}
          total={totalDescanso}
          seguir={seguir}
          som={som}
          aoTrocarSom={() => salvarConfig({ som_descanso: !som })}
          aoAjustar={ajustarDescanso}
          aoPular={() => mudar({ ...a, descanso_fim: null } as SessaoAtiva)}
        />
      )}

      <Confirmar
        aberta={descartar}
        aoMudar={setDescartar}
        titulo="Descartar o treino?"
        texto="As séries deste treino não serão salvas."
        sim="Descartar"
        perigo
        aoConfirmar={async () => {
          await descartarRascunho();
          router.replace("/");
        }}
      />
    </main>
  );
}
