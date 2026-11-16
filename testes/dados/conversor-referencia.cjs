// Converte o backup do app antigo (formato v2) no pedido de importar_backup.
// Ids determinísticos (UUID v5 a partir do id antigo e da conta): importar de novo não duplica.
// Esta é a versão de referência para testar o banco; na Fase 3 ela vira TypeScript com testes.
const crypto = require('crypto');

const NS = '6f1c2a3e-9b7d-5e41-8a2c-4d3b5e6f7a80'; // espaço de nomes fixo do HealthCore
const CHAVES_REGRAS = ['sonoVerdeMedia', 'sonoVerdeNoite', 'sonoAmareloNoite', 'sonoVermelhoMedia', 'sonoCritico', 'noitesCriticas',
  'sessoesRelato', 'rir0Frequente', 'energiaBaixa', 'dorMuscVermelho', 'rirSubir', 'isoSessoesTopo', 'vezesAbaixo', 'reducaoAbaixo',
  'reducaoVermelho', 'saltoMaxLateral', 'incCompHalteres', 'incCompBarra', 'incCompMaquina', 'incCompPolia', 'incPctComp',
  'incIsoHalteres', 'incIsoBarra', 'incIsoMaquina', 'incIsoPolia', 'incPctIso', 'estagnacaoSessoes', 'semanasDeload',
  'deloadVolume', 'deloadCarga', 'descComposto', 'descIsolado', 'calibMinSemanas', 'calibMinSessoes'];

function uuidv5(nome, ns = NS) {
  const nsBytes = Buffer.from(ns.replace(/-/g, ''), 'hex');
  const h = crypto.createHash('sha1').update(Buffer.concat([nsBytes, Buffer.from(nome, 'utf8')])).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}

const somarDias = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const num = (v) => (Number.isFinite(v) ? v : null);
const textoOuNull = (s) => (typeof s === 'string' && s.trim() ? s.trim() : null);

function converter(backup, uid) {
  if (!backup || backup.app !== 'healthcore' || !backup.E) throw new Error('O arquivo não é um backup do HealthCore.');
  const E = backup.E, T = Array.isArray(backup.T) ? backup.T : [];
  const id = (tipo, antigo) => uuidv5(`${uid}:${tipo}:${antigo}`);
  const idTreino = (antigo) => (antigo && E.treinos[antigo] ? id('treino', antigo) : null);
  const rec = E.config && E.config.rec ? E.config.rec : {};
  const regras = Object.fromEntries(CHAVES_REGRAS.filter((k) => Number.isFinite(rec[k])).map((k) => [k, rec[k]]));
  const ordem = Array.isArray(E.ordem) && E.ordem.length ? E.ordem : Object.keys(E.treinos || {});

  const treinos = ordem.filter((k) => E.treinos[k]).map((k, i) => {
    const t = E.treinos[k];
    const cond = t.tipo === 'cond';
    return {
      id: id('treino', k), nome: t.nome, tipo: cond ? 'cond' : 'forca', tags: (t.tags || []).filter((x) => x === 'pernas' || x === 'hyrox'),
      voltas: cond ? num(t.voltas) : null, descanso_voltas_s: cond ? num(t.descanso) : null,
      finalizador_id: idTreino(t.finalizador), obs: textoOuNull(t.obs), posicao: i,
      exercicios: (t.ex || []).map((e) => ({ ex_chave: e.exId, series: e.series, reps: String(e.reps), descanso_s: num(e.desc), obs: textoOuNull(e.obs), cat: e.cat === 'iso' ? 'iso' : 'comp' })),
      estacoes: (t.itens || []).map((s) => ({ nome: s.nome, alvo: textoOuNull(s.alvo), substituto: textoOuNull(s.sub) })),
    };
  });

  const sessoes = T.map((s) => {
    const dor = s.dorArt || { sim: false, onde: '', ex: [] };
    const dorEx = Array.isArray(dor.ex) ? dor.ex : [];
    // Regra nova: dor articular precisa do exercício. Registro antigo sem exercício vira observação.
    const dorSemEx = dor.sim && !dorEx.length;
    const obs = [textoOuNull(s.obs), dorSemEx ? `Dor articular sem exercício marcado${dor.onde ? `: ${dor.onde}` : ''}.` : null].filter(Boolean).join(' ') || null;
    const cond = s.tipo === 'cond' ? s.cond || {} : null;
    return {
      id: id('sessao', s.id), tipo: s.tipo === 'cond' ? 'cond' : 'forca', treino_id: idTreino(s.treinoId), nome: s.nome || 'Treino',
      data: s.data, inicio: s.inicio ? new Date(s.inicio).toISOString() : null, fim: s.fim ? new Date(s.fim).toISOString() : null,
      duracao_min: num(s.duracaoMin), kcal: num(s.kcal), energia: num(s.energia), dor_muscular: num(s.dorMusc),
      dor_articular: !!(dor.sim && dorEx.length), dor_articular_onde: dor.sim && dorEx.length ? textoOuNull(dor.onde) : null,
      dor_articular_ex: dor.sim ? dorEx : [], obs, prontidao: s.prontidao ? s.prontidao.nivel : null,
      prontidao_motivo: s.prontidao ? textoOuNull(s.prontidao.motivo) : null, em_deload: !!s.deload,
      tempo_total_s: cond ? num(cond.tempoTotal) : null, voltas_plan: cond ? num(cond.voltasPlan) : null,
      voltas_feitas: cond ? num(cond.voltasFeitas) : null, rpe: cond ? num(cond.rpe) : null,
      sugestao_motivo: s.sug && s.sug.motivo ? s.sug.motivo : null,
      exercicios: (s.ex || []).map((e) => ({
        ex_chave: e.id, cat: e.cat === 'iso' ? 'iso' : 'comp', alvo: e.alvo ? String(e.alvo) : null,
        sugestao: e.sug || null, sugestao_aceita: typeof e.sugAceita === 'boolean' ? e.sugAceita : null,
        series: (e.series || []).map((r) => ({ kg: num(r.kg) ?? 0, reps: num(r.reps) ?? 0, rir: num(r.rir) })),
      })),
      tempos: cond && Array.isArray(cond.marcos) ? cond.marcos.map((m) => ({ volta: m.v, estacao_pos: m.i, nome: m.nome || null, seg: m.seg })) : [],
    };
  });

  const noites = Object.entries(E.sono || {}).map(([data, n]) => ({ id: id('noite', data), data, horas: n.h, qualidade: num(n.q), score: num(n.score) }));
  const medidas = (E.medidas || []).map((m) => ({ id: id('medida', m.id || m.data), data: m.data, peso_kg: num(m.peso), cintura_cm: num(m.cintura), ombro_cm: num(m.ombro), gordura_pct: num(m.bf) }));
  const inicios = new Set([...(E.deloads || []), ...(E.deload ? [E.deload.inicio] : [])]);
  const deloads = [...inicios].map((d) => ({ id: id('deload', d), inicio: d, fim: E.deload && E.deload.inicio === d ? E.deload.fim : somarDias(d, 6) }));
  const calibracoes = E.calibracao ? [{ id: id('calibracao', E.calibracao.em), aplicada_em: E.calibracao.em, limiar_h: E.calibracao.limiar, queda_pct: E.calibracao.queda, sessoes: E.calibracao.sessoes || 0 }] : [];
  const exercicios_proprios = Object.entries(E.exCustom || {}).map(([chave, x]) => ({
    id: id('exercicio', chave), chave, nome: x.nome, grupo: x.grupo, equip: x.equip, tipo: x.tipo === 'iso' ? 'iso' : 'comp',
    reps_padrao: x.reps || '10', musc: x.musc || [], sec: x.sec || [], sem_carga: !!x.semCarga,
  }));

  return {
    perfil: { nome: E.perfil && E.perfil.nome ? E.perfil.nome : '', altura_cm: E.perfil ? num(E.perfil.altura) : null, modelo: E.modelo || null, onboarding_concluido: true },
    configuracoes: { regras, som_descanso: !(E.config && E.config.som === false), deload_dispensado_ate: E.deloadDispensado || null, calibracao_dispensada_ate: E.calibDispensada || null },
    exercicios_proprios, treinos, semana: (E.semana || []).map(idTreino), sessoes, noites, medidas, deloads, calibracoes,
  };
}

module.exports = { converter, uuidv5 };
