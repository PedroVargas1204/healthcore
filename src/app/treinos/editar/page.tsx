"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PaginaCheia } from "@/componentes/estrutura";
import { ListaExercicios } from "@/componentes/lista-exercicios";
import { Abertura } from "@/componentes/provedores";
import { Botao, BotaoIcone } from "@/componentes/ui/botao";
import { AreaTexto, Aviso, Confirmar, Folha, Interruptor } from "@/componentes/ui/pecas";
import { useAvisoCurto } from "@/componentes/ui/aviso-curto";
import { useBase } from "@/lib/dados/base";
import { apagarRegistro, novoId, salvarRegistro } from "@/lib/dados/repo";
import { exInfo } from "@/lib/dominio/exercicios";
import { descansoPadrao } from "@/lib/dominio/semana";
import type { Tag, Treino, TreinoExercicio } from "@/lib/dominio/tipos";
import { mmss } from "@/lib/util/formato";
import { cn } from "@/lib/util/cn";

function Contador({ valor, rotulo, aoMudar, passo = 1, min, max, formato }: { valor: number; rotulo: string; aoMudar: (v: number) => void; passo?: number; min: number; max: number; formato?: (v: number) => string }) {
  return (
    <div className="flex items-center gap-2">
      <BotaoIcone icone="menos" rotulo={`Menos ${rotulo}`} disabled={valor <= min} className="disabled:opacity-40" onClick={() => aoMudar(Math.max(min, valor - passo))} />
      <span className="t-destaque tab-num min-w-14 text-center">{formato ? formato(valor) : valor}</span>
      <BotaoIcone icone="mais" rotulo={`Mais ${rotulo}`} disabled={valor >= max} className="disabled:opacity-40" onClick={() => aoMudar(Math.min(max, valor + passo))} />
    </div>
  );
}

function Editor() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const novo = params.get("novo") as "forca" | "cond" | null;
  const base = useBase();
  const aviso = useAvisoCurto();
  const [t, setT] = useState<Treino | null>(null);
  const [escolher, setEscolher] = useState(false);
  const [excluir, setExcluir] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!base || t) return;
    if (id) {
      const x = base.treinoPorId.get(id);
      if (x) setT(structuredClone(x));
    } else if (novo) {
      setT({
        id: novoId(),
        nome: "",
        tipo: novo,
        tags: [],
        voltas: novo === "cond" ? 3 : null,
        descanso_voltas_s: novo === "cond" ? 60 : null,
        finalizador_id: null,
        obs: null,
        posicao: base.treinos.length,
        exercicios: [],
        estacoes: [],
      });
    }
  }, [base, id, novo, t]);

  if (!base) return <Abertura />;
  if (!t)
    return (
      <PaginaCheia voltar={{ href: "/treinos/" }}>
        <p className="t-corpo">Treino não encontrado.</p>
      </PaginaCheia>
    );

  const mudar = (m: Partial<Treino>) => setT({ ...t, ...m });
  const mudarEx = (i: number, m: Partial<TreinoExercicio>) => mudar({ exercicios: t.exercicios.map((e, j) => (j === i ? { ...e, ...m } : e)) });
  const mover = <T,>(lista: T[], i: number, d: number) => {
    const l = [...lista];
    const [x] = l.splice(i, 1);
    l.splice(i + d, 0, x!);
    return l;
  };
  const tag = (x: Tag) => mudar({ tags: t.tags.includes(x) ? t.tags.filter((y) => y !== x) : [...t.tags, x] });
  const conds = base.treinos.filter((x) => x.tipo === "cond" && x.id !== t.id);

  async function salvar() {
    if (!t) return;
    if (!t.nome.trim()) return setErro("Dê um nome ao treino.");
    if (t.tipo === "cond" && t.estacoes.some((e) => !e.nome.trim())) return setErro("Toda estação precisa de um nome.");
    await salvarRegistro("treinos", { ...t, nome: t.nome.trim().slice(0, 60), estacoes: t.estacoes.map((e) => ({ ...e, nome: e.nome.trim() })) });
    aviso(id ? "Treino salvo." : "Treino criado.");
    router.replace("/treinos/");
  }

  return (
    <PaginaCheia
      voltar={{ href: "/treinos/", rotulo: "Cancelar" }}
      titulo={id ? "Editar treino" : t.tipo === "cond" ? "Novo condicionamento" : "Novo treino"}
      acao={
        <button type="button" onClick={salvar} className="t-destaque min-h-11 px-1 text-ac-tx">
          Salvar
        </button>
      }
    >
      <label className="flex flex-col gap-2">
        <span className="t-destaque">Nome</span>
        <input value={t.nome} maxLength={60} onChange={(e) => mudar({ nome: e.target.value })} className="t-corpo min-h-12 rounded-ctl bg-s2 px-4" placeholder={t.tipo === "cond" ? "Ex.: Hyrox curto" : "Ex.: Costas + ombro"} />
      </label>

      <div className="flex flex-col rounded-card bg-s1 px-4 py-1">
        {t.tipo === "forca" ? (
          <>
            <Interruptor marcado={t.tags.includes("pernas")} aoMudar={() => tag("pernas")} rotulo="Treino pesado de pernas" descricao="Avisa se cair perto de um Hyrox" />
            <label className="flex min-h-12 items-center gap-3 border-t border-line">
              <span className="t-corpo flex-1">Finalizador</span>
              <select value={t.finalizador_id ?? ""} onChange={(e) => mudar({ finalizador_id: e.target.value || null })} className="t-rotulo min-h-11 max-w-[60%] rounded-ctl bg-s2 px-3">
                <option value="">Nenhum</option>
                {conds.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <Interruptor marcado={t.tags.includes("hyrox")} aoMudar={() => tag("hyrox")} rotulo="Condicionamento intenso (estilo Hyrox)" descricao="Avisa se cair ao lado de pernas pesadas ou de ombro e costas" />
            <div className="flex min-h-14 items-center justify-between border-t border-line">
              <span className="t-corpo">Voltas</span>
              <Contador valor={t.voltas ?? 1} rotulo="voltas" min={1} max={20} aoMudar={(v) => mudar({ voltas: v })} />
            </div>
            <div className="flex min-h-14 items-center justify-between border-t border-line">
              <span className="t-corpo">Descanso entre voltas</span>
              <Contador valor={t.descanso_voltas_s ?? 0} rotulo="15 segundos de descanso" passo={15} min={0} max={600} formato={mmss} aoMudar={(v) => mudar({ descanso_voltas_s: v })} />
            </div>
          </>
        )}
      </div>

      {t.tipo === "cond" && <AreaTexto rotulo="Observação" maxLength={500} value={t.obs ?? ""} onChange={(e) => mudar({ obs: e.target.value || null })} />}

      {t.tipo === "forca" ? (
        <section className="flex flex-col gap-3">
          <h2 className="t-h1">Exercícios</h2>
          {!t.exercicios.length && <Aviso tipo="info">Nenhum exercício ainda.</Aviso>}
          {t.exercicios.map((e, i) => (
            <div key={`${e.ex_chave}-${i}`} className="flex flex-col gap-3 rounded-card bg-s1 p-4">
              <div className="flex items-center gap-1">
                <span className="t-h2 flex-1">{exInfo(e.ex_chave, base.proprios).nome}</span>
                <BotaoIcone icone="up" plano rotulo="Subir" disabled={i === 0} className="disabled:opacity-30" onClick={() => mudar({ exercicios: mover(t.exercicios, i, -1) })} />
                <BotaoIcone icone="down" plano rotulo="Descer" disabled={i === t.exercicios.length - 1} className="disabled:opacity-30" onClick={() => mudar({ exercicios: mover(t.exercicios, i, 1) })} />
                <BotaoIcone icone="x" plano rotulo={`Remover ${exInfo(e.ex_chave, base.proprios).nome}`} onClick={() => mudar({ exercicios: t.exercicios.filter((_, j) => j !== i) })} />
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-ctl bg-s2 p-1" role="radiogroup" aria-label="Tipo">
                {(["comp", "iso"] as const).map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={e.cat === c} onClick={() => mudarEx(i, { cat: c })} className={cn("t-rotulo min-h-11 rounded-[6px]", e.cat === c ? "bg-s1 font-semibold" : "text-mut")}>
                    {c === "comp" ? "Composto" : "Isolado"}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="t-rotulo text-mut">Séries</span>
                <Contador valor={e.series} rotulo="séries" min={1} max={10} aoMudar={(v) => mudarEx(i, { series: v })} />
              </div>
              <div className="flex items-center justify-between">
                <span className="t-rotulo text-mut">Descanso</span>
                <Contador
                  valor={e.descanso_s ?? descansoPadrao(e.cat, base.regras)}
                  rotulo="15 segundos de descanso"
                  passo={15}
                  min={15}
                  max={600}
                  formato={mmss}
                  aoMudar={(v) => mudarEx(i, { descanso_s: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="t-legenda text-mut">Reps, tempo ou distância</span>
                  <input value={e.reps} maxLength={20} onChange={(ev) => mudarEx(i, { reps: ev.target.value })} placeholder="8-10, 40 s" className="t-corpo min-h-12 rounded-ctl bg-s2 px-3" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="t-legenda text-mut">Observação</span>
                  <input value={e.obs ?? ""} maxLength={200} onChange={(ev) => mudarEx(i, { obs: ev.target.value || null })} placeholder="Drop set" className="t-corpo min-h-12 rounded-ctl bg-s2 px-3" />
                </label>
              </div>
            </div>
          ))}
          <Botao tipo="secundario" icone="mais" onClick={() => setEscolher(true)}>
            Adicionar exercício
          </Botao>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="t-h1">Estações</h2>
          {!t.estacoes.length && <Aviso tipo="info">Nenhuma estação ainda.</Aviso>}
          {t.estacoes.map((e, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-card bg-s1 p-4">
              <div className="flex items-center gap-1">
                <span className="t-rotulo flex-1 text-mut">Estação {i + 1}</span>
                <BotaoIcone icone="up" plano rotulo="Subir" disabled={i === 0} className="disabled:opacity-30" onClick={() => mudar({ estacoes: mover(t.estacoes, i, -1) })} />
                <BotaoIcone icone="down" plano rotulo="Descer" disabled={i === t.estacoes.length - 1} className="disabled:opacity-30" onClick={() => mudar({ estacoes: mover(t.estacoes, i, 1) })} />
                <BotaoIcone icone="x" plano rotulo="Remover estação" onClick={() => mudar({ estacoes: t.estacoes.filter((_, j) => j !== i) })} />
              </div>
              <div className="grid grid-cols-[1.4fr_1fr] gap-2">
                <input aria-label="Exercício" value={e.nome} maxLength={60} placeholder="Exercício" onChange={(ev) => mudar({ estacoes: t.estacoes.map((x, j) => (j === i ? { ...x, nome: ev.target.value } : x)) })} className="t-corpo min-h-12 rounded-ctl bg-s2 px-3" />
                <input aria-label="Meta" value={e.alvo ?? ""} maxLength={40} placeholder="500 m" onChange={(ev) => mudar({ estacoes: t.estacoes.map((x, j) => (j === i ? { ...x, alvo: ev.target.value || null } : x)) })} className="t-corpo min-h-12 rounded-ctl bg-s2 px-3" />
              </div>
              <input aria-label="Substituto se faltar equipamento" value={e.substituto ?? ""} maxLength={160} placeholder="Substituto se faltar equipamento" onChange={(ev) => mudar({ estacoes: t.estacoes.map((x, j) => (j === i ? { ...x, substituto: ev.target.value || null } : x)) })} className="t-rotulo min-h-12 rounded-ctl bg-s2 px-3" />
            </div>
          ))}
          <Botao tipo="secundario" icone="mais" onClick={() => mudar({ estacoes: [...t.estacoes, { nome: "", alvo: null, substituto: null }] })}>
            Adicionar estação
          </Botao>
        </section>
      )}

      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Botao largura="cheia" onClick={salvar}>
        Salvar treino
      </Botao>
      {id && (
        <div className="grid grid-cols-2 gap-2">
          <Botao
            tipo="secundario"
            icone="copiar"
            onClick={async () => {
              await salvarRegistro("treinos", { ...t, id: novoId(), nome: `${t.nome} (cópia)`.slice(0, 60), posicao: base.treinos.length });
              aviso("Treino duplicado.");
              router.replace("/treinos/");
            }}
          >
            Duplicar
          </Botao>
          <Botao tipo="perigo" onClick={() => setExcluir(true)}>
            Excluir
          </Botao>
        </div>
      )}
      <p className="t-legenda text-center text-mut">As mudanças valem a partir do próximo treino. O histórico não muda.</p>

      <Folha aberta={escolher} aoMudar={setEscolher} titulo="Adicionar exercício" rotuloCancelar="Fechar">
        <ListaExercicios
          proprios={base.proprios}
          aoEscolher={(chave) => {
            const info = exInfo(chave, base.proprios);
            mudar({ exercicios: [...t.exercicios, { ex_chave: chave, series: 3, reps: info.reps, descanso_s: null, obs: null, cat: info.tipo }] });
            setEscolher(false);
          }}
        />
      </Folha>
      <Confirmar
        aberta={excluir}
        aoMudar={setExcluir}
        titulo={`Excluir ${t.nome}?`}
        texto="O treino sai da lista e da semana. As sessões feitas continuam no histórico."
        sim="Excluir"
        perigo
        aoConfirmar={async () => {
          await apagarRegistro("treinos", t.id);
          aviso("Treino excluído.");
          router.replace("/treinos/");
        }}
      />
    </PaginaCheia>
  );
}

export default function PaginaEditor() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}
