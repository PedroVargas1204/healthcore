"use client";

import { useEffect, useMemo, useState } from "react";
import { Botao } from "./ui/botao";
import { Folha, Segmentado } from "./ui/pecas";
import { COSTAS, FRENTE, type Vista } from "@/lib/dominio/corpo";
import type { Regiao } from "@/lib/dominio/volume";
import { fmtKg } from "@/lib/util/formato";
import { cn } from "@/lib/util/cn";

export type DadosAdesivo = {
  nome: string;
  minutos: number;
  series: number;
  prim: Set<Regiao>;
  sec: Set<Regiao>;
  recordes: { nome: string; kg: number; reps: number }[];
};

type Estilo = "mapa-numeros" | "mapa" | "numeros" | "recorde" | "recordes";
const NOMES: Record<Estilo, string> = { "mapa-numeros": "mapa e números", mapa: "só o mapa", numeros: "números", recorde: "recorde", recordes: "todos os recordes" };

function familia(variavel: string, reserva: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(variavel).trim();
  return v ? `${v}, ${reserva}` : reserva;
}

/** Desenha o adesivo num canvas transparente (1080 px de largura) e devolve o canvas. */
async function desenhar(estilo: Estilo, d: DadosAdesivo, corTexto: "branco" | "preto") {
  const disp = familia("--fonte-disp", "'Arial Narrow', sans-serif");
  await Promise.all([document.fonts.load(`800 80px ${disp}`), document.fonts.load(`700 40px ${disp}`)]).catch(() => {});
  const W = 1080;
  const tinta = corTexto === "branco" ? "#FFFFFF" : "#111214";
  const sombra = corTexto === "branco" ? "rgba(0,0,0,.45)" : "rgba(255,255,255,.5)";
  const temMapa = estilo === "mapa" || estilo === "mapa-numeros";
  const H = estilo === "mapa" ? 1000 : estilo === "mapa-numeros" ? 1320 : estilo === "numeros" ? 620 : estilo === "recorde" ? 640 : 340 + d.recordes.length * 120;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  const texto = (t: string, y: number, tam: number, peso = 800, cor = tinta) => {
    g.font = `${peso} ${tam}px ${disp}`;
    g.shadowColor = sombra;
    g.shadowBlur = 18;
    g.fillStyle = cor;
    g.fillText(t, W / 2, y);
    g.shadowBlur = 0;
  };
  const marca = (y: number) => {
    g.font = `800 44px ${disp}`;
    const a = "HEALTH";
    const b = "CORE";
    const wa = g.measureText(a).width;
    const wb = g.measureText(b).width;
    const x0 = W / 2 - (wa + wb) / 2;
    g.textAlign = "left";
    g.shadowColor = sombra;
    g.shadowBlur = 14;
    g.fillStyle = tinta;
    g.fillText(a, x0, y);
    g.fillStyle = "#FF4D2E";
    g.fillText(b, x0 + wa, y);
    g.shadowBlur = 0;
    g.textAlign = "center";
  };
  let y = 0;
  if (temMapa) {
    const escala = 3.4;
    const largura = 120 * escala;
    const vazio = corTexto === "branco" ? "rgba(255,255,255,.28)" : "rgba(17,18,20,.28)";
    const figura = (v: Vista, x: number) => {
      g.save();
      g.translate(x, 40);
      g.scale(escala, escala);
      g.shadowColor = "rgba(0,0,0,.35)";
      g.shadowBlur = 6;
      for (const [id, ds] of Object.entries(v)) {
        g.fillStyle = id === "base" ? (corTexto === "branco" ? "rgba(255,255,255,.55)" : "rgba(17,18,20,.55)") : d.prim.has(id as Regiao) ? "#FF4D2E" : d.sec.has(id as Regiao) ? "#B8452B" : vazio;
        for (const p of ds!) g.fill(new Path2D(p));
      }
      g.restore();
    };
    figura(FRENTE, W / 2 - largura - 30);
    figura(COSTAS, W / 2 + 30);
    y = 40 + 262 * escala + 40;
  }
  if (estilo === "mapa") marca(y + 40);
  if (estilo === "mapa-numeros") {
    texto(d.nome.toUpperCase(), y + 90, 104);
    texto(`${d.minutos} MIN · ${d.series} SÉRIES${d.recordes.length ? ` · ${d.recordes.length} ${d.recordes.length === 1 ? "RECORDE" : "RECORDES"}` : ""}`, y + 170, 58, 700);
    marca(y + 250);
  }
  if (estilo === "numeros") {
    texto(d.nome.toUpperCase(), 110, 88);
    const cols = [
      ["TEMPO", `${d.minutos}m`],
      ["SÉRIES", String(d.series)],
      ["RECORDES", String(d.recordes.length)],
    ];
    cols.forEach(([r, v], i) => {
      const x = W / 2 + (i - 1) * 320;
      g.font = `700 40px ${disp}`;
      g.shadowColor = sombra;
      g.shadowBlur = 12;
      g.fillStyle = tinta;
      g.fillText(r!, x, 250);
      g.font = `800 150px ${disp}`;
      g.fillText(v!, x, 410);
      g.shadowBlur = 0;
    });
    marca(540);
  }
  if (estilo === "recorde" && d.recordes[0]) {
    const r = d.recordes[0];
    texto("RECORDE", 110, 60, 800, "#FF4D2E");
    texto(r.nome.toUpperCase(), 210, 76, 700);
    texto(`${fmtKg(r.kg)} KG × ${r.reps}`, 400, 180);
    marca(540);
  }
  if (estilo === "recordes") {
    texto(d.recordes.length === 1 ? "RECORDE" : `${d.recordes.length} RECORDES`, 100, 60, 800, "#FF4D2E");
    d.recordes.forEach((r, i) => texto(`${r.nome.toUpperCase()}  ${fmtKg(r.kg)} × ${r.reps}`, 220 + i * 120, 64, 700));
    marca(H - 50);
  }
  return c;
}

const paraBlob = (c: HTMLCanvasElement) => new Promise<Blob>((ok, falha) => c.toBlob((b) => (b ? ok(b) : falha(new Error("sem imagem"))), "image/png"));

export function FolhaAdesivo({ aberta, aoMudar, dados, aoAviso }: { aberta: boolean; aoMudar: (v: boolean) => void; dados: DadosAdesivo; aoAviso: (m: string) => void }) {
  const estilos = useMemo<Estilo[]>(() => (dados.recordes.length ? ["mapa-numeros", "mapa", "numeros", "recorde", "recordes"] : ["mapa-numeros", "mapa", "numeros"]), [dados.recordes.length]);
  const [estilo, setEstilo] = useState<Estilo>("mapa-numeros");
  const [cor, setCor] = useState<"branco" | "preto">("branco");
  const [imagens, setImagens] = useState<Partial<Record<Estilo, string>>>({});

  useEffect(() => {
    if (!aberta) return;
    let vivo = true;
    (async () => {
      const out: Partial<Record<Estilo, string>> = {};
      for (const e of estilos) out[e] = (await desenhar(e, dados, cor)).toDataURL("image/png");
      if (vivo) setImagens(out);
    })();
    return () => {
      vivo = false;
    };
  }, [aberta, estilos, dados, cor]);

  async function copiar() {
    // O iPhone exige que a cópia comece dentro do toque: o ClipboardItem recebe a promessa da imagem.
    try {
      const blob = desenhar(estilo, dados, cor).then(paraBlob);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      aoAviso("Adesivo copiado. No story, toque e segure e escolha Colar.");
    } catch {
      aoAviso("Não deu para copiar aqui. Use Salvar na galeria.");
    }
  }

  async function salvar() {
    const blob = await paraBlob(await desenhar(estilo, dados, cor));
    const arquivo = new File([blob], `healthcore-${estilo}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo] });
      } catch {
        /* cancelou */
      }
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = arquivo.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const xadrez = { backgroundImage: "repeating-conic-gradient(#2a2c31 0% 25%, #1f2125 0% 50%)", backgroundSize: "24px 24px" };

  return (
    <Folha aberta={aberta} aoMudar={aoMudar} titulo="Adesivo para o story" rotuloCancelar="Fechar">
      <div className="flex min-h-64 items-center justify-center rounded-card p-4" style={xadrez}>
        {imagens[estilo] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagens[estilo]} alt={`Adesivo: ${NOMES[estilo]}`} className="max-h-80 w-auto" />
        ) : (
          <span className="t-rotulo text-mut">Desenhando…</span>
        )}
      </div>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5" role="radiogroup" aria-label="Estilo do adesivo">
        {estilos.map((e) => (
          <button
            key={e}
            type="button"
            role="radio"
            aria-checked={estilo === e}
            aria-label={NOMES[e]}
            onClick={() => setEstilo(e)}
            className={cn("flex h-24 w-24 shrink-0 items-center justify-center rounded-ctl p-1.5", estilo === e ? "outline-2 outline-ac" : "")}
            style={xadrez}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {imagens[e] && <img src={imagens[e]} alt="" className="max-h-full max-w-full" />}
          </button>
        ))}
      </div>
      <p className="t-legenda text-mut">{estilos.map((e) => NOMES[e]).join(" · ")}</p>
      <Segmentado
        rotulo="Cor do texto"
        valor={cor}
        aoMudar={setCor}
        opcoes={[
          { valor: "branco", rotulo: "Texto branco" },
          { valor: "preto", rotulo: "Texto preto" },
        ]}
      />
      <div className="grid grid-cols-2 gap-2">
        <Botao tipo="secundario" icone="download" onClick={salvar}>
          Salvar na galeria
        </Botao>
        <Botao icone="copiar" onClick={copiar}>
          Copiar
        </Botao>
      </div>
      <p className="t-rotulo text-tx2">
        No Instagram, abra o story com a sua foto, toque e segure na tela e escolha <b>Colar</b>. O adesivo entra com fundo transparente e dá para mover e girar.
      </p>
    </Folha>
  );
}
