"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/util/cn";
import { Icone, type NomeIcone } from "./ui/icone";
import { useEstadoSync } from "@/lib/dados/hooks";

export function Marca({ className }: { className?: string }) {
  return (
    <span className={cn("font-disp text-[1.375rem] font-extrabold tracking-[0.3px] uppercase", className)}>
      Health<span className="text-ac-tx">Core</span>
    </span>
  );
}

/** Topo das abas: marca, situação da nuvem e a engrenagem de Ajustes. */
export function Topo() {
  const sync = useEstadoSync();
  return (
    <div className="flex h-11 items-center justify-between">
      <Marca />
      <div className="flex items-center gap-2">
        {(sync.fase === "offline" || sync.fase === "erro") && (
          <Link
            href="/ajustes/conta/"
            className={cn("t-legenda flex min-h-11 items-center gap-1.5 rounded-full px-3 font-semibold", sync.fase === "offline" ? "text-warn-tx" : "text-bad-tx")}
            aria-label={sync.fase === "offline" ? `Sem internet: ${sync.pendentes} registros esperando para subir` : "Um registro não subiu para a nuvem"}
          >
            <Icone nome={sync.fase === "offline" ? "wifiOff" : "alerta"} tamanho={16} />
            {sync.fase === "offline" ? (sync.pendentes ? `${sync.pendentes} no celular` : "Sem internet") : "Erro ao salvar"}
          </Link>
        )}
        <Link href="/ajustes/" aria-label="Ajustes" className="toque flex size-11 items-center justify-center rounded-ctl bg-s2 text-tx">
          <Icone nome="gear" />
        </Link>
      </div>
    </div>
  );
}

export function TituloTela({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="t-tela">{children}</h1>
      {sub && <p className="t-rotulo text-mut">{sub}</p>}
    </div>
  );
}

const ABAS: { href: string; rotulo: string; icone: NomeIcone }[] = [
  { href: "/", rotulo: "Hoje", icone: "home" },
  { href: "/treinos/", rotulo: "Treinos", icone: "dumbbell" },
  { href: "/sono/", rotulo: "Sono", icone: "moon" },
  { href: "/historico/", rotulo: "Histórico", icone: "clock" },
  { href: "/progresso/", rotulo: "Progresso", icone: "chart" },
];

export function Abas() {
  const caminho = usePathname();
  const ativa = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href.slice(0, -1)));
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg pt-2 pb-[max(env(safe-area-inset-bottom),8px)]"
    >
      <div className="mx-auto grid max-w-[480px] grid-cols-5">
        {ABAS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            aria-current={ativa(a.href) ? "page" : undefined}
            className={cn("flex min-h-12 flex-col items-center gap-[3px] text-xs font-semibold", ativa(a.href) ? "text-ac-tx" : "text-mut")}
          >
            <Icone nome={a.icone} tamanho={24} traco={1.8} />
            {a.rotulo}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** Página com abas: margem de 20 px, largura máxima de 480 px e espaço para a barra de baixo. */
export function PaginaAba({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-5 pt-seguro pb-[calc(env(safe-area-inset-bottom)+96px)]">
      <Topo />
      {children}
    </main>
  );
}

/** Página cheia (sem abas), com voltar no topo. */
export function PaginaCheia({
  children,
  voltar,
  titulo,
  acao,
  className,
}: {
  children: React.ReactNode;
  voltar?: { rotulo?: string; href?: string; aoTocar?: () => void };
  titulo?: string;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-4 px-5 pt-seguro pb-seguro", className)}>
      {(voltar || titulo || acao) && (
        <div className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center">
          {voltar ? (
            voltar.href ? (
              <Link href={voltar.href} className="t-corpo flex min-h-11 items-center gap-1 justify-self-start text-mut">
                <Icone nome="prev" tamanho={20} />
                {voltar.rotulo ?? "Voltar"}
              </Link>
            ) : (
              <button type="button" onClick={voltar.aoTocar} className="t-corpo flex min-h-11 items-center gap-1 justify-self-start text-mut">
                <Icone nome="prev" tamanho={20} />
                {voltar.rotulo ?? "Voltar"}
              </button>
            )
          ) : (
            <span />
          )}
          {titulo ? <span className="t-destaque text-center">{titulo}</span> : <span />}
          <div className="justify-self-end">{acao}</div>
        </div>
      )}
      {children}
    </main>
  );
}
