// Tipos do domínio. Os registros guardados no celular têm a mesma forma que as funções
// salvar_treino e salvar_sessao do banco recebem: o envio é o próprio registro.

export type Categoria = "comp" | "iso";
export type TipoTreino = "forca" | "cond";
export type Tag = "pernas" | "hyrox";
export type NivelProntidao = "verde" | "amarelo" | "vermelho";
/** Como o banco guarda o nível da prontidão. */
export type ProntidaoBanco = "verde" | "amarela" | "vermelha";

/* ---------- Catálogo fixo (código) ---------- */
export type Exercicio = {
  nome: string;
  grupo: string;
  musc: string[];
  sec: string[];
  equip: string;
  tipo: Categoria;
  v: number;
  reps: string;
  var: string;
  passos: string[];
  erros: string[][];
  semCarga?: number;
};

export type ItemModelo = { exId: string; series: number; reps: string; desc: number | null; obs: string; cat: Categoria };
export type EstacaoModelo = { nome: string; alvo: string; sub: string };
export type TreinoModelo = {
  id: string;
  nome: string;
  tipo: TipoTreino;
  tags: string[];
  ex?: ItemModelo[];
  voltas?: number;
  descanso?: number;
  obs?: string;
  itens?: EstacaoModelo[];
  finalizador?: string;
  finalizadorDe?: boolean;
};
export type Modelo = {
  id: string;
  nome: string;
  original?: boolean;
  frase: string;
  intensidade: string;
  duracao: string;
  treinos: TreinoModelo[];
  semana: (string | null)[];
};

/* ---------- Registros do usuário ---------- */
export type TreinoExercicio = {
  ex_chave: string;
  series: number;
  reps: string;
  descanso_s: number | null;
  obs: string | null;
  cat: Categoria;
};
export type Estacao = { nome: string; alvo: string | null; substituto: string | null };

export type Treino = {
  id: string;
  nome: string;
  tipo: TipoTreino;
  tags: Tag[];
  voltas: number | null;
  descanso_voltas_s: number | null;
  finalizador_id: string | null;
  obs: string | null;
  posicao: number;
  exercicios: TreinoExercicio[];
  estacoes: Estacao[];
  criado_em?: string;
  atualizado_em?: string;
};

export type Serie = { kg: number; reps: number; rir: number | null };

export type Sugestao = {
  kg: number | null;
  reps: string;
  series: number;
  tipo: string;
  motivo: string;
};

export type SessaoExercicio = {
  ex_chave: string;
  cat: Categoria;
  alvo: string | null;
  sugestao: Sugestao | null;
  sugestao_aceita: boolean | null;
  series: Serie[];
};

export type Tempo = { volta: number; estacao_pos: number; nome: string | null; seg: number };

export type Sessao = {
  id: string;
  tipo: TipoTreino;
  treino_id: string | null;
  nome: string;
  data: string;
  inicio: string | null;
  fim: string | null;
  duracao_min: number | null;
  kcal: number | null;
  energia: number | null;
  dor_muscular: number | null;
  dor_articular: boolean;
  dor_articular_onde: string | null;
  dor_articular_ex: string[];
  obs: string | null;
  prontidao: ProntidaoBanco | null;
  prontidao_motivo: string | null;
  em_deload: boolean;
  tempo_total_s: number | null;
  voltas_plan: number | null;
  voltas_feitas: number | null;
  rpe: number | null;
  sugestao_motivo: string | null;
  exercicios: SessaoExercicio[];
  tempos: Tempo[];
  criado_em?: string;
  atualizado_em?: string;
};

export type Noite = { id: string; data: string; horas: number; qualidade: number | null; score: number | null; atualizado_em?: string };
export type Medida = {
  id: string;
  data: string;
  peso_kg: number | null;
  cintura_cm: number | null;
  ombro_cm: number | null;
  gordura_pct: number | null;
  atualizado_em?: string;
};
export type Deload = { id: string; inicio: string; fim: string; atualizado_em?: string };
export type Calibracao = { id: string; aplicada_em: string; limiar_h: number; queda_pct: number; sessoes: number; atualizado_em?: string };
export type ExercicioProprio = {
  id: string;
  chave: string;
  nome: string;
  grupo: string;
  equip: string;
  tipo: Categoria;
  reps_padrao: string;
  musc: string[];
  sec: string[];
  sem_carga: boolean;
  atualizado_em?: string;
};
export type Perfil = { nome: string; altura_cm: number | null; modelo: string | null; onboarding_concluido: boolean; atualizado_em?: string };
export type Regras = Record<string, number>;
export type Configuracoes = {
  regras: Regras;
  som_descanso: boolean;
  deload_dispensado_ate: string | null;
  calibracao_dispensada_ate: string | null;
  atualizado_em?: string;
};
/** Semana: dia 0 = segunda. */
export type DiaSemana = { dia: number; treino_id: string | null; atualizado_em?: string };

/* ---------- Treino em andamento (fica no celular e sobe como rascunho) ---------- */
export type SerieAtiva = { kg: number | null; reps: number | null; rir: number | null; feita: boolean };
export type ExercicioAtivo = {
  ex_chave: string;
  cat: Categoria;
  reps: string;
  series_plan: number;
  descanso_s: number;
  obs: string;
  sugestao: Sugestao & { ultima: Serie[] | null };
  sugestao_aceita: boolean;
  series: SerieAtiva[];
};
export type SessaoAtivaForca = {
  tipo: "forca";
  sessao_id: string;
  treino_id: string;
  nome: string;
  inicio: number;
  idx: number;
  descanso_fim: number | null;
  descanso_total: number | null;
  em_deload: boolean;
  prontidao: { nivel: NivelProntidao; motivo: string };
  exercicios: ExercicioAtivo[];
};
export type SessaoAtivaCond = {
  tipo: "cond";
  sessao_id: string;
  treino_id: string;
  nome: string;
  inicio: number;
  prontidao: { nivel: NivelProntidao; motivo: string };
  sugestao_motivo: string;
  voltas: number;
  descanso: number;
  estacoes: Estacao[];
  obs: string;
  t_inicio: number | null;
  fim_timer: number | null;
  ultimo_marco: number | null;
  pos: { v: number; i: number };
  marcos: Tempo[];
  descanso_fim: number | null;
};
export type SessaoAtiva = SessaoAtivaForca | SessaoAtivaCond;
