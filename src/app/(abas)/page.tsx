"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PaginaAba } from "@/componentes/estrutura";
import { Figura } from "@/componentes/mapa-corpo";
import { FolhaNoite } from "@/componentes/folha-noite";
import { PilulaProntidao, SinalProntidao } from "@/componentes/prontidao";
import { Botao } from "@/componentes/ui/botao";
import { Icone } from "@/componentes/ui/icone";
import { Aviso, Cartao, Confirmar, Esqueleto, Folha } from "@/componentes/ui/pecas";
import { useAvisoCurto } from "@/componentes/ui/aviso-curto";
import { useBase, type Base } from "@/lib/dados/base";
import { useConta } from "@/lib/dados/conta";
import { novoId, salvarConfig, salvarRascunho, salvarRegistro } from "@/lib/dados/repo";
import { comecar, deloadAtivo } from "@/lib/acoes/treino";
import { liberarPlanoCompleto } from "@/lib/acoes/plano";
import { exInfo, nomeCurto } from "@/lib/dominio/exercicios";
import { prontidaoHoje, semanasSeguidas } from "@/lib/dominio/recomendacao";
import { descricaoTreino } from "@/lib/dominio/semana";
import { situacaoRampa } from "@/lib/dominio/modelos";
import { GRUPOS, META_FOCO, nivelMapa, regioesDoTreino, somaGrupo, volumeFeito, volumePlanejado, type Regiao } from "@/lib/dominio/volume";
import { CORES_MAPA } from "@/componentes/mapa-corpo";
import type { Treino } from "@/lib/dominio/tipos";
import { DIAS_L, DIAS_LETRA, dataCurta, dataLonga, diaSemana, hojeK, inicioSemana, somarDias } from "@/lib/util/datas";
import { fmt, repsTxt } from "@/lib/util/formato";
import { cn } from "@/lib/util/cn";

function BlocoDia({ treino, base, aoComecar, emDeload }: { treino: Treino; base: Base; aoComecar: () => void; emDeload: boolean }) {
  const { prim, sec } = regioesDoTreino(treino, base.proprios);
  const cor = (r: Regiao) => (prim.has(r) ? "#111214" : sec.has(r) ? "#7C2D20" : "#E2462B");
  return (
    <section className="flex flex-col gap-4 rounded-card bg-ac p-5 text-on-ac" aria-label="Treino do dia">
      <div className="flex flex-col gap-1">
        <h2 className="font-disp text-[2rem] leading-none font-extrabold uppercase">{treino.nome}</h2>
        <p className="t-rotulo font-semibold">
          {descricaoTreino(treino, base.regras)}
          {emDeload && treino.tipo === "forca" ? ". Semana de deload." : ""}
        </p>
      </div>
      {treino.tipo === "forca" ? (
        <div className="flex gap-4">
          <div className="flex gap-1.5" role="img" aria-label="Músculos do treino: principais em preto, auxiliares em marrom">
            <Figura lado="frente" largura={40} cor={cor} base="#E2462B" />
            <Figura lado="costas" largura={40} cor={cor} base="#E2462B" />
          </div>
          <ul className="flex flex-1 flex-col gap-1">
            {treino.exercicios.map((e, i) => (
              <li key={i} className="t-rotulo flex justify-between gap-2 font-semibold">
                <span>{nomeCurto(exInfo(e.ex_chave, base.proprios).nome)}</span>
                <span className="tab-num shrink-0 font-medium">
                  {e.series} × {repsTxt(e.reps).replace(" a ", "-")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {treino.estacoes.map((s, i) => (
            <li key={i} className="t-rotulo flex justify-between gap-2 font-semibold">
              <span>{s.nome}</span>
              <span className="font-medium">{s.alvo}</span>
            </li>
          ))}
        </ul>
      )}
      <Botao tipo="escuro" icone="play" largura="cheia" onClick={aoComecar}>
        Começar
      </Botao>
    </section>
  );
}

function CartaoSemana({ base, hoje, treinoHoje, feitoHoje }: { base: Base; hoje: string; treinoHoje: Treino | null; feitoHoje: boolean }) {
  const ini = inicioSemana(hoje);
  const daSemana = base.sessoes.filter((s) => s.data >= ini && s.data <= somarDias(ini, 6));
  const diasFeitos = new Set(daSemana.map((s) => s.data));
  const planejados = base.semana.filter(Boolean).length;
  const feitos = diasFeitos.size;
  const vol = volumeFeito(daSemana, base.proprios);
  const hojeSoma = treinoHoje && !feitoHoje ? volumePlanejado([treinoHoje], base.proprios) : {};
  const foco = GRUPOS.filter((g) => g.tipo === "foco");
  const somaHoje = foco
    .map((g) => ({ g, n: somaGrupo(hojeSoma, g) }))
    .filter((x) => x.n > 0)
    .map((x) => `+${fmt(x.n)} ${x.g.curto}`);
  const cor = (r: Regiao) => CORES_MAPA[nivelMapa(vol[r] ?? 0)];
  return (
    <Link href="/progresso/musculos/" className="toque flex flex-col gap-4 rounded-card bg-s1 p-4">
      <div className="flex items-center justify-between">
        <h2 className="t-h2">Sua semana</h2>
        <span className="t-rotulo flex items-center gap-1 text-mut">
          {feitos} de {planejados} treinos <Icone nome="next" tamanho={18} />
        </span>
      </div>
      <ol className="grid grid-cols-7 gap-1" aria-label="Dias da semana">
        {DIAS_LETRA.map((l, i) => {
          const k = somarDias(ini, i);
          const feito = diasFeitos.has(k);
          const planejado = !!base.semana[i];
          const ehHoje = k === hoje;
          const estado = feito ? "feito" : ehHoje ? "hoje" : planejado && k > hoje ? "previsto" : planejado ? "perdido" : "descanso";
          const texto = { feito: "treino feito", hoje: "hoje", previsto: "treino previsto", perdido: "treino não feito", descanso: "descanso" }[estado];
          return (
            <li key={i} className="flex flex-col items-center gap-2" aria-label={`${DIAS_L[i]}: ${texto}`}>
              <span className={cn("t-legenda font-semibold", ehHoje ? "text-ac-tx" : "text-mut")}>{l}</span>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  estado === "feito" && "bg-ac text-on-ac",
                  estado === "hoje" && "border-2 border-ac",
                  estado === "previsto" && "bg-s3",
                  estado === "perdido" && "border-2 border-s3",
                )}
              >
                {estado === "feito" && <Icone nome="check" tamanho={16} traco={2.6} />}
                {estado === "descanso" && <span className="h-0.5 w-3 rounded bg-dim" />}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="flex items-center gap-4">
        <div className="flex gap-1" aria-hidden="true">
          <Figura lado="frente" largura={30} cor={cor} base="var(--mapa-base)" />
          <Figura lado="costas" largura={30} cor={cor} base="var(--mapa-base)" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          {foco.map((g) => (
            <p key={g.nome} className="t-rotulo flex justify-between gap-2">
              <span>{g.nome}</span>
              <span className="tab-num">
                <b>{fmt(somaGrupo(vol, g))}</b> de {META_FOCO.min} a {META_FOCO.max}
              </span>
            </p>
          ))}
          {somaHoje.length > 0 && <p className="t-legenda text-mut">Hoje soma {somaHoje.join(" e ")}</p>}
        </div>
      </div>
    </Link>
  );
}

function ConteudoHoje({ base }: { base: Base }) {
  const router = useRouter();
  const conta = useConta();
  const aviso = useAvisoCurto();
  const hoje = hojeK();
  const [folhaNoite, setFolhaNoite] = useState(false);
  const [folhaProntidao, setFolhaProntidao] = useState(false);
  const [escolher, setEscolher] = useState(false);
  const [trocarSessao, setTrocarSessao] = useState<Treino | null>(null);
  const [liberando, setLiberando] = useState(false);

  const idTreinoHoje = base.semana[diaSemana(new Date())] ?? null;
  const treinoHoje = idTreinoHoje ? (base.treinoPorId.get(idTreinoHoje) ?? null) : null;
  const sessaoHoje = base.sessoes.find((s) => s.data === hoje);
  const noiteHoje = base.noites.find((n) => n.data === hoje);
  const p = useMemo(() => prontidaoHoje({ noites: base.noites, sessoes: base.sessoes, config: base.config, hoje }), [base, hoje]);
  const deload = deloadAtivo(base.deloads, hoje);
  const seguidas = useMemo(() => semanasSeguidas({ sessoes: base.sessoes, deloads: base.deloads, hoje }), [base, hoje]);
  const pedirDeload = !deload && seguidas >= base.regras.semanasDeload! && !(base.config.deload_dispensado_ate && base.config.deload_dispensado_ate >= hoje);
  const rampa = situacaoRampa(base.perfil.modelo, hoje);

  async function iniciar(t: Treino) {
    if (base.rascunho) {
      setTrocarSessao(t);
      return;
    }
    if (t.tipo === "forca" && !t.exercicios.length) return aviso("Esse treino não tem exercícios.");
    if (t.tipo === "cond" && !t.estacoes.length) return aviso("Esse treino não tem estações.");
    await salvarRascunho(comecar(t, base), { forcarEnvio: true });
    router.push("/treino/");
  }

  const d = new Date();
  return (
    <>
      {/* Com letra grande, o selo de prontidão (ou "Lançar a noite") desce para baixo do dia. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="t-tela">{DIAS_L[diaSemana(d)]}</h1>
          <p className="t-rotulo text-mut">{dataLonga(hoje)}</p>
        </div>
        {noiteHoje ? (
          <PilulaProntidao nivel={p.nivel} aoTocar={() => setFolhaProntidao(true)} />
        ) : (
          <button
            type="button"
            onClick={() => setFolhaNoite(true)}
            className="toque t-rotulo flex min-h-11 items-center gap-2 rounded-full bg-s1 px-4 font-semibold text-ac-tx"
          >
            <Icone nome="moon" tamanho={18} />
            Lançar a noite
          </button>
        )}
      </div>

      {deload && (
        <Aviso tipo="info" titulo={`Semana de deload até ${dataCurta(deload.fim)}.`}>
          {base.regras.deloadVolume}% menos séries{base.regras.deloadCarga ? ` e −${base.regras.deloadCarga}% de carga` : ""}.{" "}
          <button
            type="button"
            className="font-semibold text-ac-tx underline"
            onClick={() => salvarRegistro("deloads", { ...deload, fim: hoje < deload.inicio ? deload.inicio : hoje })}
          >
            Encerrar hoje
          </button>
        </Aviso>
      )}
      {pedirDeload && (
        <Cartao>
          <p className="t-rotulo">
            <b>{seguidas} semanas seguidas de treino.</b> Uma semana de deload, com {base.regras.deloadVolume}% menos séries, ajuda a recuperar e voltar a
            progredir.
          </p>
          <div className="flex gap-2">
            <Botao
              tipo="secundario"
              onClick={() => salvarRegistro("deloads", { id: novoId(), inicio: hoje, fim: somarDias(hoje, 6) }).then(() => aviso("Deload ligado por 7 dias."))}
            >
              Fazer deload por 7 dias
            </Botao>
            <Botao tipo="discreto" className="text-mut" onClick={() => salvarConfig({ deload_dispensado_ate: somarDias(hoje, 6) })}>
              Agora não
            </Botao>
          </div>
        </Cartao>
      )}
      {rampa?.pronta && (
        <Cartao className="outline-2 outline-ac">
          <span className="t-legenda font-semibold text-ac-tx">Dimorfismo 5x · evidência</span>
          <p className="t-rotulo">
            <b>As 2 semanas de adaptação terminaram.</b> O plano completo sobe de 78 para 96 séries por semana, com mais volume em ombro, costas e
            pernas.
          </p>
          <Botao
            carregando={liberando}
            textoCarregando="Liberando"
            onClick={async () => {
              if (conta.estado !== "dentro") return;
              setLiberando(true);
              await liberarPlanoCompleto(conta.uid);
              setLiberando(false);
              aviso("Plano completo liberado.");
            }}
          >
            Liberar o plano completo
          </Botao>
        </Cartao>
      )}

      {base.rascunho ? (
        <section className="flex flex-col gap-3 rounded-card bg-ac p-5 text-on-ac">
          <span className="t-rotulo font-semibold">Em andamento</span>
          <h2 className="font-disp text-[2rem] leading-none font-extrabold uppercase">{base.rascunho.nome}</h2>
          <p className="t-rotulo font-semibold">
            {base.rascunho.tipo === "forca"
              ? `${base.rascunho.exercicios.reduce((n, e) => n + e.series.filter((s) => s.feita).length, 0)} de ${base.rascunho.exercicios.reduce((n, e) => n + e.series.length, 0)} séries feitas`
              : base.rascunho.t_inicio
                ? "Cronômetro rodando"
                : "Cronômetro ainda não iniciado"}
          </p>
          <Botao tipo="escuro" icone="play" largura="cheia" onClick={() => router.push("/treino/")}>
            Continuar
          </Botao>
        </section>
      ) : sessaoHoje ? (
        <Cartao>
          <span className="t-rotulo flex items-center gap-2 font-semibold text-ok-tx">
            <Icone nome="check" tamanho={18} /> Treino de hoje feito
          </span>
          <h2 className="t-h1">{sessaoHoje.nome}</h2>
          <div className="flex gap-2">
            <Link href={`/historico/sessao/?id=${sessaoHoje.id}`} className="t-destaque flex min-h-12 items-center rounded-ctl bg-s2 px-4">
              Ver o resumo
            </Link>
            <Botao tipo="discreto" onClick={() => setEscolher(true)}>
              Treinar de novo
            </Botao>
          </div>
        </Cartao>
      ) : treinoHoje ? (
        <BlocoDia treino={treinoHoje} base={base} emDeload={!!deload} aoComecar={() => iniciar(treinoHoje)} />
      ) : (
        <Cartao>
          <h2 className="t-h1">Dia de descanso</h2>
          <p className="t-rotulo text-tx2">Recuperar também conta. Se quiser treinar mesmo assim, escolha o treino.</p>
          <Botao tipo="secundario" onClick={() => setEscolher(true)}>
            Escolher treino
          </Botao>
        </Cartao>
      )}

      <CartaoSemana base={base} hoje={hoje} treinoHoje={treinoHoje} feitoHoje={!!sessaoHoje} />

      {folhaNoite && (
        <FolhaNoite key={noiteHoje?.id ?? hoje} aberta={folhaNoite} aoMudar={setFolhaNoite} data={hoje} noite={noiteHoje} aoSalvar={() => aviso("Noite salva.")} />
      )}
      <Folha aberta={folhaProntidao} aoMudar={setFolhaProntidao} titulo="Prontidão de hoje" rotuloCancelar="Fechar">
        <SinalProntidao nivel={p.nivel} motivo={p.motivo} />
        <p className="t-rotulo text-tx2">
          A prontidão junta o sono da semana, a noite de ontem e como foram os últimos treinos. No verde a carga sobe normalmente; no amarelo ela
          fica igual; no vermelho cai um pouco.
        </p>
        <Botao
          tipo="secundario"
          onClick={() => {
            setFolhaProntidao(false);
            setFolhaNoite(true);
          }}
        >
          Editar a noite
        </Botao>
      </Folha>
      <Folha aberta={escolher} aoMudar={setEscolher} titulo="Escolher treino" rotuloCancelar="Fechar">
        {base.treinos.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setEscolher(false);
              void iniciar(t);
            }}
            className="toque flex min-h-14 items-center justify-between gap-3 rounded-ctl bg-s2 px-4 text-left"
          >
            <span className="flex flex-col">
              <span className="t-destaque">{t.nome}</span>
              <span className="t-legenda text-mut">{descricaoTreino(t, base.regras)}</span>
            </span>
            <Icone nome="play" tamanho={16} className="text-ac-tx" />
          </button>
        ))}
      </Folha>
      <Confirmar
        aberta={!!trocarSessao}
        aoMudar={(v) => !v && setTrocarSessao(null)}
        titulo="Já tem um treino aberto"
        texto={`${base.rascunho?.nome ?? ""} ainda está em andamento. Continue por ele ou descarte para começar ${trocarSessao?.nome ?? ""}.`}
        sim="Continuar o aberto"
        nao="Fechar"
        aoConfirmar={() => router.push("/treino/")}
      />
    </>
  );
}

export default function Hoje() {
  const base = useBase();
  return (
    <PaginaAba>
      {base ? (
        <ConteudoHoje base={base} />
      ) : (
        <>
          <Esqueleto linhas={2} />
          <Esqueleto linhas={4} />
        </>
      )}
    </PaginaAba>
  );
}
