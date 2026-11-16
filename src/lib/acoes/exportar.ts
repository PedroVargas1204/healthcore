// Exportar: backup completo (formato novo, que o próprio app importa de volta) e planilha CSV das séries.

import { banco } from "../dados/local";
import { lerConfig, lerPerfil } from "../dados/repo";
import { exInfo } from "../dominio/exercicios";
import { hojeK } from "../util/datas";

export async function montarBackup(uid: string) {
  const db = banco();
  const [treinos, sessoes, noites, medidas, deloads, calibracoes, proprios, semana, perfil, config] = await Promise.all([
    db.treinos.orderBy("posicao").toArray(),
    db.sessoes.toArray(),
    db.noites.toArray(),
    db.medidas.toArray(),
    db.deloads.toArray(),
    db.calibracoes.toArray(),
    db.exercicios_proprios.toArray(),
    db.semana.toArray(),
    lerPerfil(),
    lerConfig(),
  ]);
  const sem = [null, null, null, null, null, null, null] as (string | null)[];
  for (const d of semana) sem[d.dia] = d.treino_id;
  const limpar = <T extends { atualizado_em?: string; criado_em?: string }>(l: T[]) => l.map(({ atualizado_em: _a, criado_em: _c, ...r }) => r);
  return {
    app: "healthcore",
    v: 3,
    exportadoEm: new Date().toISOString(),
    conta: uid,
    dados: {
      perfil: { nome: perfil.nome, altura_cm: perfil.altura_cm, modelo: perfil.modelo, onboarding_concluido: true },
      configuracoes: {
        regras: config.regras,
        som_descanso: config.som_descanso,
        deload_dispensado_ate: config.deload_dispensado_ate,
        calibracao_dispensada_ate: config.calibracao_dispensada_ate,
      },
      exercicios_proprios: limpar(proprios),
      treinos: limpar(treinos),
      semana: sem,
      sessoes: limpar(sessoes),
      noites: limpar(noites),
      medidas: limpar(medidas),
      deloads: limpar(deloads),
      calibracoes: limpar(calibracoes),
    },
  };
}

export async function montarCsv() {
  const db = banco();
  const [sessoes, proprios] = await Promise.all([db.sessoes.toArray(), db.exercicios_proprios.toArray()]);
  sessoes.sort((a, b) => a.data.localeCompare(b.data) || (a.inicio ?? "").localeCompare(b.inicio ?? ""));
  const q = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const linhas = ["data,treino,exercicio,serie,kg,reps,rir,duracao_min,kcal"];
  for (const t of sessoes) {
    if (t.tipo === "forca") {
      for (const e of t.exercicios)
        e.series.forEach((s, i) =>
          linhas.push([t.data, q(t.nome), q(exInfo(e.ex_chave, proprios).nome), i + 1, s.kg, s.reps, s.rir ?? "", t.duracao_min ?? "", t.kcal ?? ""].join(",")),
        );
    } else linhas.push([t.data, q(t.nome), q("Condicionamento"), "", "", "", "", t.duracao_min ?? "", t.kcal ?? ""].join(","));
  }
  return { texto: linhas.join("\n"), sessoes: sessoes.length };
}

/** Entrega o arquivo: no iPhone abre a folha de compartilhar (Salvar em Arquivos); no computador, baixa. */
export async function entregarArquivo(nome: string, conteudo: string, tipo: string) {
  const arquivo = new File([conteudo], nome, { type: tipo });
  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo] });
      return true;
    } catch (e) {
      if ((e as Error).name === "AbortError") return false;
    }
  }
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return true;
}

export async function exportarBackup(uid: string) {
  const b = await montarBackup(uid);
  return entregarArquivo(`healthcore-backup-${hojeK()}.json`, JSON.stringify(b), "application/json");
}

export async function exportarCsv() {
  const { texto, sessoes } = await montarCsv();
  if (!sessoes) return null;
  return entregarArquivo(`healthcore-series-${hojeK()}.csv`, texto, "text/csv");
}
