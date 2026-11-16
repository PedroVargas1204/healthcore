// Mensagens de erro do banco em português. O banco manda o nome da regra no "hint".

const REGRAS: Record<string, string> = {
  sem_login: "Sua sessão expirou. Entre de novo para continuar salvando na nuvem.",
  sem_id: "O registro chegou sem identificação.",
  backup_invalido: "O arquivo não tem o formato de um backup do HealthCore.",
  semana_7_dias: "A semana do backup precisa ter 7 dias.",
  sem_permissao: "Um dos registros pertence a outra conta.",
  conta_alheia: "Só dá para apagar a própria conta.",
  data_futura: "A data ainda não chegou.",
  series_rir_faixa: "RIR fora da faixa de 0 a 4.",
  series_kg_faixa: "Carga fora da faixa de 0 a 1.000 kg.",
  series_reps_faixa: "Repetições fora da faixa de 0 a 200.",
  sessoes_dor_exige_exercicio: "Dor articular marcada sem dizer em qual exercício.",
  sessoes_dor_ex_sem_dor: "Exercício com dor marcado sem marcar a dor articular.",
  sessoes_dor_ex_validos: "Lista de exercícios com dor inválida.",
  sessoes_campos_cond: "Tempo, voltas e RPE só valem para condicionamento.",
  sessoes_fim_depois_do_inicio: "O fim do treino ficou antes do início.",
  sessao_ex_aceita_exige_sugestao: "Sugestão aceita sem sugestão registrada.",
  noites_horas_faixa: "Horas de sono fora da faixa de 0 a 14.",
  medidas_ao_menos_uma: "A medida precisa de ao menos um valor.",
  configuracoes_regras_validas: "Um dos números das regras está fora da faixa permitida.",
  treinos_campos_cond: "Voltas e descanso entre voltas só valem para condicionamento.",
  treinos_finalizador_outro: "Um treino não pode ser o próprio finalizador.",
  deloads_periodo: "O deload precisa durar de 1 a 14 dias.",
  exercicios_musc_validos: "Lista de músculos do exercício inválida.",
  exercicios_sec_validos: "Lista de músculos auxiliares inválida.",
};

export type ErroBanco = { message?: string; code?: string; hint?: string | null; details?: string | null; status?: number };

/** Falha de rede ou do servidor: vale tentar de novo depois. */
export function ehTransitorio(e: ErroBanco | null | undefined) {
  if (!e) return false;
  const code = e.code ?? "";
  if (!code) return true; // fetch falhou: sem internet
  if (code.startsWith("PGRST3")) return true; // token expirado ou inválido: renova e tenta de novo
  if (code === "57014" || code === "08006" || code === "08001" || code === "53300") return true; // tempo esgotado, conexão
  if (/^5\d\d$/.test(code)) return true;
  return false;
}

export function mensagemDoErro(e: ErroBanco | null | undefined): string {
  if (!e) return "Algo deu errado.";
  const hint = e.hint ?? "";
  if (REGRAS[hint]) {
    const contexto = e.message?.startsWith("Nada foi importado.") ? e.message.replace(/:[^:]*$/, ":") + " " : "";
    return contexto + REGRAS[hint];
  }
  if (!e.code) return "Sem conexão com a nuvem. O registro fica no celular e sobe quando a internet voltar.";
  if (e.code === "23505") return "Já existe um registro igual.";
  if (e.code === "23503") return "Um registro ligado a este não existe mais.";
  if (e.code === "23514") return "Um valor está fora da faixa permitida.";
  if (e.code === "42501") return "Sem permissão para este registro.";
  return e.message || "Algo deu errado.";
}
