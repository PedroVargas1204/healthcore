"use client";

import { useMemo, useState } from "react";
import { Chip, Folha } from "./ui/pecas";
import { Icone } from "./ui/icone";
import { Botao } from "./ui/botao";
import { EX, EQUIPS, GRUPOS } from "@/lib/dominio/catalogo";
import { novoId, salvarRegistro } from "@/lib/dados/repo";
import type { Categoria, ExercicioProprio } from "@/lib/dominio/tipos";
import { cn } from "@/lib/util/cn";

const sem = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Item = { chave: string; nome: string; grupo: string; musc: string[]; equip: string; tipo: Categoria; v: number; proprio: boolean };

export function todosExercicios(proprios: ExercicioProprio[]): Item[] {
  const fixos = Object.entries(EX).map(([chave, e]) => ({ chave, nome: e.nome, grupo: e.grupo, musc: e.musc, equip: e.equip, tipo: e.tipo, v: e.v, proprio: false }));
  const meus = proprios.map((p) => ({ chave: p.chave, nome: p.nome, grupo: p.grupo, musc: p.musc, equip: p.equip, tipo: p.tipo, v: 0, proprio: true }));
  return [...fixos, ...meus];
}

/** Busca e filtro por grupo. `aoEscolher` transforma a lista num seletor. */
export function ListaExercicios({ proprios, aoEscolher, aoAbrir }: { proprios: ExercicioProprio[]; aoEscolher?: (chave: string) => void; aoAbrir?: (chave: string) => void }) {
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState<string>("Todos");
  const [criar, setCriar] = useState(false);
  const lista = useMemo(() => {
    const b = sem(busca.trim());
    return todosExercicios(proprios)
      .filter((e) => (grupo === "Todos" || e.grupo === grupo) && (!b || sem(e.nome).includes(b) || sem(e.musc.join(" ")).includes(b)))
      .sort((a, c) => c.v - a.v || a.nome.localeCompare(c.nome, "pt-BR"));
  }, [busca, grupo, proprios]);
  return (
    <div className="flex flex-col gap-3">
      <label className="flex min-h-12 items-center gap-3 rounded-ctl bg-s1 px-4 text-mut">
        <Icone nome="busca" tamanho={20} />
        <span className="sr-only">Buscar exercício</span>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar exercício ou músculo"
          autoComplete="off"
          className="t-corpo min-h-11 flex-1 bg-transparent text-tx outline-none placeholder:text-mut"
        />
      </label>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {[...GRUPOS, "Outro"].map((g) => (
          <Chip key={g} ativo={g === grupo} onClick={() => setGrupo(g)} className="shrink-0">
            {g}
          </Chip>
        ))}
      </div>
      <p className="t-legenda text-mut" aria-live="polite">
        {lista.length} {lista.length === 1 ? "exercício" : "exercícios"}
      </p>
      <ul className="flex flex-col gap-2">
        {lista.map((e) => (
          <li key={e.chave}>
            <button
              type="button"
              onClick={() => (aoEscolher ? aoEscolher(e.chave) : aoAbrir?.(e.chave))}
              className="toque flex min-h-16 w-full items-center gap-3 rounded-card bg-s1 px-4 py-3 text-left"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-ctl bg-s2">
                <Icone nome={aoEscolher ? "mais" : "dumbbell"} tamanho={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="t-destaque">{e.nome}</span>
                <span className="t-legenda text-mut">
                  {e.musc.join(", ") || e.grupo}, {e.equip.toLowerCase()}, {e.tipo === "comp" ? "composto" : "isolado"}
                  {e.proprio ? " · seu" : ""}
                </span>
              </span>
              {e.v > 0 && <span className="t-legenda rounded-full bg-ac-tint px-2 py-1 font-semibold text-ac-tx">Foco V</span>}
            </button>
          </li>
        ))}
      </ul>
      <Botao tipo="secundario" icone="mais" onClick={() => setCriar(true)}>
        Criar exercício
      </Botao>
      {criar && <FolhaNovoExercicio aberta={criar} aoMudar={setCriar} aoCriar={(c) => aoEscolher?.(c)} />}
    </div>
  );
}

const MUSCULOS = [
  "Deltoide lateral", "Deltoide anterior", "Deltoide posterior", "Dorsal", "Romboides", "Trapézio", "Peitoral superior", "Peitoral",
  "Bíceps", "Tríceps", "Antebraço", "Abdômen", "Lombar", "Quadríceps", "Glúteos", "Posterior de coxa", "Panturrilha", "Adutores",
];

export function FolhaNovoExercicio({ aberta, aoMudar, aoCriar }: { aberta: boolean; aoMudar: (v: boolean) => void; aoCriar?: (chave: string) => void }) {
  const [nome, setNome] = useState("");
  const [grupo, setGrupo] = useState("Ombro");
  const [equip, setEquip] = useState("Halteres");
  const [tipo, setTipo] = useState<Categoria>("iso");
  const [reps, setReps] = useState("10-12");
  const [musc, setMusc] = useState<string[]>([]);
  const [sec, setSec] = useState<string[]>([]);
  const [semCarga, setSemCarga] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criar() {
    if (!nome.trim()) return setErro("Dê um nome ao exercício.");
    if (!musc.length) return setErro("Escolha ao menos um músculo principal, para o mapa contar as séries.");
    const chave = `c_${novoId().slice(0, 8)}`;
    await salvarRegistro("exercicios_proprios", {
      id: novoId(),
      chave,
      nome: nome.trim().slice(0, 40),
      grupo,
      equip,
      tipo,
      reps_padrao: reps.trim() || "10",
      musc,
      sec: sec.filter((m) => !musc.includes(m)),
      sem_carga: semCarga,
    });
    aoMudar(false);
    aoCriar?.(chave);
  }

  const escolha = (lista: string[], set: (v: string[]) => void, m: string) => set(lista.includes(m) ? lista.filter((x) => x !== m) : [...lista, m].slice(0, 6));
  const grupoChips = (rotulo: string, opcoes: readonly string[], valor: string, set: (v: string) => void) => (
    <div className="flex flex-col gap-2">
      <span className="t-destaque">{rotulo}</span>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <Chip key={o} ativo={o === valor} onClick={() => set(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  );

  return (
    <Folha aberta={aberta} aoMudar={aoMudar} titulo="Novo exercício" acao={{ rotulo: "Criar", aoTocar: criar }}>
      <label className="flex flex-col gap-2">
        <span className="t-destaque">Nome</span>
        <input value={nome} maxLength={40} onChange={(e) => setNome(e.target.value)} className="t-corpo min-h-12 rounded-ctl bg-s2 px-4" placeholder="Ex.: Elevação lateral no cabo" />
      </label>
      {grupoChips("Grupo", [...GRUPOS.filter((g) => g !== "Todos"), "Outro"], grupo, setGrupo)}
      {grupoChips("Equipamento", EQUIPS, equip, setEquip)}
      <div className="grid grid-cols-2 gap-2">
        {(["comp", "iso"] as const).map((t) => (
          <button key={t} type="button" aria-pressed={tipo === t} onClick={() => setTipo(t)} className={cn("toque t-destaque min-h-12 rounded-ctl", tipo === t ? "bg-ac text-on-ac" : "bg-s2")}>
            {t === "comp" ? "Composto" : "Isolado"}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-2">
        <span className="t-destaque">Repetições padrão</span>
        <input value={reps} maxLength={20} onChange={(e) => setReps(e.target.value)} className="t-corpo min-h-12 rounded-ctl bg-s2 px-4" placeholder="8-10, 40 s, 500 m" />
      </label>
      <div className="flex flex-col gap-2">
        <span className="t-destaque">Músculos principais</span>
        <div className="flex flex-wrap gap-2">
          {MUSCULOS.map((m) => (
            <Chip key={m} ativo={musc.includes(m)} onClick={() => escolha(musc, setMusc, m)}>
              {m}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="t-destaque">Auxiliares (contam meia série)</span>
        <div className="flex flex-wrap gap-2">
          {MUSCULOS.filter((m) => !musc.includes(m)).map((m) => (
            <Chip key={m} ativo={sec.includes(m)} onClick={() => escolha(sec, setSec, m)}>
              {m}
            </Chip>
          ))}
        </div>
      </div>
      <button type="button" aria-pressed={semCarga} onClick={() => setSemCarga(!semCarga)} className={cn("toque t-destaque min-h-12 rounded-ctl", semCarga ? "bg-ac text-on-ac" : "bg-s2")}>
        {semCarga ? "Peso do corpo (sem carga)" : "Usa carga"}
      </button>
      {erro && (
        <p role="alert" className="t-rotulo text-bad-tx">
          {erro}
        </p>
      )}
    </Folha>
  );
}
