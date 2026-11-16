"use client";

import Link from "next/link";
import { useState } from "react";
import { PaginaCheia } from "@/componentes/estrutura";
import { Abertura } from "@/componentes/provedores";
import { Botao, BotaoIcone } from "@/componentes/ui/botao";
import { Icone, type NomeIcone } from "@/componentes/ui/icone";
import { Campo, Confirmar, Folha, Interruptor } from "@/componentes/ui/pecas";
import { useAvisoCurto } from "@/componentes/ui/aviso-curto";
import { useBase } from "@/lib/dados/base";
import { salvarConfig, salvarPerfil } from "@/lib/dados/repo";
import { CAMPOS, PADRAO } from "@/lib/dominio/recomendacao";
import type { ChaveRegra } from "@/lib/dominio/regras";
import { dataCurta } from "@/lib/util/datas";
import { fmt, lerNumero, mmss } from "@/lib/util/formato";

function Linha({ href, icone, titulo, sub }: { href: string; icone: NomeIcone; titulo: string; sub: string }) {
  return (
    <Link href={href} className="flex min-h-16 items-center gap-3 border-b border-line px-4 py-3 last:border-0">
      <Icone nome={icone} className="text-mut" />
      <span className="flex flex-1 flex-col">
        <span className="t-destaque">{titulo}</span>
        <span className="t-legenda text-mut">{sub}</span>
      </span>
      <Icone nome="next" tamanho={18} className="text-mut" />
    </Link>
  );
}

export default function Ajustes() {
  const base = useBase();
  const aviso = useAvisoCurto();
  const [aberto, setAberto] = useState<string | null>(null);
  const [perfil, setPerfil] = useState(false);
  const [nome, setNome] = useState("");
  const [altura, setAltura] = useState("");
  const [restaurar, setRestaurar] = useState(false);
  if (!base) return <Abertura />;

  const r = base.regras;
  const grupos = [...new Set(CAMPOS.map((c) => c.g))];
  const valor = (k: ChaveRegra, un: string) => {
    const v = r[k] ?? 0;
    if (/^incPct/.test(k) && !v) return "Desligado";
    return un === "s" ? mmss(v) : `${fmt(v, 2)}${un ? (un === "%" || un === "/5" ? "" : " ") + un : ""}`;
  };
  const mudarRegra = (k: string, v: number) => salvarConfig({ regras: { ...base.config.regras, [k]: v } });
  const calib = base.calibracoes[base.calibracoes.length - 1];

  return (
    <PaginaCheia voltar={{ href: "/", rotulo: "Hoje" }}>
      <h1 className="t-tela">Ajustes</h1>

      <section className="flex flex-col gap-2">
        <h2 className="t-h2">Perfil e conta</h2>
        <div className="flex flex-col rounded-card bg-s1">
          <button
            type="button"
            onClick={() => {
              setNome(base.perfil.nome);
              setAltura(base.perfil.altura_cm ? String(base.perfil.altura_cm) : "");
              setPerfil(true);
            }}
            className="flex min-h-16 items-center gap-3 border-b border-line px-4 py-3 text-left"
          >
            <Icone nome="usuario" className="text-mut" />
            <span className="flex flex-1 flex-col">
              <span className="t-destaque">{base.perfil.nome || "Sem nome"}</span>
              <span className="t-legenda text-mut">{base.perfil.altura_cm ? `${fmt(base.perfil.altura_cm / 100, 2)} m` : "Altura não informada"}</span>
            </span>
            <span className="t-rotulo font-semibold text-ac-tx">Editar</span>
          </button>
          <Linha href="/ajustes/conta/" icone="nuvem" titulo="Conta e dados" sub="Backup, importar, sair e apagar" />
          <Linha href="/ajustes/medidas/" icone="regua" titulo="Medidas" sub={`${base.medidas.length} ${base.medidas.length === 1 ? "registro" : "registros"} de peso, cintura e ombro`} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="t-h2">Treino</h2>
        <div className="rounded-card bg-s1 px-4 py-1">
          <Interruptor marcado={base.config.som_descanso} aoMudar={(v) => salvarConfig({ som_descanso: v })} rotulo="Som no fim do descanso" descricao="No iPhone o celular não vibra e o som só toca com o app aberto." />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="t-h2">Regras da recomendação</h2>
        <p className="t-rotulo text-tx2">Todos os números que o app usa para sugerir carga. Mude e a próxima sugestão já usa o valor novo.</p>
        {calib && (
          <p className="t-rotulo rounded-card bg-s1 p-4 text-tx2">
            Limites de sono pessoais aplicados em {dataCurta(calib.aplicada_em)} (queda de {fmt(calib.queda_pct)}% abaixo de {fmt(calib.limiar_h)} h).
          </p>
        )}
        {grupos.map((g) => {
          const ab = aberto === g;
          return (
            <div key={g} className="rounded-card bg-s1">
              <button type="button" aria-expanded={ab} onClick={() => setAberto(ab ? null : g)} className="flex min-h-14 w-full items-center justify-between px-4 text-left">
                <span className="t-destaque">{g}</span>
                <Icone nome={ab ? "up" : "down"} tamanho={18} className="text-mut" />
              </button>
              {ab &&
                CAMPOS.filter((c) => c.g === g).map((c) => {
                  const v = r[c.k] ?? 0;
                  return (
                    <div key={c.k} className="flex min-h-16 items-center gap-2 border-t border-line px-4 py-2">
                      <span className="t-rotulo flex-1">{c.rot}</span>
                      <BotaoIcone icone="menos" rotulo={`Menos em ${c.rot}`} disabled={v <= c.min} className="disabled:opacity-30" onClick={() => mudarRegra(c.k, Math.max(c.min, Math.round((v - c.passo) * 100) / 100))} />
                      <span className="t-rotulo tab-num min-w-16 text-center font-semibold">{valor(c.k, c.un)}</span>
                      <BotaoIcone icone="mais" rotulo={`Mais em ${c.rot}`} disabled={v >= c.max} className="disabled:opacity-30" onClick={() => mudarRegra(c.k, Math.min(c.max, Math.round((v + c.passo) * 100) / 100))} />
                    </div>
                  );
                })}
            </div>
          );
        })}
        <Botao tipo="secundario" onClick={() => setRestaurar(true)}>
          Restaurar valores padrão
        </Botao>
      </section>

      <p className="t-legenda pt-4 text-center text-mut">HealthCore 1.0 · versão Next.js</p>

      <Folha
        aberta={perfil}
        aoMudar={setPerfil}
        titulo="Perfil"
        acao={{
          rotulo: "Salvar",
          aoTocar: async () => {
            const h = lerNumero(altura);
            if (altura.trim() && (!Number.isFinite(h) || h < 120 || h > 230)) return aviso("Altura em centímetros, de 120 a 230.");
            await salvarPerfil({ nome: nome.trim().slice(0, 80), altura_cm: altura.trim() ? Math.round(h * 10) / 10 : null });
            setPerfil(false);
            aviso("Perfil salvo.");
          },
        }}
      >
        <label className="flex flex-col gap-2">
          <span className="t-destaque">Nome</span>
          <input value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} className="t-corpo min-h-12 rounded-ctl bg-s2 px-4" />
        </label>
        <Campo rotulo="Altura" unidade="cm" inputMode="decimal" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="175" />
      </Folha>
      <Confirmar
        aberta={restaurar}
        aoMudar={setRestaurar}
        titulo="Restaurar as regras?"
        texto="Todos os números voltam ao padrão do app, inclusive os limites de sono calibrados."
        sim="Restaurar"
        aoConfirmar={async () => {
          await salvarConfig({ regras: { ...PADRAO } });
          aviso("Regras restauradas.");
        }}
      />
    </PaginaCheia>
  );
}
