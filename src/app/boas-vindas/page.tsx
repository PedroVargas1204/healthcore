"use client";

import Link from "next/link";
import { PaginaCheia } from "@/componentes/estrutura";
import { Icone, type NomeIcone } from "@/componentes/ui/icone";
import { useConta } from "@/lib/dados/conta";
import { usePerfil } from "@/lib/dados/hooks";
import { cn } from "@/lib/util/cn";

function Opcao({ href, icone, titulo, texto, destaque }: { href: string; icone: NomeIcone; titulo: string; texto: string; destaque?: boolean }) {
  return (
    <Link
      href={href}
      className={cn("toque flex items-center gap-4 rounded-card bg-s1 p-4", destaque && "outline-2 outline-ac")}
    >
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-ctl", destaque ? "bg-ac text-on-ac" : "bg-s2 text-tx")}>
        <Icone nome={icone} />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="t-destaque">{titulo}</span>
        <span className="t-rotulo text-tx2">{texto}</span>
      </span>
      <Icone nome="next" tamanho={20} className="text-mut" />
    </Link>
  );
}

export default function BoasVindas() {
  const conta = useConta();
  const perfil = usePerfil();
  const nome = (perfil?.nome || (conta.estado === "dentro" ? conta.nome : "")).split(" ")[0];
  return (
    <PaginaCheia>
      <div className="flex flex-col gap-2 pt-16">
        <h1 className="t-tela">{nome ? `Oi, ${nome}` : "Oi"}</h1>
        <p className="t-corpo text-tx2">Por onde você quer começar?</p>
      </div>
      <Opcao href="/importar/?origem=inicio" icone="upload" titulo="Trazer meu histórico" texto="Use o backup do app antigo. Treinos, sono, medidas e plano entram de uma vez." destaque />
      <Opcao href="/boas-vindas/plano/" icone="dumbbell" titulo="Começar do zero" texto="Escolha um plano pronto da biblioteca e ajuste do seu jeito." />
      <p className="t-legenda text-mut">Dá para importar depois em Ajustes › Conta.</p>
    </PaginaCheia>
  );
}
