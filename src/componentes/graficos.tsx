// Gráficos simples em SVG: barras começam no zero, eixo com rótulos, meta tracejada, resumo para leitor de tela.

import { fmt } from "@/lib/util/formato";

type Barra = { rotulo: string; valor: number | null; cor: string };

export function Barras({
  barras,
  meta,
  marcas,
  max,
  unidade,
  resumo,
  altura = 140,
  rotulosCada = 2,
}: {
  barras: Barra[];
  meta?: { valor: number; rotulo: string };
  marcas: number[];
  max: number;
  unidade: string;
  resumo: string;
  altura?: number;
  rotulosCada?: number;
}) {
  const W = 320;
  const H = altura;
  const esq = 28;
  const base = H - 20;
  const larg = (W - esq) / barras.length;
  const y = (v: number) => base - (v / max) * (base - 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={resumo} style={{ display: "block" }}>
      {marcas.map((m) => (
        <g key={m}>
          <line x1={esq} x2={W} y1={y(m)} y2={y(m)} stroke="var(--line)" strokeWidth="1" />
          <text x={esq - 6} y={y(m) + 4} textAnchor="end" fontSize="12" fill="var(--mut)">
            {fmt(m)}
            {m ? ` ${unidade}` : ""}
          </text>
        </g>
      ))}
      {barras.map((b, i) =>
        b.valor !== null && b.valor > 0 ? (
          <rect key={i} x={esq + i * larg + larg * 0.14} y={y(b.valor)} width={larg * 0.72} height={base - y(b.valor)} rx="3" fill={b.cor} />
        ) : null,
      )}
      {meta && <line x1={esq} x2={W} y1={y(meta.valor)} y2={y(meta.valor)} stroke="var(--ok)" strokeWidth="1.6" strokeDasharray="5 4" />}
      {barras.map((b, i) =>
        i % rotulosCada === rotulosCada - 1 || barras.length <= 8 ? (
          <text key={`r${i}`} x={esq + i * larg + larg / 2} y={H - 4} textAnchor="middle" fontSize="12" fill="var(--mut)">
            {b.rotulo}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export type Ponto = { x: number; y: number };

/** Linha com pontos. `media` desenha a média móvel das últimas 3 medidas sobre os pontos. */
export function Linha({
  pontos,
  rotulosX,
  casas = 1,
  resumo,
  altura = 120,
  media,
  destacarUltimo = true,
}: {
  pontos: Ponto[];
  rotulosX: { x: number; rotulo: string }[];
  casas?: number;
  resumo: string;
  altura?: number;
  media?: boolean;
  destacarUltimo?: boolean;
}) {
  if (!pontos.length) return null;
  const W = 320;
  const H = altura;
  const esq = 36;
  const base = H - 20;
  const xs = pontos.map((p) => p.x);
  const ys = pontos.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs, x0 + 1);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  if (y1 - y0 < 1e-9) {
    y0 -= 1;
    y1 += 1;
  }
  const pad = (y1 - y0) * 0.12;
  y0 -= pad;
  y1 += pad;
  const px = (x: number) => esq + ((x - x0) / (x1 - x0)) * (W - esq - 10);
  const py = (y: number) => base - ((y - y0) / (y1 - y0)) * (base - 10);
  const marcas = [y0 + pad, (y0 + y1) / 2, y1 - pad];
  const suave = media
    ? pontos.map((p, i) => ({ x: p.x, y: pontos.slice(Math.max(0, i - 2), i + 1).reduce((s, q) => s + q.y, 0) / Math.min(3, i + 1) }))
    : pontos;
  const caminho = suave.map((p, i) => `${i ? "L" : "M"}${px(p.x).toFixed(1)} ${py(p.y).toFixed(1)}`).join(" ");
  const ultimo = suave[suave.length - 1]!;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={resumo} style={{ display: "block" }}>
      {marcas.map((m, i) => (
        <g key={i}>
          <line x1={esq} x2={W} y1={py(m)} y2={py(m)} stroke="var(--line)" strokeWidth="1" />
          <text x={esq - 6} y={py(m) + 4} textAnchor="end" fontSize="12" fill="var(--mut)">
            {fmt(m, casas)}
          </text>
        </g>
      ))}
      {media && pontos.map((p, i) => <circle key={i} cx={px(p.x)} cy={py(p.y)} r="3.2" fill="none" stroke="var(--dim)" strokeWidth="1.5" />)}
      <path d={caminho} fill="none" stroke="var(--ac)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      {destacarUltimo && <circle cx={px(ultimo.x)} cy={py(ultimo.y)} r="5" fill="var(--ac)" />}
      {rotulosX.map((r, i) => (
        <text key={i} x={px(r.x)} y={H - 4} textAnchor="middle" fontSize="12" fill="var(--mut)">
          {r.rotulo}
        </text>
      ))}
    </svg>
  );
}
