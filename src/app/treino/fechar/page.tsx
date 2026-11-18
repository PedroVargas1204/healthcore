"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Abertura } from "@/componentes/provedores";
import { Botao } from "@/componentes/ui/botao";
import { AreaTexto, Aviso, Campo, Chip, Confirmar, Escala } from "@/componentes/ui/pecas";
import { useBase } from "@/lib/dados/base";
import { concluirSessao, descartarRascunho } from "@/lib/dados/repo";
import { fechamentoInicial, montarSessao, semRir, type Fechamento } from "@/lib/acoes/treino";
import { exInfo, nomeCurto } from "@/lib/dominio/exercicios";
import type { SessaoAtiva } from "@/lib/dominio/tipos";
import { hojeK } from "@/lib/util/datas";
import { lerMmss, lerNumero, mmss } from "@/lib/util/formato";
import { cn } from "@/lib/util/cn";

export default function Fechar() {
  const router = useRouter();
  const base = useBase();
  const [a, setA] = useState<SessaoAtiva | null>(null);
  const [f, setF] = useState<Fechamento | null>(null);
  const [tempo, setTempo] = useState("");
  const [extras, setExtras] = useState(false);
  const [outraData, setOutraData] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [vazio, setVazio] = useState(false);

  // Copia o treino em andamento para o formulário uma vez; sem treino em andamento, volta para o início.
  if (base?.rascunho && !a) {
    const ini = fechamentoInicial(base.rascunho);
    setA(base.rascunho);
    setF(ini);
    setTempo(ini.tempo_total_s ? mmss(ini.tempo_total_s) : "");
  }
  useEffect(() => {
    if (base && !base.rascunho && !a) router.replace("/");
  }, [base, a, router]);

  if (!base || !a || !f) return <Abertura texto="Abrindo…" />;

  const mudar = (m: Partial<Fechamento>) => setF({ ...f, ...m });
  const feitas = a.tipo === "forca" ? a.exercicios.reduce((n, e) => n + e.series.filter((s) => s.feita).length, 0) : 0;
  const total = a.tipo === "forca" ? a.exercicios.reduce((n, e) => n + e.series.length, 0) : 0;
  const exFeitos = a.tipo === "forca" ? a.exercicios.filter((e) => e.series.some((s) => s.feita)) : [];
  const faltaRir = a.tipo === "forca" ? semRir(a).length : 0;

  async function salvar() {
    if (!a || !f) return;
    if (a.tipo === "forca" && feitas === 0) {
      setVazio(true);
      return;
    }
    if (f.dor_articular && !f.dor_articular_ex.length && exFeitos.length) {
      setErro("Escolha em qual exercício doeu. A carga dele não sobe na próxima vez.");
      return;
    }
    const tt = a.tipo === "cond" && tempo.trim() ? lerMmss(tempo) : f.tempo_total_s;
    if (a.tipo === "cond" && tempo.trim() && !Number.isFinite(tt)) {
      setErro("Escreva o tempo total como min:seg, por exemplo 32:15.");
      return;
    }
    setSalvando(true);
    const s = montarSessao(a, { ...f, tempo_total_s: tt ?? null, dor_articular: f.dor_articular && (f.dor_articular_ex.length > 0 || !exFeitos.length) });
    // Condicionamento com dor e sem exercício para marcar: a dor vira observação (o banco exige o exercício).
    if (f.dor_articular && !f.dor_articular_ex.length) {
      s.dor_articular = false;
      s.dor_articular_ex = [];
      s.obs = [s.obs, `Dor articular${f.dor_articular_onde ? `: ${f.dor_articular_onde}` : ""}.`].filter(Boolean).join(" ");
      s.dor_articular_onde = null;
    }
    await concluirSessao(s);
    router.replace(`/treino/resumo/?id=${s.id}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-5 px-5 pt-seguro pb-seguro">
      <button type="button" onClick={() => router.push("/treino/")} className="t-corpo min-h-11 self-start pt-1 text-mut">
        Voltar ao treino
      </button>
      <div className="flex flex-col gap-1">
        <h1 className="t-tela">Fechar treino</h1>
        <p className="t-rotulo text-mut">
          {a.nome}
          {a.tipo === "forca" ? ` · ${feitas} de ${total} séries${faltaRir ? "" : ", todas com RIR"}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo
          rotulo="Duração"
          unidade="min"
          inputMode="numeric"
          value={String(f.duracao_min)}
          onChange={(e) => mudar({ duracao_min: Math.min(600, Math.max(0, Math.round(lerNumero(e.target.value) || 0))) })}
        />
        <Campo
          rotulo="Kcal"
          unidade="kcal"
          inputMode="numeric"
          placeholder="do relógio"
          value={f.kcal === null ? "" : String(f.kcal)}
          onChange={(e) => {
            const n = Math.round(lerNumero(e.target.value));
            mudar({ kcal: Number.isFinite(n) ? Math.min(5000, Math.max(0, n)) : null });
          }}
        />
      </div>

      {a.tipo === "cond" && (
        <>
          <Campo rotulo="Tempo total" unidade="min:seg" inputMode="numeric" placeholder="32:15" value={tempo} onChange={(e) => setTempo(e.target.value)} />
          <Escala rotulo="Esforço da sessão (RPE)" min={1} max={10} valor={f.rpe} aoMudar={(v) => mudar({ rpe: v })} pontas={["leve", "máximo"]} />
        </>
      )}

      <Escala rotulo="Energia" valor={f.energia} aoMudar={(v) => mudar({ energia: v })} pontas={["sem energia", "cheio"]} />
      <Escala rotulo="Dor muscular" valor={f.dor_muscular} aoMudar={(v) => mudar({ dor_muscular: v })} pontas={["nenhuma", "forte"]} />

      <div className="flex flex-col gap-2">
        <span id="rot-dor" className="t-destaque">
          Dor ou incômodo nas articulações?
        </span>
        <div role="radiogroup" aria-labelledby="rot-dor" className="grid grid-cols-2 gap-2">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={f.dor_articular === v}
              onClick={() => {
                mudar({ dor_articular: v, dor_articular_ex: v ? f.dor_articular_ex : [] });
                setErro(null);
              }}
              className={cn("toque t-destaque min-h-12 rounded-ctl", f.dor_articular === v ? "bg-ac text-on-ac" : "bg-s2")}
            >
              {v ? "Sim" : "Não"}
            </button>
          ))}
        </div>
        {f.dor_articular && exFeitos.length > 0 && (
          <>
            <span className="t-rotulo text-tx2">Em qual exercício? A carga dele não sobe na próxima vez.</span>
            <div className="flex flex-wrap gap-2">
              {exFeitos.map((e) => {
                const on = f.dor_articular_ex.includes(e.ex_chave);
                return (
                  <Chip
                    key={e.ex_chave}
                    ativo={on}
                    onClick={() => {
                      setErro(null);
                      mudar({ dor_articular_ex: on ? f.dor_articular_ex.filter((x) => x !== e.ex_chave) : [...f.dor_articular_ex, e.ex_chave] });
                    }}
                  >
                    {nomeCurto(exInfo(e.ex_chave, base.proprios).nome)}
                  </Chip>
                );
              })}
            </div>
          </>
        )}
      </div>

      {extras || f.dor_articular ? (
        <>
          {f.dor_articular && (
            <label className="flex flex-col gap-2">
              <span className="t-destaque">Onde dói?</span>
              <input
                className="t-corpo min-h-14 rounded-ctl bg-s2 px-4 outline-none placeholder:text-mut focus:outline-2 focus:outline-ac-tx"
                placeholder="Ex.: ombro direito"
                maxLength={120}
                value={f.dor_articular_onde}
                onChange={(e) => mudar({ dor_articular_onde: e.target.value })}
              />
            </label>
          )}
          <AreaTexto rotulo="Observação" maxLength={1000} placeholder="Como foi, o que ajustar na próxima" value={f.obs} onChange={(e) => mudar({ obs: e.target.value })} />
        </>
      ) : (
        <Botao tipo="discreto" className="self-start" onClick={() => setExtras(true)}>
          + Observação
        </Botao>
      )}

      {outraData ? (
        <label className="flex flex-col gap-2">
          <span className="t-destaque">Data do treino</span>
          <input
            type="date"
            value={f.data}
            max={hojeK()}
            onChange={(e) => e.target.value && mudar({ data: e.target.value })}
            className="t-corpo min-h-14 rounded-ctl bg-s2 px-4"
          />
        </label>
      ) : (
        <Botao tipo="discreto" className="self-start text-mut" onClick={() => setOutraData(true)}>
          Foi em outro dia? Mudar a data
        </Botao>
      )}

      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Botao largura="cheia" className="mt-auto" carregando={salvando} textoCarregando="Salvando" onClick={salvar}>
        Salvar treino
      </Botao>

      <Confirmar
        aberta={vazio}
        aoMudar={setVazio}
        titulo="Nenhuma série feita"
        texto="Não há nada para salvar. Descartar este treino?"
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
