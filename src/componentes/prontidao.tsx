import type { NivelProntidao } from "@/lib/dominio/tipos";
import { cn } from "@/lib/util/cn";

const COR = {
  verde: { barra: "bg-ok", texto: "text-ok-tx", fundo: "bg-ok-tint", palavra: "Prontidão verde" },
  amarelo: { barra: "bg-warn", texto: "text-warn-tx", fundo: "bg-warn-tint", palavra: "Prontidão amarela" },
  vermelho: { barra: "bg-bad", texto: "text-bad-tx", fundo: "bg-bad-tint", palavra: "Prontidão vermelha" },
} as const;

const ACESAS = { verde: 3, amarelo: 2, vermelho: 1 } as const;

/** Três barras crescentes: nunca só pela cor. */
export function Barras({ nivel, tamanho = 18 }: { nivel: NivelProntidao; tamanho?: number }) {
  const c = COR[nivel];
  return (
    <span className="flex items-end gap-[3px]" aria-hidden="true" style={{ height: tamanho }}>
      {[0.45, 0.72, 1].map((h, i) => (
        <span key={i} className={cn("w-[5px] rounded-[2px]", i < ACESAS[nivel] ? c.barra : "bg-s3")} style={{ height: tamanho * h }} />
      ))}
    </span>
  );
}

export function SinalProntidao({ nivel, motivo }: { nivel: NivelProntidao; motivo: string }) {
  const c = COR[nivel];
  return (
    <div className={cn("flex items-center gap-3 rounded-card p-4", c.fundo)}>
      <Barras nivel={nivel} tamanho={22} />
      <p className="flex flex-col">
        <span className={cn("t-destaque", c.texto)}>{c.palavra}</span>
        <span className="t-rotulo text-tx2">{motivo}</span>
      </p>
    </div>
  );
}

export function PilulaProntidao({ nivel, aoTocar }: { nivel: NivelProntidao; aoTocar?: () => void }) {
  const c = COR[nivel];
  return (
    <button
      type="button"
      onClick={aoTocar}
      className={cn("toque t-rotulo flex min-h-11 items-center gap-2 rounded-full px-4 font-semibold", c.fundo, c.texto)}
    >
      <Barras nivel={nivel} tamanho={16} />
      {c.palavra}
    </button>
  );
}
