"use client";

import { Dialog, AlertDialog, Switch } from "radix-ui";
import { useId } from "react";
import { cn } from "@/lib/util/cn";
import { Botao } from "./botao";
import { Icone, type NomeIcone } from "./icone";

/* ---------- Cartão ---------- */
export function Cartao({ className, children, ...r }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("flex flex-col gap-3 rounded-card bg-s1 p-4", className)} {...r}>
      {children}
    </section>
  );
}

/* ---------- Folha (sheet): alça, Cancelar, título, ação ---------- */
export function Folha({
  aberta,
  aoMudar,
  titulo,
  acao,
  children,
  rotuloCancelar = "Cancelar",
}: {
  aberta: boolean;
  aoMudar: (v: boolean) => void;
  titulo: string;
  acao?: { rotulo: string; aoTocar: () => void; desativada?: boolean };
  children: React.ReactNode;
  rotuloCancelar?: string;
}) {
  return (
    <Dialog.Root open={aberta} onOpenChange={aoMudar}>
      <Dialog.Portal>
        <Dialog.Overlay className="veu fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content
          aria-describedby={undefined}
          className="folha fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-[480px] flex-col rounded-t-folha bg-s1 pb-seguro focus:outline-none"
        >
          <div className="flex justify-center pt-2" aria-hidden="true">
            <span className="h-1.5 w-10 rounded-full bg-s3" />
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 pt-1">
            <Dialog.Close className="t-corpo min-h-11 justify-self-start px-2 text-mut">{rotuloCancelar}</Dialog.Close>
            <Dialog.Title className="t-destaque text-center">{titulo}</Dialog.Title>
            {acao ? (
              <button
                type="button"
                onClick={acao.aoTocar}
                disabled={acao.desativada}
                className="t-destaque min-h-11 justify-self-end px-2 text-ac-tx disabled:text-dim"
              >
                {acao.rotulo}
              </button>
            ) : (
              <span />
            )}
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto px-5 pt-3 pb-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------- Confirmação ---------- */
export function Confirmar({
  aberta,
  aoMudar,
  titulo,
  texto,
  sim,
  nao = "Cancelar",
  perigo,
  aoConfirmar,
  aoRecusar,
}: {
  aberta: boolean;
  aoMudar: (v: boolean) => void;
  titulo: string;
  texto: React.ReactNode;
  sim: string;
  nao?: string;
  perigo?: boolean;
  aoConfirmar: () => void;
  aoRecusar?: () => void;
}) {
  return (
    <AlertDialog.Root open={aberta} onOpenChange={aoMudar}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="veu fixed inset-0 z-40 bg-black/60" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-40px)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-card bg-s1 p-5">
          <AlertDialog.Title className="t-h2">{titulo}</AlertDialog.Title>
          <AlertDialog.Description className="t-corpo text-tx2">{texto}</AlertDialog.Description>
          <div className="grid grid-cols-2 gap-3">
            <AlertDialog.Cancel asChild>
              <Botao tipo="secundario" onClick={aoRecusar}>
                {nao}
              </Botao>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Botao tipo={perigo ? "perigoCheio" : "principal"} className="t-destaque min-h-12 normal-case" onClick={aoConfirmar}>
                {sim}
              </Botao>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/* ---------- Controle segmentado (Semana · Mês · 3 meses) ---------- */
export function Segmentado<T extends string>({
  opcoes,
  valor,
  aoMudar,
  rotulo,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  aoMudar: (v: T) => void;
  rotulo: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex gap-1 rounded-ctl bg-s1 p-1">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={o.valor === valor}
          onClick={() => aoMudar(o.valor)}
          className={cn("t-rotulo min-h-11 flex-1 rounded-[6px] px-2", o.valor === valor ? "bg-s2 font-semibold text-tx" : "text-mut")}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

/* ---------- Chip (filtro ou escolha múltipla) ---------- */
export function Chip({ ativo, className, ...r }: React.ButtonHTMLAttributes<HTMLButtonElement> & { ativo: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={cn("toque t-rotulo min-h-11 rounded-full px-4 font-semibold", ativo ? "bg-ac text-on-ac" : "bg-s2 text-tx", className)}
      {...r}
    />
  );
}

/* ---------- Escala 1 a 5 (energia, dor) ---------- */
export function Escala({
  rotulo,
  valor,
  aoMudar,
  min = 1,
  max = 5,
  pontas,
}: {
  rotulo: string;
  valor: number | null;
  aoMudar: (v: number) => void;
  min?: number;
  max?: number;
  pontas?: [string, string];
}) {
  const id = useId();
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className="flex flex-col gap-2">
      <span id={id} className="t-destaque">
        {rotulo}
      </span>
      <div role="radiogroup" aria-labelledby={id} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${nums.length}, minmax(0, 1fr))` }}>
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            onClick={() => aoMudar(n)}
            className={cn("toque t-destaque tab-num min-h-12 rounded-ctl", valor === n ? "bg-ac text-on-ac" : "bg-s2 text-tx")}
          >
            {n}
          </button>
        ))}
      </div>
      {pontas && (
        <div className="t-legenda flex justify-between text-mut" aria-hidden="true">
          <span>{pontas[0]}</span>
          <span>{pontas[1]}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Avisos ---------- */
export function Aviso({
  tipo,
  titulo,
  children,
  acao,
  icone,
}: {
  tipo: "offline" | "erro" | "ok" | "info";
  titulo?: string;
  children?: React.ReactNode;
  acao?: { rotulo: string; aoTocar: () => void };
  icone?: NomeIcone;
}) {
  const estilo = {
    offline: "bg-warn-tint text-warn-tx",
    erro: "bg-bad-tint text-bad-tx",
    ok: "bg-ok-tint text-ok-tx",
    info: "bg-s1 text-tx2",
  }[tipo];
  const ic = icone ?? (tipo === "offline" ? "wifiOff" : tipo === "erro" ? "alerta" : tipo === "ok" ? "check" : "info");
  return (
    <div role={tipo === "erro" ? "alert" : "status"} className={cn("flex flex-col gap-3 rounded-card p-4", estilo)}>
      <p className="t-rotulo flex gap-2">
        <Icone nome={ic} tamanho={16} className="mt-0.5" />
        <span>
          {titulo && <b className="font-semibold">{titulo} </b>}
          {children}
        </span>
      </p>
      {acao && (
        <Botao tipo="secundario" className="self-start" onClick={acao.aoTocar}>
          {acao.rotulo}
        </Botao>
      )}
    </div>
  );
}

export function Esqueleto({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-s1 p-4" aria-hidden="true">
      {Array.from({ length: linhas }, (_, i) => (
        <span key={i} className="h-4 rounded bg-s2" style={{ width: `${[60, 85, 45, 70][i % 4]}%` }} />
      ))}
    </div>
  );
}

/* ---------- Interruptor ---------- */
export function Interruptor({ marcado, aoMudar, rotulo, descricao }: { marcado: boolean; aoMudar: (v: boolean) => void; rotulo: string; descricao?: string }) {
  const id = useId();
  return (
    <div className="flex min-h-12 items-center gap-3">
      <label htmlFor={id} className="flex flex-1 flex-col">
        <span className="t-corpo">{rotulo}</span>
        {descricao && <span className="t-legenda text-mut">{descricao}</span>}
      </label>
      <Switch.Root
        id={id}
        checked={marcado}
        onCheckedChange={aoMudar}
        className="relative h-8 w-13 shrink-0 rounded-full bg-s3 transition-colors data-[state=checked]:bg-ac"
      >
        <Switch.Thumb className="block size-6 translate-x-1 rounded-full bg-white transition-transform data-[state=checked]:translate-x-6" />
      </Switch.Root>
    </div>
  );
}

/* ---------- Campo com unidade fixa ---------- */
export function Campo({
  rotulo,
  unidade,
  className,
  id: idProp,
  ...r
}: React.InputHTMLAttributes<HTMLInputElement> & { rotulo: string; unidade?: string }) {
  const gerado = useId();
  const id = idProp ?? gerado;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="t-destaque">
        {rotulo}
      </label>
      <div className="flex min-h-14 items-center rounded-ctl bg-s2 px-4 focus-within:outline-2 focus-within:outline-ac-tx">
        <input
          id={id}
          className="t-h2 tab-num min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:font-semibold placeholder:text-mut"
          {...r}
        />
        {unidade && <span className="t-rotulo text-mut">{unidade}</span>}
      </div>
    </div>
  );
}

export function AreaTexto({ rotulo, id: idProp, ...r }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { rotulo: string }) {
  const gerado = useId();
  const id = idProp ?? gerado;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="t-destaque">
        {rotulo}
      </label>
      <textarea id={id} className="t-corpo min-h-24 rounded-ctl bg-s2 p-4 outline-none focus:outline-2 focus:outline-ac-tx" {...r} />
    </div>
  );
}
