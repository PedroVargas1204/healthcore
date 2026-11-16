import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/util/cn";
import { Icone, type NomeIcone } from "./icone";

const estilos = cva(
  "toque inline-flex items-center justify-center gap-2 select-none disabled:cursor-not-allowed",
  {
    variants: {
      tipo: {
        principal: "t-botao min-h-14 rounded-ctl bg-ac px-5 text-on-ac active:bg-ac-press disabled:bg-s3 disabled:text-dim",
        secundario: "t-destaque min-h-12 rounded-ctl bg-s2 px-4 text-tx disabled:text-dim",
        discreto: "t-destaque min-h-11 min-w-11 px-1 text-ac-tx disabled:text-dim",
        perigo: "t-destaque min-h-12 rounded-ctl bg-bad-tint px-4 text-bad-tx",
        perigoCheio: "t-botao min-h-14 rounded-ctl bg-bad px-5 text-on-ac",
        escuro: "t-botao min-h-14 rounded-ctl bg-ink px-5 text-white",
      },
      largura: { auto: "", cheia: "w-full" },
    },
    defaultVariants: { tipo: "principal", largura: "auto" },
  },
);

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof estilos> & { icone?: NomeIcone; carregando?: boolean; textoCarregando?: string };

export function Botao({ tipo, largura, icone, carregando, textoCarregando, className, children, disabled, ...resto }: Props) {
  return (
    <button
      type="button"
      className={cn(estilos({ tipo, largura }), className)}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...resto}
    >
      {carregando ? (
        <span
          aria-hidden="true"
          className="size-5 rounded-full border-[3px] border-current border-r-transparent"
          style={{ animation: "giro 0.8s linear infinite" }}
        />
      ) : icone ? (
        <Icone nome={icone} tamanho={icone === "play" ? 16 : 22} />
      ) : null}
      {carregando && textoCarregando ? textoCarregando : children}
    </button>
  );
}

export function BotaoIcone({
  icone,
  rotulo,
  className,
  plano,
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icone: NomeIcone; rotulo: string; plano?: boolean }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      className={cn("toque flex size-11 shrink-0 items-center justify-center rounded-ctl text-tx", plano ? "bg-transparent" : "bg-s2", className)}
      {...resto}
    >
      <Icone nome={icone} />
    </button>
  );
}
