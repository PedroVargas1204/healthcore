"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { PaginaCheia } from "@/componentes/estrutura";
import { Botao } from "@/componentes/ui/botao";
import { Icone, type NomeIcone } from "@/componentes/ui/icone";
import { Aviso } from "@/componentes/ui/pecas";
import { useAvisoCurto } from "@/componentes/ui/aviso-curto";
import { apagarConta, sair, useConta } from "@/lib/dados/conta";
import { useEstadoSync } from "@/lib/dados/hooks";
import { sincronizar, tentarDeNovoFalhas } from "@/lib/dados/sync";
import { exportarBackup, exportarCsv } from "@/lib/acoes/exportar";
import { hora } from "@/lib/util/datas";
import { cn } from "@/lib/util/cn";

function Item({ icone, titulo, sub, aoTocar, href, perigo }: { icone: NomeIcone; titulo: string; sub?: string; aoTocar?: () => void; href?: string; perigo?: "suave" | "forte" }) {
  const conteudo = (
    <>
      <Icone nome={icone} className={perigo ? (perigo === "forte" ? "text-bad-tx" : "text-ac-tx") : "text-mut"} />
      <span className="flex flex-1 flex-col">
        <span className={cn("t-destaque", perigo === "forte" && "text-bad-tx", perigo === "suave" && "text-ac-tx")}>{titulo}</span>
        {sub && <span className="t-legenda text-mut">{sub}</span>}
      </span>
      {!perigo && <Icone nome="next" tamanho={18} className="text-mut" />}
    </>
  );
  const cls = "flex min-h-16 w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-0";
  return href ? (
    <Link href={href} className={cls}>
      {conteudo}
    </Link>
  ) : (
    <button type="button" onClick={aoTocar} className={cls}>
      {conteudo}
    </button>
  );
}

export default function Conta() {
  const router = useRouter();
  const conta = useConta();
  const sync = useEstadoSync();
  const aviso = useAvisoCurto();
  const [apagar, setApagar] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  if (conta.estado !== "dentro") return null;
  const iniciais = (conta.nome || conta.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

  const estado =
    sync.fase === "offline" ? (
      <Aviso tipo="offline" titulo="Sem internet.">
        {sync.pendentes ? `${sync.pendentes} ${sync.pendentes === 1 ? "registro está" : "registros estão"} no celular e ${sync.pendentes === 1 ? "sobe" : "sobem"} quando a conexão voltar.` : "Tudo o que você fizer fica no celular e sobe depois."}
      </Aviso>
    ) : sync.fase === "erro" ? (
      <Aviso tipo="erro" titulo="Um registro não subiu." acao={{ rotulo: "Tentar de novo", aoTocar: () => void tentarDeNovoFalhas() }}>
        {sync.falhas[0]?.mensagem} Ele continua salvo neste celular.
      </Aviso>
    ) : (
      <Aviso tipo="ok" icone="nuvem" titulo={sync.pendentes ? "Salvando na nuvem…" : "Tudo salvo na nuvem."}>
        {sync.ultimaVez ? `Última sincronização às ${hora(sync.ultimaVez)}.` : "Sincronizando…"}
      </Aviso>
    );

  return (
    <PaginaCheia voltar={{ href: "/ajustes/", rotulo: "Ajustes" }} titulo="Conta">
      <div className="flex items-center gap-4 pt-2">
        <span className="font-disp flex size-16 shrink-0 items-center justify-center rounded-full bg-s2 text-2xl font-extrabold">{iniciais}</span>
        <span className="flex flex-col">
          <span className="t-h2">{conta.nome || conta.email}</span>
          <span className="t-rotulo text-mut">Entrou com a conta Google{conta.nome ? ` · ${conta.email}` : ""}</span>
        </span>
      </div>
      {estado}
      <button type="button" className="t-rotulo min-h-11 self-start font-semibold text-ac-tx" onClick={() => void sincronizar()}>
        Sincronizar agora
      </button>
      <section className="flex flex-col gap-2">
        <h2 className="t-rotulo text-tx2">Seus dados</h2>
        <div className="flex flex-col rounded-card bg-s1">
          <Item icone="download" titulo="Exportar backup" sub="Arquivo .json com tudo" aoTocar={async () => (await exportarBackup(conta.uid)) && aviso("Backup pronto.")} />
          <Item
            icone="download"
            titulo="Exportar séries em planilha"
            sub="Arquivo .csv para abrir no Excel ou Numbers"
            aoTocar={async () => {
              const r = await exportarCsv();
              aviso(r === null ? "Ainda não há sessões para exportar." : "Planilha pronta.");
            }}
          />
          <Item icone="upload" titulo="Importar backup" sub="Do app antigo ou de outro backup" href="/importar/" />
        </div>
      </section>
      <div className="flex flex-col rounded-card bg-s1">
        <Item
          icone="sair"
          titulo="Sair da conta"
          sub={sync.pendentes ? `Atenção: ${sync.pendentes} ainda não ${sync.pendentes === 1 ? "subiu" : "subiram"} para a nuvem` : "Nada é apagado"}
          perigo="suave"
          aoTocar={async () => {
            await sair(conta.uid);
            router.replace("/entrar/");
          }}
        />
      </div>
      <div className="flex flex-col rounded-card bg-s1">
        <Item icone="lixo" titulo="Apagar conta e dados" perigo="forte" aoTocar={() => setApagar(true)} />
      </div>
      <p className="t-legenda text-mut">Sair não apaga nada: ao entrar de novo, tudo volta. Apagar remove a conta e todos os dados da nuvem e deste celular.</p>

      <Dialog.Root open={apagar} onOpenChange={setApagar}>
        <Dialog.Portal>
          <Dialog.Overlay className="veu fixed inset-0 z-40 bg-black/70" />
          <Dialog.Content aria-describedby="apagar-desc" className="folha fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[480px] flex-col gap-4 rounded-t-folha bg-s1 px-5 pt-3 pb-seguro">
            <div className="flex justify-center" aria-hidden="true">
              <span className="h-1.5 w-10 rounded-full bg-s3" />
            </div>
            <span className="flex size-12 items-center justify-center rounded-full bg-bad-tint text-bad-tx">
              <Icone nome="lixo" />
            </span>
            <Dialog.Title className="t-tela" style={{ fontSize: "min(2.25rem, 46px)" }}>
              Apagar a conta?
            </Dialog.Title>
            <p id="apagar-desc" className="t-corpo text-tx2">
              Todos os treinos, noites e medidas saem da nuvem e deste celular. Não dá para desfazer.
            </p>
            {erro && <Aviso tipo="erro">{erro}</Aviso>}
            <Botao tipo="secundario" icone="download" onClick={() => exportarBackup(conta.uid)}>
              Exportar backup antes
            </Botao>
            <Botao
              tipo="perigoCheio"
              className="t-destaque normal-case"
              carregando={apagando}
              textoCarregando="Apagando"
              onClick={async () => {
                setErro(null);
                setApagando(true);
                try {
                  await apagarConta(conta.uid);
                  router.replace("/entrar/");
                } catch {
                  setApagando(false);
                  setErro("Não deu para apagar agora. Apagar precisa de internet; tente de novo.");
                }
              }}
            >
              Apagar tudo
            </Botao>
            <Dialog.Close className="t-destaque min-h-12">Cancelar</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </PaginaCheia>
  );
}
