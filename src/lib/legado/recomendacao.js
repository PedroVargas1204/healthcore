/* Cópia fiel do recomendacao.js do app antigo, só embrulhada como módulo.
   A Fase 4 substitui este arquivo pela versão em TypeScript com testes; até lá o app usa as regras de hoje sem mudança.
   Diferença única: LATERAIS vem do catálogo em vez de uma variável global. */
import { LATERAIS } from "../dominio/catalogo";
/* HealthCore — módulo de recomendação de carga.
   Funções puras: recebem dados e configuração e devolvem sugestões com o motivo.
   Nada aqui mexe na tela nem no armazenamento, para dar para ajustar as regras com calma depois.

   Formatos usados:
   - sono: { 'AAAA-MM-DD': { h: 7.5, q: 4, score: 82 } }  (a chave é o dia em que você acordou)
   - sessões: lista do mais recente para o mais antigo, cada uma com
       { tipo:'forca'|'cond', data, treinoId, energia, dorMusc, dorArt:{sim, ex:[ids]},
         ex:[{ id, cat, series:[{kg, reps, rir}] }], cond:{ tempoTotal } }
*/

export const Rec = (function(){

  /* Todos os números das regras. A tela de Ajustes edita estes valores. */
  const PADRAO = {
    sonoVerdeMedia:7, sonoVerdeNoite:6.5, sonoAmareloNoite:6, sonoVermelhoMedia:6, sonoCritico:5, noitesCriticas:2,
    sessoesRelato:2, rir0Frequente:50, energiaBaixa:2, dorMuscVermelho:4,
    rirSubir:1, isoSessoesTopo:2, vezesAbaixo:2, reducaoAbaixo:5, reducaoVermelho:7.5,
    incCompHalteres:2, incCompBarra:2.5, incCompMaquina:2.5, incCompPolia:2.5,
    incIsoHalteres:1, incIsoBarra:2.5, incIsoMaquina:2.5, incIsoPolia:2.5,
    incPctComp:0, incPctIso:0,
    saltoMaxLateral:10,
    estagnacaoSessoes:3, semanasDeload:6, deloadVolume:40, deloadCarga:0,
    descComposto:120, descIsolado:75,
    calibMinSemanas:4, calibMinSessoes:12
  };

  /* Descrição de cada número para a tela de Ajustes. */
  const CAMPOS = [
    {g:'Prontidão: sono', k:'sonoVerdeMedia', rot:'Verde: média de 7 dias a partir de', un:'h', min:4, max:10, passo:0.25},
    {g:'Prontidão: sono', k:'sonoVerdeNoite', rot:'Verde: noite anterior a partir de', un:'h', min:4, max:10, passo:0.25},
    {g:'Prontidão: sono', k:'sonoAmareloNoite', rot:'Amarelo: noite anterior abaixo de', un:'h', min:3, max:9, passo:0.25},
    {g:'Prontidão: sono', k:'sonoVermelhoMedia', rot:'Vermelho: média de 7 dias abaixo de', un:'h', min:3, max:9, passo:0.25},
    {g:'Prontidão: sono', k:'sonoCritico', rot:'Noite crítica: abaixo de', un:'h', min:2, max:8, passo:0.25},
    {g:'Prontidão: sono', k:'noitesCriticas', rot:'Vermelho: noites críticas na semana', un:'', min:1, max:7, passo:1},
    {g:'Prontidão: relatos', k:'sessoesRelato', rot:'Sessões olhadas nos relatos', un:'', min:1, max:5, passo:1},
    {g:'Prontidão: relatos', k:'rir0Frequente', rot:'RIR 0 frequente: séries com RIR 0 a partir de', un:'%', min:10, max:100, passo:5},
    {g:'Prontidão: relatos', k:'energiaBaixa', rot:'Energia baixa: até', un:'/5', min:1, max:4, passo:1},
    {g:'Prontidão: relatos', k:'dorMuscVermelho', rot:'Vermelho: dor muscular a partir de', un:'/5', min:2, max:5, passo:1},
    {g:'Progressão', k:'rirSubir', rot:'Composto: RIR mínimo para subir carga', un:'', min:0, max:4, passo:1},
    {g:'Progressão', k:'isoSessoesTopo', rot:'Isolado: sessões no topo da faixa para subir', un:'', min:1, max:5, passo:1},
    {g:'Progressão', k:'vezesAbaixo', rot:'Abaixo da faixa: vezes seguidas para reduzir', un:'', min:1, max:5, passo:1},
    {g:'Progressão', k:'reducaoAbaixo', rot:'Redução quando fica abaixo da faixa', un:'%', min:0, max:20, passo:0.5},
    {g:'Progressão', k:'reducaoVermelho', rot:'Redução de carga no dia vermelho', un:'%', min:0, max:20, passo:0.5},
    {g:'Progressão', k:'saltoMaxLateral', rot:'Elevação lateral: maior salto de carga aceito', un:'%', min:2, max:30, passo:1},
    {g:'Incrementos: compostos', k:'incCompHalteres', rot:'Halteres', un:'kg', min:0.5, max:10, passo:0.5},
    {g:'Incrementos: compostos', k:'incCompBarra', rot:'Barra', un:'kg', min:0.5, max:10, passo:0.5},
    {g:'Incrementos: compostos', k:'incCompMaquina', rot:'Máquina', un:'kg', min:0.5, max:10, passo:0.5},
    {g:'Incrementos: compostos', k:'incCompPolia', rot:'Polia', un:'kg', min:0.5, max:10, passo:0.5},
    {g:'Incrementos: compostos', k:'incPctComp', rot:'Ou subir por % da carga (arredonda para o passo acima)', un:'%', min:0, max:10, passo:0.5},
    {g:'Incrementos: isolados', k:'incIsoHalteres', rot:'Halteres', un:'kg', min:0.5, max:10, passo:0.5},
    {g:'Incrementos: isolados', k:'incIsoBarra', rot:'Barra', un:'kg', min:0.5, max:10, passo:0.5},
    {g:'Incrementos: isolados', k:'incIsoMaquina', rot:'Máquina', un:'kg', min:0.5, max:10, passo:0.5},
    {g:'Incrementos: isolados', k:'incIsoPolia', rot:'Polia', un:'kg', min:0.5, max:10, passo:0.5},
    {g:'Incrementos: isolados', k:'incPctIso', rot:'Ou subir por % da carga (arredonda para o passo acima)', un:'%', min:0, max:10, passo:0.5},
    {g:'Estagnação e deload', k:'estagnacaoSessoes', rot:'Sessões sem progresso para sugerir deload', un:'', min:2, max:8, passo:1},
    {g:'Estagnação e deload', k:'semanasDeload', rot:'Semanas seguidas de treino para sugerir deload', un:'', min:3, max:12, passo:1},
    {g:'Estagnação e deload', k:'deloadVolume', rot:'Deload: redução de séries', un:'%', min:10, max:70, passo:5},
    {g:'Estagnação e deload', k:'deloadCarga', rot:'Deload: redução de carga', un:'%', min:0, max:20, passo:2.5},
    {g:'Descanso padrão', k:'descComposto', rot:'Compostos', un:'s', min:30, max:300, passo:15},
    {g:'Descanso padrão', k:'descIsolado', rot:'Isolados', un:'s', min:30, max:300, passo:15},
    {g:'Calibragem do sono', k:'calibMinSemanas', rot:'Semanas mínimas de histórico', un:'', min:2, max:12, passo:1},
    {g:'Calibragem do sono', k:'calibMinSessoes', rot:'Sessões mínimas com sono registrado', un:'', min:6, max:60, passo:1}
  ];

  /* ---------- utilidades internas ---------- */
  const chave = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  const deChave = k => { const p = k.split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); };
  const somarDias = (k, n) => { const d = deChave(k); d.setDate(d.getDate() + n); return chave(d); };
  const media = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  const fmt = (n, d) => Number.isFinite(n) ? n.toLocaleString('pt-BR', {maximumFractionDigits: d == null ? 1 : d, useGrouping:false}) : '—';
  const kgTxt = n => fmt(n, 2) + ' kg';
  const arred = (kg, inc) => { const p = inc > 0 ? inc : 0.5; return Math.max(0, Math.round(Math.round(kg / p) * p * 100) / 100); };

  /* '8-10' → {min:8,max:10}; '12' → {12,12}; '40 s', '500 m' ou 'falha' → null (sem faixa de reps). */
  function faixa(r){
    const t = String(r || '').trim();
    const m = t.match(/^(\d+)\s*[-–a]\s*(\d+)$/); if (m) return {min:+m[1], max:+m[2]};
    const n = t.match(/^(\d+)$/); if (n) return {min:+n[1], max:+n[1]};
    return null;
  }

  function incremento(cat, equip, cfg){
    const mapa = {'Halteres':'Halteres','Barra':'Barra','Máquina':'Maquina','Polia':'Polia'};
    const sufixo = mapa[equip]; if (!sufixo) return 0;
    return cfg[(cat === 'comp' ? 'incComp' : 'incIso') + sufixo] || 0;
  }

  /* Incremento do dia: o menor passo do equipamento ou, se ligado, uma % da carga arredondada para esse passo. */
  function incrementoFinal(cat, equip, topKg, cfg){
    const passo = incremento(cat, equip, cfg);
    const pct = cat === 'comp' ? cfg.incPctComp : cfg.incPctIso;
    if (!pct || !(topKg > 0) || !passo) return passo;
    return Math.max(passo, Math.round(topKg * pct / 100 / passo) * passo);
  }
  const incTxt = (inc, topKg) => '+' + fmt(inc, 2) + ' kg' + (topKg > 0 ? ' (' + fmt(inc / topKg * 100, 1) + '%)' : '');

  /* Estimativa de 1RM com o RIR somado às reps (Epley). Mede desempenho para estagnação e calibragem. */
  function e1rm(s){ const r = (s.reps || 0) + (Number.isFinite(s.rir) ? s.rir : 0); return s.kg > 0 ? s.kg * (1 + r / 30) : r; }
  function melhor(series){ return series.reduce((b, s) => (!b || e1rm(s) > e1rm(b)) ? s : b, null); }

  /* ================= PRONTIDÃO ================= */
  function prontidao({sono, sessoes, cfg, hoje}){
    const noites = [];
    for (let i = 0; i < 7; i++){ const n = sono[somarDias(hoje, -i)]; if (n && Number.isFinite(n.h)) noites.push(n.h); }
    const med = media(noites);
    const ontem = sono[hoje] && Number.isFinite(sono[hoje].h) ? sono[hoje].h : null;
    const criticas = noites.filter(h => h < cfg.sonoCritico).length;
    const forca = sessoes.filter(s => s.tipo === 'forca').slice(0, cfg.sessoesRelato);
    const ultima = sessoes[0];
    const base = {media:med, noite:ontem, noites:noites.length, criticas};

    const vermelho = motivo => Object.assign({nivel:'vermelho', motivo}, base);
    const amarelo = motivo => Object.assign({nivel:'amarelo', motivo}, base);

    if (med != null && noites.length >= 3 && med < cfg.sonoVermelhoMedia) return vermelho('Média de sono ' + fmt(med) + ' h na semana: reduzindo a carga hoje.');
    if (criticas >= cfg.noitesCriticas) return vermelho(criticas + ' noites abaixo de ' + fmt(cfg.sonoCritico) + ' h nesta semana: reduzindo a carga hoje.');
    if (ultima && Number.isFinite(ultima.dorMusc) && ultima.dorMusc >= cfg.dorMuscVermelho) return vermelho('Dor muscular ' + ultima.dorMusc + '/5 no último treino: reduzindo a carga hoje.');

    if (med != null && noites.length >= 3 && med < cfg.sonoVerdeMedia) return amarelo('Média de sono ' + fmt(med) + ' h: mantendo as cargas.');
    if (ontem != null && ontem < cfg.sonoAmareloNoite) return amarelo('Dormiu ' + fmt(ontem) + ' h esta noite: mantendo as cargas.');
    if (ontem != null && ontem < cfg.sonoVerdeNoite) return amarelo('Noite de ' + fmt(ontem) + ' h, abaixo de ' + fmt(cfg.sonoVerdeNoite) + ' h: mantendo as cargas.');
    if (forca.length >= cfg.sessoesRelato && forca.every(s => fracaoRir0(s) * 100 >= cfg.rir0Frequente)) return amarelo('RIR 0 frequente nos últimos treinos: mantendo as cargas.');
    if (forca.length >= cfg.sessoesRelato && forca.every(s => Number.isFinite(s.energia) && s.energia <= cfg.energiaBaixa)) return amarelo('Energia baixa nos últimos treinos: mantendo as cargas.');

    if (med == null && ontem == null) return Object.assign({nivel:'verde', semSono:true, motivo:'Sem sono registrado: progressão normal pelos treinos. Lance a noite para ajustar.'}, base);
    const partes = [];
    if (med != null) partes.push('média de sono ' + fmt(med) + ' h');
    if (ontem != null) partes.push('noite de ' + fmt(ontem) + ' h');
    const txt = partes.join(', ');
    return Object.assign({nivel:'verde', motivo: txt.charAt(0).toUpperCase() + txt.slice(1) + ': progressão normal.'}, base);
  }
  function fracaoRir0(s){
    const sets = []; (s.ex || []).forEach(e => { if (e.cat !== 'iso') e.series.forEach(x => { if (Number.isFinite(x.rir)) sets.push(x); }); });
    if (!sets.length) return 0;
    return sets.filter(x => x.rir === 0).length / sets.length;
  }

  /* ================= SUGESTÃO POR EXERCÍCIO (força) ================= */
  function historico(exId, sessoes){
    const h = [];
    sessoes.forEach(s => { if (s.tipo !== 'forca') return; const e = (s.ex || []).find(x => x.id === exId); if (e && e.series.length) h.push({s:s, e:e}); });
    return h;
  }
  const abaixoDaFaixa = (series, r) => series.some(x => x.reps < r.min) || series.slice(0, -1).some(x => x.rir === 0);
  const noTopo = (series, r) => series.length > 0 && series.every(x => x.reps >= r.max);

  function sugerirForca({item, info, sessoes, prontidao: p, cfg, deload}){
    const cat = item.cat || info.tipo;
    const r = faixa(item.reps);
    const hist = historico(item.exId, sessoes);
    const out = {kg:null, reps:item.reps, series:item.series, tipo:'primeira', motivo:'', ultima:null, estagnado:false};

    if (!hist.length){
      out.motivo = info.semCarga ? 'Primeira vez: anote reps e RIR para o app aprender.' : 'Primeira vez: escolha uma carga em que sobrem 2 reps (RIR 2).';
      return aplicarDeload(out, item, cfg, deload);
    }
    const ult = hist[0].e, series = ult.series;
    const topKg = Math.max.apply(null, series.map(x => x.kg || 0));
    const inc = incrementoFinal(cat, info.equip, topKg, cfg);
    out.ultima = series; out.kg = topKg > 0 ? topKg : null;

    /* 1. Dor articular vale acima de qualquer regra. */
    const dor = hist[0].s.dorArt;
    if (dor && dor.sim && (dor.ex || []).indexOf(item.exId) >= 0){
      out.tipo = 'dor';
      out.motivo = 'Incômodo articular na última vez: não suba a carga. Teste ' + (info.var || 'uma variação mais confortável') + '.';
      return out;
    }

    /* 2. Meta de tempo, distância ou até a falha: sem faixa de reps. */
    if (!r){
      out.tipo = 'manter';
      out.motivo = 'Meta: ' + item.reps + '. Tente superar a última vez (' + series.map(x => x.reps).join(', ') + ').';
      return ajustarProntidao(aplicarDeload(out, item, cfg, deload), p, cat, topKg, inc, cfg);
    }

    /* 3. Base: dupla progressão. */
    const minReps = Math.min.apply(null, series.map(x => x.reps || 0));
    const vezesAbaixo = (() => { let n = 0; for (const h of hist){ if (abaixoDaFaixa(h.e.series, r)) n++; else break; } return n; })();

    if (abaixoDaFaixa(series, r)){
      out.tipo = 'manter';
      if (topKg > 0 && vezesAbaixo >= cfg.vezesAbaixo && cfg.reducaoAbaixo > 0){
        out.kg = arred(topKg * (1 - cfg.reducaoAbaixo / 100), inc || 0.5); out.tipo = 'reduzir';
        out.motivo = 'Abaixo da faixa ' + vezesAbaixo + ' vezes seguidas: −' + fmt(cfg.reducaoAbaixo) + '% para recuperar as reps.';
      } else {
        const rir0 = series.slice(0, -1).some(x => x.rir === 0);
        out.motivo = (rir0 ? 'Chegou a RIR 0 antes da última série' : 'Ficou abaixo de ' + r.min + ' reps') + ': mantenha ' + (topKg > 0 ? kgTxt(topKg) : 'o esforço') + ' hoje.';
      }
    } else if (cat === 'comp'){
      const rirOk = series.every(x => !Number.isFinite(x.rir) || x.rir >= cfg.rirSubir);
      if (noTopo(series, r) && rirOk){
        if (topKg > 0 && inc > 0){
          out.kg = arred(topKg + inc, inc); out.tipo = 'subir'; out.reps = r.min === r.max ? item.reps : r.min + '-' + r.max;
          out.motivo = 'Bateu ' + r.max + ' reps nas ' + series.length + ' séries com RIR ' + cfg.rirSubir + ' ou mais: ' + incTxt(inc, topKg) + '.';
        } else {
          out.tipo = 'subir';
          out.motivo = 'Bateu ' + r.max + ' reps em todas as séries: acrescente carga (cinto ou halter) ou desça em 3 s.';
        }
      } else if (noTopo(series, r)){
        out.tipo = 'manter';
        out.motivo = 'Bateu o topo, mas com RIR abaixo de ' + cfg.rirSubir + ': mantenha ' + (topKg > 0 ? kgTxt(topKg) : 'a carga') + ' até sobrar 1 rep.';
      } else {
        const alvo = Math.min(r.max, minReps + 1);
        out.tipo = 'manter'; out.reps = String(alvo);
        out.motivo = 'Dentro da faixa: mantenha ' + (topKg > 0 ? kgTxt(topKg) : 'a carga') + ' e tente ' + alvo + ' reps (+1).';
      }
    } else {
      /* Isolado: primeiro reps, depois carga. */
      let seguidas = 0; for (const h of hist){ if (noTopo(h.e.series, r)) seguidas++; else break; }
      if (seguidas >= cfg.isoSessoesTopo && topKg > 0 && inc > 0){
        const salto = inc / topKg * 100;
        if (LATERAIS.indexOf(item.exId) >= 0 && salto > cfg.saltoMaxLateral){
          out.tipo = 'alternativa'; out.reps = String(r.max + 2);
          out.motivo = 'O próximo peso (+' + fmt(inc, 2) + ' kg) é um salto de ' + fmt(salto, 0) + '%. Mantenha ' + kgTxt(topKg) + ' e faça mais reps, pausa de 1 s no topo ou descida em 3 s.';
        } else {
          out.kg = arred(topKg + inc, inc); out.tipo = 'subir'; out.reps = String(r.min);
          out.motivo = 'Passou de ' + r.max + ' reps em todas as séries ' + seguidas + ' vezes seguidas: ' + incTxt(inc, topKg) + ' e volte para ' + r.min + ' reps.';
        }
      } else if (seguidas >= 1){
        out.tipo = 'manter'; out.reps = r.max + '+';
        out.motivo = 'Isolado: bateu o topo ' + seguidas + ' vez' + (seguidas > 1 ? 'es' : '') + '. Repita ' + r.max + '+ reps em todas para subir a carga.';
      } else {
        const alvo = Math.min(r.max, minReps + 1);
        out.tipo = 'manter'; out.reps = String(alvo);
        out.motivo = 'Isolado: tente ' + alvo + ' reps antes de subir a carga.';
      }
    }

    out.estagnado = estagnado(hist, cfg);
    if (out.estagnado) out.motivo += ' ' + cfg.estagnacaoSessoes + ' sessões sem progresso: considere um deload.';
    return ajustarProntidao(aplicarDeload(out, item, cfg, deload), p, cat, topKg, inc, cfg);
  }

  function ajustarProntidao(s, p, cat, topKg, inc, cfg){
    if (!p || p.nivel === 'verde' || s.tipo === 'dor' || s.tipo === 'deload') return s;
    if (p.nivel === 'amarelo'){
      if (s.tipo === 'subir'){
        const subiria = s.kg;
        s.kg = topKg > 0 ? topKg : s.kg; s.tipo = 'manter';
        s.motivo = 'Prontidão amarela: mantenha ' + (topKg > 0 ? kgTxt(topKg) : 'a carga') + ' hoje' + (subiria && topKg > 0 ? ' (subiria para ' + kgTxt(subiria) + ').' : '.');
      }
      return s;
    }
    /* vermelho */
    if (cat === 'comp' && topKg > 0 && cfg.reducaoVermelho > 0){
      s.kg = arred(topKg * (1 - cfg.reducaoVermelho / 100), inc || 0.5); s.tipo = 'reduzir';
      s.motivo = 'Prontidão vermelha: −' + fmt(cfg.reducaoVermelho) + '% na carga hoje (' + kgTxt(s.kg) + ').';
    } else {
      s.kg = topKg > 0 ? topKg : s.kg; s.series = Math.max(1, s.series - 1); s.tipo = 'reduzir';
      s.motivo = 'Prontidão vermelha: mesma carga com ' + s.series + ' série' + (s.series > 1 ? 's' : '') + ' hoje.';
    }
    return s;
  }

  function aplicarDeload(s, item, cfg, deload){
    if (!deload) return s;
    s.series = Math.max(1, Math.round(item.series * (1 - cfg.deloadVolume / 100)));
    if (s.kg && cfg.deloadCarga > 0) s.kg = arred(s.kg * (1 - cfg.deloadCarga / 100), 0.5);
    s.tipo = 'deload';
    s.motivo = 'Semana de deload: ' + s.series + ' série' + (s.series > 1 ? 's' : '') + (cfg.deloadCarga > 0 ? ' e −' + fmt(cfg.deloadCarga) + '% de carga' : ' com a mesma carga') + '.';
    return s;
  }

  /* Estagnado: as últimas N sessões não superaram a melhor marca anterior a elas. */
  function estagnado(hist, cfg){
    const n = cfg.estagnacaoSessoes;
    if (hist.length < n + 1) return false;
    const recentes = hist.slice(0, n).map(h => e1rm(melhor(h.e.series)));
    const antes = Math.max.apply(null, hist.slice(n).map(h => e1rm(melhor(h.e.series))));
    return recentes.every(v => v <= antes);
  }

  /* ================= CONDICIONAMENTO ================= */
  function sugerirCond({treino, sessoes, prontidao: p}){
    const ult = sessoes.find(s => s.tipo === 'cond' && s.treinoId === treino.id && s.cond && s.cond.tempoTotal);
    const out = {voltas:treino.voltas, descanso:treino.descanso, motivo:''};
    const tempo = ult ? mmss(ult.cond.tempoTotal) : null;
    if (!p || p.nivel === 'verde'){
      out.motivo = tempo ? 'Ritmo normal: tente bater ' + tempo + ' da última vez.' : 'Primeira vez: ritmo em que dá para falar frases curtas (RPE 7).';
    } else if (p.nivel === 'amarelo'){
      out.motivo = 'Prontidão amarela: mesmo volume, ritmo confortável (RPE até 7).';
    } else {
      out.voltas = Math.max(1, treino.voltas - 1);
      out.descanso = Math.round((treino.descanso || 60) * 1.5);
      out.motivo = treino.voltas > 1 ? 'Prontidão vermelha: faça ' + out.voltas + ' volta' + (out.voltas > 1 ? 's' : '') + ' e descanse mais entre elas.' : 'Prontidão vermelha: corte uns 25% da distância e vá em ritmo leve.';
    }
    return out;
  }
  function mmss(s){ s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return (h ? h + ':' + String(m).padStart(2,'0') : m) + ':' + String(r).padStart(2,'0'); }

  /* ================= DELOAD POR SEMANAS SEGUIDAS ================= */
  function semanasSeguidas({sessoes, hoje, deloads}){
    const inicioSem = k => { const d = deChave(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return chave(d); };
    const comTreino = new Set(sessoes.map(s => inicioSem(s.data)));
    const deloadSem = new Set((deloads || []).map(inicioSem));
    let sem = inicioSem(hoje);
    if (!comTreino.has(sem)) sem = somarDias(sem, -7);
    let n = 0;
    while (comTreino.has(sem) && !deloadSem.has(sem) && n < 60){ n++; sem = somarDias(sem, -7); }
    return n;
  }

  /* ================= CALIBRAGEM PESSOAL DO SONO ================= */
  function calibrarSono({sono, sessoes, cfg, hoje}){
    const forca = sessoes.filter(s => s.tipo === 'forca');
    const primeira = forca.length ? forca[forca.length - 1].data : hoje;
    const semanas = Math.floor((deChave(hoje) - deChave(primeira)) / (7 * 864e5));
    /* desempenho relativo por exercício composto */
    const porEx = {};
    forca.forEach(s => (s.ex || []).forEach(e => { if (e.cat === 'iso') return; const b = melhor(e.series); if (b && b.kg > 0) (porEx[e.id] = porEx[e.id] || []).push(e1rm(b)); }));
    const mediaEx = {}; Object.keys(porEx).forEach(id => { mediaEx[id] = media(porEx[id]); });
    const pares = [];
    forca.forEach(s => {
      const n = sono[s.data]; if (!n || !Number.isFinite(n.h)) return;
      const rel = []; (s.ex || []).forEach(e => { if (e.cat === 'iso' || !mediaEx[e.id]) return; const b = melhor(e.series); if (b && b.kg > 0) rel.push(e1rm(b) / mediaEx[e.id]); });
      if (rel.length) pares.push({h:n.h, perf:media(rel)});
    });
    const base = {sessoes:pares.length, semanas:Math.max(0, semanas), minSessoes:cfg.calibMinSessoes, minSemanas:cfg.calibMinSemanas};
    if (semanas < cfg.calibMinSemanas || pares.length < cfg.calibMinSessoes) return Object.assign({pronto:false}, base);
    let best = null;
    [5, 5.5, 6, 6.5, 7, 7.5].forEach(x => {
      const ab = pares.filter(p => p.h < x), ac = pares.filter(p => p.h >= x);
      if (ab.length < 3 || ac.length < 3) return;
      const mA = media(ac.map(p => p.perf)), mB = media(ab.map(p => p.perf));
      const queda = (mA - mB) / mA * 100;
      if (!best || queda > best.queda) best = {limiar:x, queda:queda, abaixo:ab.length, acima:ac.length};
    });
    if (!best || best.queda < 2) return Object.assign({pronto:true, semEfeito:true}, base);
    return Object.assign({pronto:true, limiar:best.limiar, queda:best.queda, abaixo:best.abaixo, acima:best.acima,
      sugestao:{sonoAmareloNoite:best.limiar, sonoVerdeNoite:best.limiar + 0.5, sonoCritico:Math.max(3, best.limiar - 1)}}, base);
  }

  return {PADRAO, CAMPOS, faixa, incremento, incrementoFinal, e1rm, melhor, prontidao, sugerirForca, sugerirCond, semanasSeguidas, calibrarSono, estagnado, historico};
})();
