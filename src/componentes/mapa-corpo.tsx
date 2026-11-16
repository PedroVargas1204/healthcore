import { COSTAS, FRENTE } from "@/lib/dominio/corpo";
import type { Regiao } from "@/lib/dominio/volume";

type Props = {
  lado: "frente" | "costas";
  largura: number;
  cor: (r: Regiao) => string;
  base: string;
  rotulo?: string;
};

/** Uma figura (frente ou costas). Cada músculo ganha a cor que `cor` devolver. */
export function Figura({ lado, largura, cor, base, rotulo }: Props) {
  const vista = lado === "frente" ? FRENTE : COSTAS;
  const altura = Math.round((largura * 262) / 120);
  return (
    <svg
      viewBox="0 0 120 262"
      width={largura}
      height={altura}
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
      style={{ display: "block", flexShrink: 0 }}
    >
      {Object.entries(vista).map(([id, ds]) =>
        ds!.map((d, i) => <path key={`${id}-${i}`} d={d} fill={id === "base" ? base : cor(id as Regiao)} />),
      )}
    </svg>
  );
}

/** Frente e costas lado a lado. */
export function Corpo({ largura, cor, base, rotulo, legenda }: { largura: number; cor: (r: Regiao) => string; base: string; rotulo?: string; legenda?: boolean }) {
  return (
    <div role={rotulo ? "img" : undefined} aria-label={rotulo} className="flex items-end justify-center gap-[6%]">
      <figure className="flex flex-col items-center gap-2">
        <Figura lado="frente" largura={largura} cor={cor} base={base} />
        {legenda && <figcaption className="t-legenda text-mut">Frente</figcaption>}
      </figure>
      <figure className="flex flex-col items-center gap-2">
        <Figura lado="costas" largura={largura} cor={cor} base={base} />
        {legenda && <figcaption className="t-legenda text-mut">Costas</figcaption>}
      </figure>
    </div>
  );
}

export const CORES_MAPA = ["var(--mapa-0)", "var(--mapa-1)", "var(--mapa-2)", "var(--mapa-3)", "var(--mapa-4)"] as const;
