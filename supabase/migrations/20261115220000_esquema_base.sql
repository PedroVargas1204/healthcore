-- HealthCore · esquema inicial (Fase 2)
--
-- Modelo: cada pessoa só vê e altera as próprias linhas (RLS com auth.uid()).
-- As regras de dado ficam no banco, não só no app. O catálogo de exercícios e os
-- modelos de treino ficam no código; aqui só entra o que a pessoa cria ou registra.
--
-- Escrita dos agregados (treino com exercícios e estações; sessão com exercícios,
-- séries e tempos) passa por salvar_treino e salvar_sessao: uma chamada, uma
-- transação, id gerado no celular. Reenviar a mesma chamada não duplica nada.
-- Remoções de registros de topo ficam em public.remocoes, para outro aparelho saber.

-- ---------------------------------------------------------------------------
-- 0. Nada é exposto na API por padrão: cada tabela e função ganha GRANT explícito
-- ---------------------------------------------------------------------------
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
-- O EXECUTE para PUBLIC é um padrão global: só sai na forma sem "in schema".
alter default privileges for role postgres
  revoke execute on functions from public;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1. Funções de apoio (schema private, fora da API)
-- ---------------------------------------------------------------------------

-- Valida o objeto de regras da recomendação: só chaves conhecidas, só números, cada um na faixa da tela de Ajustes.
create function private.regras_validas(r jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(r) is distinct from 'object' then false else not exists (
    select 1
    from jsonb_each(r) as e (chave, valor)
    left join (values
      ('sonoVerdeMedia', 4, 10), ('sonoVerdeNoite', 4, 10), ('sonoAmareloNoite', 3, 9),
      ('sonoVermelhoMedia', 3, 9), ('sonoCritico', 2, 8), ('noitesCriticas', 1, 7),
      ('sessoesRelato', 1, 5), ('rir0Frequente', 10, 100), ('energiaBaixa', 1, 4),
      ('dorMuscVermelho', 2, 5), ('rirSubir', 0, 4), ('isoSessoesTopo', 1, 5),
      ('vezesAbaixo', 1, 5), ('reducaoAbaixo', 0, 20), ('reducaoVermelho', 0, 20),
      ('saltoMaxLateral', 2, 30),
      ('incCompHalteres', 0.5, 10), ('incCompBarra', 0.5, 10), ('incCompMaquina', 0.5, 10), ('incCompPolia', 0.5, 10),
      ('incPctComp', 0, 10),
      ('incIsoHalteres', 0.5, 10), ('incIsoBarra', 0.5, 10), ('incIsoMaquina', 0.5, 10), ('incIsoPolia', 0.5, 10),
      ('incPctIso', 0, 10),
      ('estagnacaoSessoes', 2, 8), ('semanasDeload', 3, 12), ('deloadVolume', 10, 70), ('deloadCarga', 0, 20),
      ('descComposto', 30, 300), ('descIsolado', 30, 300), ('calibMinSemanas', 2, 12), ('calibMinSessoes', 6, 60)
    ) as l (chave, minimo, maximo) on l.chave = e.chave
    where l.chave is null
       or case when jsonb_typeof(e.valor) = 'number'
               then (e.valor #>> '{}')::numeric not between l.minimo and l.maximo
               else true end
  ) end;
$$;

-- Mantém atualizado_em em dia (base da sincronização: o celular puxa o que mudou desde a última vez).
create function private.tocar_atualizado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- Datas no futuro não fazem sentido para sessão, noite, medida ou calibragem (um dia de folga cobre fusos).
-- tg_argv[0] = nome da coluna de data.
create function private.recusar_data_futura()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_data date := (to_jsonb(new) ->> tg_argv[0])::date;
begin
  if v_data > (now() at time zone 'America/Sao_Paulo')::date + 1 then
    raise exception 'A data % ainda não chegou.', to_char(v_data, 'DD/MM/YYYY')
      using errcode = '22023', hint = 'data_futura';
  end if;
  return new;
end;
$$;

-- Quando um filho de treino ou de sessão muda por fora das funções salvar_*, o pai também conta como alterado,
-- para a sincronização puxar o agregado. Dentro das funções o pai já foi tocado e isto não escreve nada.
create function private.tocar_pai()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_linha jsonb := to_jsonb(coalesce(new, old));
begin
  if tg_table_name in ('treino_exercicios', 'treino_estacoes') then
    update public.treinos set atualizado_em = now()
    where id = (v_linha ->> 'treino_id')::uuid and atualizado_em < now();
  elsif tg_table_name in ('sessao_exercicios', 'sessao_tempos') then
    update public.sessoes set atualizado_em = now()
    where id = (v_linha ->> 'sessao_id')::uuid and atualizado_em < now();
  elsif tg_table_name = 'series' then
    update public.sessoes s set atualizado_em = now()
    from public.sessao_exercicios e
    where e.id = (v_linha ->> 'sessao_exercicio_id')::uuid and s.id = e.sessao_id and s.atualizado_em < now();
  end if;
  return null;
end;
$$;

-- Perfil e configurações nascem junto com a conta.
create function private.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (user_id, nome)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80))
  on conflict (user_id) do nothing;
  insert into public.configuracoes (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Registra a remoção de um registro de topo, para os outros aparelhos apagarem a cópia local.
-- Quando a remoção vem de a conta inteira estar sendo apagada, não há o que avisar.
create function private.registrar_remocao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from auth.users where id = old.user_id) then
    insert into public.remocoes (user_id, tabela, registro_id)
    values (old.user_id, tg_table_name, old.id);
  end if;
  return old;
end;
$$;

-- Se um registro apagado volta com o mesmo id (reimportação com ids determinísticos), a lápide some.
create function private.limpar_remocao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.remocoes
  where user_id = new.user_id and tabela = tg_table_name and registro_id = new.id;
  return new;
end;
$$;

-- Apaga a conta de quem chama e, em cascata, todos os dados dela.
create function private.apagar_usuario(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_uid is null or p_uid is distinct from auth.uid() then
    raise exception 'Só dá para apagar a própria conta.' using errcode = '42501', hint = 'conta_alheia';
  end if;
  delete from auth.users where id = p_uid;
end;
$$;

revoke all on function private.regras_validas(jsonb) from public, anon, authenticated, service_role;
revoke all on function private.tocar_atualizado() from public, anon, authenticated, service_role;
revoke all on function private.recusar_data_futura() from public, anon, authenticated, service_role;
revoke all on function private.criar_perfil() from public, anon, authenticated, service_role;
revoke all on function private.registrar_remocao() from public, anon, authenticated, service_role;
revoke all on function private.limpar_remocao() from public, anon, authenticated, service_role;
revoke all on function private.tocar_pai() from public, anon, authenticated, service_role;
revoke all on function private.apagar_usuario(uuid) from public, anon, authenticated, service_role;
grant execute on function private.regras_validas(jsonb) to authenticated, service_role;
grant execute on function private.apagar_usuario(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Tabelas
-- ---------------------------------------------------------------------------

create table public.perfis (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '' check (char_length(nome) <= 80),
  altura_cm numeric(4, 1) check (altura_cm between 120 and 230),
  modelo text check (char_length(modelo) <= 40),
  onboarding_concluido boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
comment on table public.perfis is 'Um por conta. Criado pelo gatilho em auth.users.';

create table public.configuracoes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  regras jsonb not null default '{}'::jsonb constraint configuracoes_regras_validas check (private.regras_validas(regras)),
  som_descanso boolean not null default true,
  deload_dispensado_ate date,
  calibracao_dispensada_ate date,
  atualizado_em timestamptz not null default now()
);
comment on column public.configuracoes.regras is 'Só os números que a pessoa mudou; o resto vem do padrão do app. Chaves e faixas validadas por private.regras_validas.';

create table public.exercicios_proprios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  chave text not null check (chave like 'c\_%' and char_length(chave) <= 60),
  nome text not null check (char_length(btrim(nome)) between 1 and 40),
  grupo text not null check (grupo in ('Ombro', 'Costas', 'Peito', 'Pernas', 'Braços', 'Core', 'Outro')),
  equip text not null check (equip in ('Halteres', 'Barra', 'Máquina', 'Polia', 'Peso corporal')),
  tipo text not null check (tipo in ('comp', 'iso')),
  reps_padrao text not null default '10' check (char_length(btrim(reps_padrao)) between 1 and 20),
  musc text[] not null default '{}'
    constraint exercicios_musc_validos check (cardinality(musc) <= 6 and array_position(musc, null) is null and array_position(musc, '') is null and char_length(array_to_string(musc, ',')) <= 240),
  sec text[] not null default '{}'
    constraint exercicios_sec_validos check (cardinality(sec) <= 6 and array_position(sec, null) is null and array_position(sec, '') is null and char_length(array_to_string(sec, ',')) <= 240),
  sem_carga boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id, chave)
);
create index exercicios_proprios_sync_idx on public.exercicios_proprios (user_id, atualizado_em, id);
comment on column public.exercicios_proprios.chave is 'Como os treinos e sessões se referem ao exercício (ex_chave). Exercícios do catálogo usam a chave do código, sem linha aqui.';

create table public.treinos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 60),
  tipo text not null check (tipo in ('forca', 'cond')),
  tags text[] not null default '{}' check (tags <@ array['pernas', 'hyrox']::text[]),
  voltas smallint check (voltas between 1 and 20),
  descanso_voltas_s smallint check (descanso_voltas_s between 0 and 600),
  finalizador_id uuid,
  obs text check (char_length(obs) <= 500),
  posicao smallint not null default 0 check (posicao >= 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id, id),
  constraint treinos_finalizador_outro check (finalizador_id is distinct from id),
  constraint treinos_campos_cond check (tipo = 'cond' or (voltas is null and descanso_voltas_s is null)),
  foreign key (user_id, finalizador_id) references public.treinos (user_id, id) on delete set null (finalizador_id)
);
comment on column public.treinos.finalizador_id is 'Treino curto de condicionamento feito no fim deste. Chave composta: só aponta para treino da mesma pessoa.';

create index treinos_finalizador_idx on public.treinos (user_id, finalizador_id);
create index treinos_sync_idx on public.treinos (user_id, atualizado_em, id);

create table public.treino_exercicios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  treino_id uuid not null,
  posicao smallint not null check (posicao >= 0),
  ex_chave text not null check (char_length(ex_chave) between 1 and 60),
  series smallint not null check (series between 1 and 10),
  reps text not null check (char_length(btrim(reps)) between 1 and 20),
  descanso_s smallint check (descanso_s between 0 and 600),
  obs text check (char_length(obs) <= 200),
  cat text not null check (cat in ('comp', 'iso')),
  unique (user_id, treino_id, posicao),
  foreign key (user_id, treino_id) references public.treinos (user_id, id) on delete cascade
);
comment on column public.treino_exercicios.reps is 'Faixa (8-10), número (12), tempo (40 s), distância (500 m) ou "falha".';

create table public.treino_estacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  treino_id uuid not null,
  posicao smallint not null check (posicao >= 0),
  nome text not null check (char_length(btrim(nome)) between 1 and 60),
  alvo text check (char_length(alvo) <= 40),
  substituto text check (char_length(substituto) <= 160),
  unique (user_id, treino_id, posicao),
  foreign key (user_id, treino_id) references public.treinos (user_id, id) on delete cascade
);

create table public.semana (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia smallint not null check (dia between 0 and 6),
  treino_id uuid,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, dia),
  foreign key (user_id, treino_id) references public.treinos (user_id, id) on delete set null (treino_id)
);
comment on column public.semana.dia is '0 = segunda … 6 = domingo. treino_id vazio = descanso.';
create index semana_treino_idx on public.semana (user_id, treino_id);

create table public.sessoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('forca', 'cond')),
  treino_id uuid,
  nome text not null check (char_length(btrim(nome)) between 1 and 60),
  data date not null check (data >= date '2000-01-01'),
  inicio timestamptz,
  fim timestamptz,
  duracao_min smallint check (duracao_min between 1 and 600),
  kcal smallint check (kcal between 0 and 5000),
  energia smallint check (energia between 1 and 5),
  dor_muscular smallint check (dor_muscular between 1 and 5),
  dor_articular boolean not null default false,
  dor_articular_onde text check (char_length(dor_articular_onde) <= 120),
  dor_articular_ex text[] not null default '{}'
    constraint sessoes_dor_ex_validos check (cardinality(dor_articular_ex) <= 20 and array_position(dor_articular_ex, null) is null and array_position(dor_articular_ex, '') is null and char_length(array_to_string(dor_articular_ex, ',')) <= 1200),
  obs text check (char_length(obs) <= 1000),
  prontidao text check (prontidao in ('verde', 'amarela', 'vermelha')),
  prontidao_motivo text check (char_length(prontidao_motivo) <= 300),
  em_deload boolean not null default false,
  tempo_total_s integer check (tempo_total_s between 0 and 86400),
  voltas_plan smallint check (voltas_plan between 0 and 20),
  voltas_feitas smallint check (voltas_feitas between 0 and 20),
  rpe smallint check (rpe between 1 and 10),
  sugestao_motivo text check (char_length(sugestao_motivo) <= 300),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id, id),
  constraint sessoes_fim_depois_do_inicio check (fim is null or inicio is null or fim >= inicio),
  constraint sessoes_dor_exige_exercicio check (not dor_articular or cardinality(dor_articular_ex) >= 1),
  constraint sessoes_dor_ex_sem_dor check (dor_articular or cardinality(dor_articular_ex) = 0),
  constraint sessoes_campos_cond check (tipo = 'cond' or (tempo_total_s is null and voltas_plan is null and voltas_feitas is null and rpe is null)),
  foreign key (user_id, treino_id) references public.treinos (user_id, id) on delete set null (treino_id)
);
comment on column public.sessoes.nome is 'Cópia do nome do treino no dia: o histórico continua legível se o treino for renomeado ou apagado.';
comment on column public.sessoes.dor_articular_ex is 'Exercícios com dor articular. Obrigatório quando há dor: a carga deles não sobe na próxima vez.';
create index sessoes_user_data_idx on public.sessoes (user_id, data desc);
create index sessoes_treino_idx on public.sessoes (user_id, treino_id);
create index sessoes_sync_idx on public.sessoes (user_id, atualizado_em, id);

create table public.sessao_exercicios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  sessao_id uuid not null,
  posicao smallint not null check (posicao >= 0),
  ex_chave text not null check (char_length(ex_chave) between 1 and 60),
  cat text not null check (cat in ('comp', 'iso')),
  alvo text check (char_length(alvo) <= 20),
  sugestao jsonb check (sugestao is null or (jsonb_typeof(sugestao) = 'object' and pg_column_size(sugestao) <= 2048)),
  sugestao_aceita boolean,
  constraint sessao_ex_aceita_exige_sugestao check (sugestao_aceita is null or sugestao is not null),
  unique (user_id, id),
  unique (user_id, sessao_id, posicao),
  foreign key (user_id, sessao_id) references public.sessoes (user_id, id) on delete cascade
);
comment on column public.sessao_exercicios.sugestao is 'O que o app sugeriu naquele dia (carga, reps, séries, tipo, motivo). Guardado junto com o que foi feito.';

create table public.series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  sessao_exercicio_id uuid not null,
  posicao smallint not null check (posicao >= 0),
  kg numeric(6, 2) not null default 0 constraint series_kg_faixa check (kg between 0 and 1000),
  reps smallint not null constraint series_reps_faixa check (reps between 0 and 200),
  rir smallint constraint series_rir_faixa check (rir between 0 and 4),
  unique (user_id, sessao_exercicio_id, posicao),
  foreign key (user_id, sessao_exercicio_id) references public.sessao_exercicios (user_id, id) on delete cascade
);
comment on column public.series.rir is 'Repetições na reserva: 0 a 3, e 4 quer dizer 4 ou mais. Vazio = não marcado.';

create table public.sessao_tempos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  sessao_id uuid not null,
  volta smallint not null check (volta between 0 and 19),
  estacao_pos smallint not null check (estacao_pos >= 0),
  nome text check (char_length(nome) <= 60),
  seg integer not null check (seg between 0 and 86400),
  unique (user_id, sessao_id, volta, estacao_pos),
  foreign key (user_id, sessao_id) references public.sessoes (user_id, id) on delete cascade
);

create table public.noites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data date not null check (data >= date '2000-01-01'),
  horas numeric(4, 2) not null constraint noites_horas_faixa check (horas between 0 and 14),
  qualidade smallint check (qualidade between 1 and 5),
  score smallint check (score between 0 and 100),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id, data)
);
create index noites_sync_idx on public.noites (user_id, atualizado_em, id);
comment on column public.noites.data is 'O dia em que a pessoa acordou.';

create table public.medidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data date not null check (data >= date '2000-01-01'),
  peso_kg numeric(5, 2) check (peso_kg between 30 and 250),
  cintura_cm numeric(5, 1) check (cintura_cm between 45 and 200),
  ombro_cm numeric(5, 1) check (ombro_cm between 60 and 200),
  gordura_pct numeric(4, 1) check (gordura_pct between 3 and 60),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint medidas_ao_menos_uma check (num_nonnulls(peso_kg, cintura_cm, ombro_cm, gordura_pct) >= 1)
);
create index medidas_sync_idx on public.medidas (user_id, atualizado_em, id);
comment on column public.medidas.ombro_cm is 'Volta do corpo na altura dos deltoides. Com a cintura, dá a relação ombro/cintura do painel do objetivo.';
create index medidas_user_data_idx on public.medidas (user_id, data desc);

create table public.deloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  inicio date not null,
  fim date not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint deloads_periodo check (fim >= inicio and fim - inicio <= 13),
  unique (user_id, inicio)
);
create index deloads_sync_idx on public.deloads (user_id, atualizado_em, id);
comment on table public.deloads is 'Semanas leves. A ativa é a que contém o dia de hoje; encerrar antes = mudar o fim.';

create table public.calibracoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  aplicada_em date not null,
  limiar_h numeric(4, 2) not null check (limiar_h between 0 and 14),
  queda_pct numeric(5, 2) not null check (queda_pct between -100 and 100),
  sessoes smallint not null check (sessoes >= 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
comment on table public.calibracoes is 'Limites de sono pessoais que a pessoa aprovou, com quantas sessões embasaram cada um.';
create index calibracoes_user_idx on public.calibracoes (user_id, aplicada_em desc);
create index calibracoes_sync_idx on public.calibracoes (user_id, atualizado_em, id);

create table public.sessao_rascunho (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  dados jsonb not null check (jsonb_typeof(dados) = 'object' and pg_column_size(dados) <= 262144),
  atualizado_em timestamptz not null default now()
);
comment on table public.sessao_rascunho is 'O treino em andamento, para retomar em outro aparelho. dados.sessao_id é o id que a sessão terá; o rascunho some quando ela é salva.';

create table public.remocoes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  tabela text not null check (tabela in ('treinos', 'sessoes', 'noites', 'medidas', 'exercicios_proprios', 'deloads', 'calibracoes')),
  registro_id uuid not null,
  removido_em timestamptz not null default now()
);
comment on table public.remocoes is 'O que foi apagado, para a sincronização apagar a cópia nos outros aparelhos. Escrita só pelos gatilhos; o cursor é o id.';
create index remocoes_user_id_idx on public.remocoes (user_id, id);
create index remocoes_registro_idx on public.remocoes (user_id, tabela, registro_id);
