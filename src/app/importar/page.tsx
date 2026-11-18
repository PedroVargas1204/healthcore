"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { PaginaCheia } from "@/componentes/estrutura";
import { Botao } from "@/componentes/ui/botao";
import { Icone } from "@/componentes/ui/icone";
import { Aviso, Cartao } from "@/componentes/ui/pecas";
import { useConta } from "@/lib/dados/conta";
import { usePerfil } from "@/lib/dados/hooks";
import { salvarPerfil } from "@/lib/dados/repo";
import { BackupInvalido, converterQualquer, lerQualquerBackup, resumoQualquer, type Backup } from "@/lib/dominio/conversor";
import { FalhaImportacao, importar, type Contagem } from "@/lib/acoes/importar";
import { usarPlanoEvidencia } from "@/lib/acoes/plano";
import { dataLonga, hojeK, hora } from "@/lib/util/datas";
import { fmt } from "@/lib/util/formato";

type Estado =
  | { fase: "escolher"; erro?: string }
  | { fase: "previa"; nome: string; backup: Backup; erro?: string; rede?: boolean }
  | { fase: "importando"; nome: string; backup: Backup; parte?: string }
  | { fase: "pronto"; contagem: Contagem; diasComTreino: number };

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line py-2 last:border-0">
      <span className="t-rotulo text-mut">{rotulo}</span>
      <span className="t-rotulo text-right font-semibold">{valor}</span>
    </div>
  );
}

const nenhum = (n: number, um: string, varios: string, zero: string) => (n === 0 ? zero : `${n} ${n === 1 ? um : varios}`);

function Previa({ backup }: { backup: Backup }) {
  const r = resumoQualquer(backup);
  const letras = r.letras.length >= 2 ? `, de ${r.letras[0]} a ${r.letras[r.letras.length - 1]}` : "";
  return (
    <div className="flex flex-col rounded-card bg-s1 px-4">
      <Linha rotulo="Perfil" valor={[r.perfil.nome, r.perfil.altura ? `${fmt(r.perfil.altura / 100, 2)} m` : null].filter(Boolean).join(", ") || "sem nome"} />
      <Linha rotulo="Treinos" valor={`${r.treinos.length}${letras}`} />
      <Linha rotulo="Semana" valor={r.diasComTreino === 7 ? "treino nos 7 dias" : `treino em ${r.diasComTreino} dias`} />
      <Linha
        rotulo="Medidas"
        valor={
          r.medidas === 0
            ? "nenhuma ainda"
            : `${r.medidas}${r.ultimaMedida ? `: ${[r.ultimaMedida.peso ? `${fmt(r.ultimaMedida.peso)} kg` : null, r.ultimaMedida.bf ? `${fmt(r.ultimaMedida.bf)}% de gordura` : null].filter(Boolean).join(", ")}` : ""}`
        }
      />
      <Linha rotulo="Sessões" valor={nenhum(r.sessoes, "sessão", "sessões", "nenhuma ainda")} />
      <Linha rotulo="Noites de sono" valor={nenhum(r.noites, "noite", "noites", "nenhuma ainda")} />
      <Linha rotulo="Exercícios próprios" valor={nenhum(r.proprios, "exercício", "exercícios", "nenhum")} />
    </div>
  );
}

function textoPronto(c: Contagem) {
  const partes: string[] = [];
  if (c.treinos) partes.push(`${c.treinos} ${c.treinos === 1 ? "treino" : "treinos"}`);
  partes.push("a sua semana");
  if (c.sessoes) partes.push(`${c.sessoes} ${c.sessoes === 1 ? "sessão" : "sessões"}`);
  if (c.noites) partes.push(`${c.noites} ${c.noites === 1 ? "noite" : "noites"} de sono`);
  if (c.medidas) partes.push(`${c.medidas} ${c.medidas === 1 ? "medida" : "medidas"}`);
  partes.push("o seu perfil");
  return `Entraram ${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}.`;
}

function Importar() {
  const router = useRouter();
  const params = useSearchParams();
  const doInicio = params.get("origem") === "inicio";
  const conta = useConta();
  const perfil = usePerfil();
  const input = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>({ fase: "escolher" });
  const [usandoPlano, setUsandoPlano] = useState(false);
  const voltarPara = doInicio ? "/boas-vindas/" : "/ajustes/conta/";

  async function lerArquivo(f: File | undefined) {
    if (!f) return;
    // Um backup de vários anos fica na casa de poucos MB; acima disso não é backup do app e travaria o celular.
    if (f.size > LIMITE_BACKUP) {
      setEstado({ fase: "escolher", erro: "Esse arquivo é grande demais para ser um backup do HealthCore (mais de 25 MB)." });
      return;
    }
    try {
      const backup = lerQualquerBackup(await f.text());
      setEstado({ fase: "previa", nome: f.name, backup });
    } catch (e) {
      setEstado({ fase: "escolher", erro: e instanceof BackupInvalido ? e.message : "Não deu para ler esse arquivo." });
    }
  }

  async function confirmar() {
    if (estado.fase !== "previa" || conta.estado !== "dentro") return;
    const { nome, backup } = estado;
    setEstado({ fase: "importando", nome, backup });
    try {
      const pedido = await converterQualquer(backup, conta.uid);
      const contagem = await importar(pedido, (feito, total) => total > 1 && setEstado({ fase: "importando", nome, backup, parte: `Parte ${feito} de ${total}` }));
      setEstado({ fase: "pronto", contagem, diasComTreino: pedido.semana.filter(Boolean).length });
    } catch (e) {
      const rede = !(e instanceof FalhaImportacao);
      const msg = rede ? "Sem conexão com a nuvem. Confira a internet e tente de novo." : e.message;
      setEstado({ fase: "previa", nome, backup, erro: msg, rede });
    }
  }

  async function concluir(usarNovo: boolean) {
    if (conta.estado !== "dentro") return;
    setUsandoPlano(true);
    if (usarNovo) await usarPlanoEvidencia(conta.uid, hojeK());
    await salvarPerfil({ onboarding_concluido: true });
    router.replace("/");
  }

  if (estado.fase === "pronto") {
    const jaEvidencia = perfil?.modelo?.startsWith("evidencia");
    return (
      <PaginaCheia tituloSecundario>
        <div className="flex flex-col gap-3 pt-14">
          <span className="flex size-16 items-center justify-center rounded-full bg-ok-tint text-ok-tx">
            <Icone nome="check" tamanho={32} traco={2.4} />
          </span>
          <h1 className="t-tela">Tudo certo</h1>
          <p className="t-corpo text-tx2">{textoPronto(estado.contagem)} Agora eles estão na sua conta e aparecem em qualquer aparelho.</p>
        </div>
        {!jaEvidencia ? (
          <Cartao className="outline-2 outline-ac">
            <span className="t-legenda font-semibold text-ac-tx">Plano novo aprovado por você</span>
            <h2 className="t-h2">Dimorfismo 5x · evidência</h2>
            <p className="t-rotulo text-tx2">
              A sua semana atual tem treino {estado.diasComTreino === 7 ? "nos 7 dias" : `em ${estado.diasComTreino} dias`}. O plano novo treina de segunda a
              sábado com descanso na quinta e no domingo, e começa com 2 semanas de adaptação. O plano atual fica guardado.
            </p>
            <Botao largura="cheia" carregando={usandoPlano} textoCarregando="Montando" onClick={() => concluir(true)}>
              Usar o plano novo
            </Botao>
            <Botao tipo="secundario" largura="cheia" disabled={usandoPlano} onClick={() => concluir(false)}>
              Manter o atual por enquanto
            </Botao>
          </Cartao>
        ) : (
          <Botao largura="cheia" className="mt-auto" onClick={() => concluir(false)}>
            Ir para hoje
          </Botao>
        )}
      </PaginaCheia>
    );
  }

  const arquivo =
    estado.fase !== "escolher" ? (
      <div className="flex items-center gap-3 rounded-card bg-s1 p-4">
        <Icone nome="arquivo" className="text-ac-tx" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="t-destaque break-all">{estado.nome}</span>
          {estado.backup.b.exportadoEm && (
            <span className="t-legenda text-mut">
              Exportado em {dataLonga(estado.backup.b.exportadoEm.slice(0, 10))}, {hora(estado.backup.b.exportadoEm)}
            </span>
          )}
        </span>
        {estado.fase === "previa" && (
          <button type="button" className="t-destaque min-h-11 px-1 text-ac-tx" onClick={() => input.current?.click()}>
            Trocar
          </button>
        )}
      </div>
    ) : null;

  return (
    <PaginaCheia tituloSecundario voltar={{ href: voltarPara, rotulo: "Cancelar" }} titulo="Importar backup">
      <input ref={input} type="file" accept=".json,application/json" className="sr-only" onChange={(e) => lerArquivo(e.target.files?.[0])} tabIndex={-1} aria-hidden="true" />
      {estado.fase === "escolher" && (
        <>
          <h1 className="t-tela pt-6">Trazer o histórico</h1>
          <p className="t-corpo text-tx2">
            No app antigo, abra Ajustes › Exportar backup e salve o arquivo. Depois escolha esse arquivo aqui. Ele é lido no próprio celular.
          </p>
          {estado.erro && <Aviso tipo="erro" titulo="Não deu para usar esse arquivo.">{estado.erro}</Aviso>}
          <Botao largura="cheia" icone="arquivo" className="mt-auto" onClick={() => input.current?.click()}>
            Escolher arquivo
          </Botao>
        </>
      )}
      {(estado.fase === "previa" || estado.fase === "importando") && (
        <>
          {arquivo}
          {estado.fase === "previa" && estado.erro && <Aviso tipo={estado.rede ? "offline" : "erro"} titulo="Nada foi importado.">{estado.erro.replace(/^Nada foi importado\.\s*/, "")}</Aviso>}
          <h2 className="t-h1">{estado.fase === "previa" && estado.erro ? "O que o arquivo tem" : "O que vai entrar"}</h2>
          <Previa backup={estado.backup} />
          <p className="t-legenda text-mut">Tudo entra de uma vez ou nada entra. Importar o mesmo arquivo de novo não duplica nada.</p>
          <div className="mt-auto flex flex-col gap-2">
            {estado.fase === "previa" && estado.erro && !estado.rede ? (
              <Botao tipo="secundario" largura="cheia" icone="arquivo" onClick={() => input.current?.click()}>
                Escolher outro arquivo
              </Botao>
            ) : (
              <Botao largura="cheia" carregando={estado.fase === "importando"} textoCarregando={estado.fase === "importando" && estado.parte ? estado.parte : "Importando"} onClick={confirmar}>
                Importar
              </Botao>
            )}
          </div>
        </>
      )}
    </PaginaCheia>
  );
}

const LIMITE_BACKUP = 25 * 1024 * 1024;

export default function PaginaImportar() {
  return (
    <Suspense>
      <Importar />
    </Suspense>
  );
}
