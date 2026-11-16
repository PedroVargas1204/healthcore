-- HealthCore · funções da API (Fase 2): salvar_treino, salvar_sessao, importar_backup, apagar_minha_conta.
-- security invoker: a RLS vale dentro delas.

-- ---------------------------------------------------------------------------
-- 6. Funções da API (security invoker: a RLS vale dentro delas)
-- ---------------------------------------------------------------------------

-- Salva um treino inteiro (dados, exercícios e estações) numa transação.
-- p: {id, nome, tipo, tags[], voltas, descanso_voltas_s, finalizador_id, obs, posicao,
--     exercicios: [{ex_chave, series, reps, descanso_s, obs, cat}], estacoes: [{nome, alvo, substituto}]}
create function public.salvar_treino(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid := nullif(p ->> 'id', '')::uuid;
begin
  if v_uid is null then
    raise exception 'É preciso entrar na conta.' using errcode = '42501', hint = 'sem_login';
  end if;
  if v_id is null then
    raise exception 'Treino sem id.' using errcode = '22023', hint = 'sem_id';
  end if;

  insert into public.treinos as t (id, user_id, nome, tipo, tags, voltas, descanso_voltas_s, finalizador_id, obs, posicao)
  values (
    v_id, v_uid, p ->> 'nome', p ->> 'tipo',
    coalesce(array(select jsonb_array_elements_text(coalesce(p -> 'tags', '[]'::jsonb))), '{}'),
    (p ->> 'voltas')::smallint, (p ->> 'descanso_voltas_s')::smallint,
    -- treino apagado em outro aparelho: a referência fica vazia em vez de travar a fila do celular
    (select t2.id from public.treinos t2 where t2.id = nullif(p ->> 'finalizador_id', '')::uuid and t2.id <> v_id),
    p ->> 'obs', coalesce((p ->> 'posicao')::smallint, 0)
  )
  on conflict (id) do update set
    nome = excluded.nome, tipo = excluded.tipo, tags = excluded.tags, voltas = excluded.voltas,
    descanso_voltas_s = excluded.descanso_voltas_s, finalizador_id = excluded.finalizador_id,
    obs = excluded.obs, posicao = excluded.posicao;

  -- Os filhos só são trocados quando vêm no pedido: um pedido só com o cabeçalho não apaga nada.
  if jsonb_typeof(p -> 'exercicios') = 'array' then
    delete from public.treino_exercicios where user_id = v_uid and treino_id = v_id;
    insert into public.treino_exercicios (user_id, treino_id, posicao, ex_chave, series, reps, descanso_s, obs, cat)
    select v_uid, v_id, (e.ord - 1)::smallint, e.v ->> 'ex_chave', (e.v ->> 'series')::smallint, e.v ->> 'reps',
           (e.v ->> 'descanso_s')::smallint, e.v ->> 'obs', e.v ->> 'cat'
    from jsonb_array_elements(p -> 'exercicios') with ordinality as e (v, ord);
  end if;

  if jsonb_typeof(p -> 'estacoes') = 'array' then
    delete from public.treino_estacoes where user_id = v_uid and treino_id = v_id;
    insert into public.treino_estacoes (user_id, treino_id, posicao, nome, alvo, substituto)
    select v_uid, v_id, (e.ord - 1)::smallint, e.v ->> 'nome', e.v ->> 'alvo', e.v ->> 'substituto'
    from jsonb_array_elements(p -> 'estacoes') with ordinality as e (v, ord);
  end if;

  return v_id;
end;
$$;

-- Salva uma sessão inteira (dados, exercícios com séries, tempos do condicionamento) numa transação.
-- p: {id, tipo, treino_id, nome, data, inicio, fim, duracao_min, kcal, energia, dor_muscular,
--     dor_articular, dor_articular_onde, dor_articular_ex[], obs, prontidao, prontidao_motivo, em_deload,
--     tempo_total_s, voltas_plan, voltas_feitas, rpe, sugestao_motivo,
--     exercicios: [{ex_chave, cat, alvo, sugestao{}, sugestao_aceita, series: [{kg, reps, rir}]}],
--     tempos: [{volta, estacao_pos, nome, seg}]}
create function public.salvar_sessao(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid := nullif(p ->> 'id', '')::uuid;
begin
  if v_uid is null then
    raise exception 'É preciso entrar na conta.' using errcode = '42501', hint = 'sem_login';
  end if;
  if v_id is null then
    raise exception 'Sessão sem id.' using errcode = '22023', hint = 'sem_id';
  end if;

  insert into public.sessoes as s (
    id, user_id, tipo, treino_id, nome, data, inicio, fim, duracao_min, kcal, energia, dor_muscular,
    dor_articular, dor_articular_onde, dor_articular_ex, obs, prontidao, prontidao_motivo, em_deload,
    tempo_total_s, voltas_plan, voltas_feitas, rpe, sugestao_motivo)
  values (
    v_id, v_uid, p ->> 'tipo',
    -- treino apagado em outro aparelho: a sessão fica sem vínculo e mantém o nome
    (select t.id from public.treinos t where t.id = nullif(p ->> 'treino_id', '')::uuid),
    p ->> 'nome', (p ->> 'data')::date,
    (p ->> 'inicio')::timestamptz, (p ->> 'fim')::timestamptz, (p ->> 'duracao_min')::smallint,
    (p ->> 'kcal')::smallint, (p ->> 'energia')::smallint, (p ->> 'dor_muscular')::smallint,
    coalesce((p ->> 'dor_articular')::boolean, false), nullif(btrim(p ->> 'dor_articular_onde'), ''),
    coalesce(array(select jsonb_array_elements_text(coalesce(p -> 'dor_articular_ex', '[]'::jsonb))), '{}'),
    nullif(btrim(p ->> 'obs'), ''), p ->> 'prontidao', p ->> 'prontidao_motivo',
    coalesce((p ->> 'em_deload')::boolean, false),
    (p ->> 'tempo_total_s')::integer, (p ->> 'voltas_plan')::smallint, (p ->> 'voltas_feitas')::smallint,
    (p ->> 'rpe')::smallint, p ->> 'sugestao_motivo')
  on conflict (id) do update set
    tipo = excluded.tipo, treino_id = excluded.treino_id, nome = excluded.nome, data = excluded.data,
    inicio = excluded.inicio, fim = excluded.fim, duracao_min = excluded.duracao_min, kcal = excluded.kcal,
    energia = excluded.energia, dor_muscular = excluded.dor_muscular, dor_articular = excluded.dor_articular,
    dor_articular_onde = excluded.dor_articular_onde, dor_articular_ex = excluded.dor_articular_ex,
    obs = excluded.obs, prontidao = excluded.prontidao, prontidao_motivo = excluded.prontidao_motivo,
    em_deload = excluded.em_deload, tempo_total_s = excluded.tempo_total_s, voltas_plan = excluded.voltas_plan,
    voltas_feitas = excluded.voltas_feitas, rpe = excluded.rpe, sugestao_motivo = excluded.sugestao_motivo;

  if jsonb_typeof(p -> 'exercicios') = 'array' then
  delete from public.sessao_exercicios where user_id = v_uid and sessao_id = v_id;
  with ex as (
    select (e.ord - 1)::smallint as posicao, e.v
    from jsonb_array_elements(p -> 'exercicios') with ordinality as e (v, ord)
  ), novos as (
    insert into public.sessao_exercicios (user_id, sessao_id, posicao, ex_chave, cat, alvo, sugestao, sugestao_aceita)
    select v_uid, v_id, ex.posicao, ex.v ->> 'ex_chave', ex.v ->> 'cat', ex.v ->> 'alvo',
           nullif(ex.v -> 'sugestao', 'null'::jsonb), (ex.v ->> 'sugestao_aceita')::boolean
    from ex
    returning id, posicao
  )
  insert into public.series (user_id, sessao_exercicio_id, posicao, kg, reps, rir)
  select v_uid, novos.id, (s.ord - 1)::smallint, coalesce((s.v ->> 'kg')::numeric, 0),
         (s.v ->> 'reps')::smallint, (s.v ->> 'rir')::smallint
  from novos
  join ex using (posicao)
  cross join lateral jsonb_array_elements(coalesce(ex.v -> 'series', '[]'::jsonb)) with ordinality as s (v, ord);
  end if;

  if jsonb_typeof(p -> 'tempos') = 'array' then
    delete from public.sessao_tempos where user_id = v_uid and sessao_id = v_id;
    insert into public.sessao_tempos (user_id, sessao_id, volta, estacao_pos, nome, seg)
    select v_uid, v_id, (t.v ->> 'volta')::smallint, (t.v ->> 'estacao_pos')::smallint, t.v ->> 'nome', (t.v ->> 'seg')::integer
    from jsonb_array_elements(p -> 'tempos') as t (v);
  end if;

  -- O rascunho só sai se for desta sessão: reenviar uma sessão antiga não apaga o treino em andamento.
  delete from public.sessao_rascunho where user_id = v_uid and dados ->> 'sessao_id' = v_id::text;
  return v_id;
end;
$$;

-- Importa um backup já convertido pelo app (ids determinísticos, então repetir não duplica).
-- Tudo ou nada: qualquer item inválido desfaz a importação inteira e a mensagem diz qual item e por quê.
create function public.importar_backup(p jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_item jsonb;
  v_ctx text;
  v_restricao text;
  v_detalhe text;
  n_treinos int := 0;
  n_sessoes int := 0;
  n_noites int := 0;
  n_medidas int := 0;
  n_ex int := 0;
  n_deloads int := 0;
  n_calib int := 0;
begin
  if v_uid is null then
    raise exception 'É preciso entrar na conta.' using errcode = '42501', hint = 'sem_login';
  end if;
  if jsonb_typeof(p) is distinct from 'object' then
    raise exception 'O arquivo não tem o formato de um backup do HealthCore.' using errcode = '22023', hint = 'backup_invalido';
  end if;

  v_ctx := 'Perfil';
  if p ? 'perfil' then
    update public.perfis set
      nome = coalesce(p #>> '{perfil,nome}', nome),
      altura_cm = coalesce((p #>> '{perfil,altura_cm}')::numeric, altura_cm),
      modelo = coalesce(p #>> '{perfil,modelo}', modelo),
      onboarding_concluido = coalesce((p #>> '{perfil,onboarding_concluido}')::boolean, onboarding_concluido)
    where user_id = v_uid;
  end if;

  v_ctx := 'Regras de carga';
  if p ? 'configuracoes' then
    update public.configuracoes set
      regras = coalesce(p #> '{configuracoes,regras}', regras),
      som_descanso = coalesce((p #>> '{configuracoes,som_descanso}')::boolean, som_descanso),
      deload_dispensado_ate = coalesce((p #>> '{configuracoes,deload_dispensado_ate}')::date, deload_dispensado_ate),
      calibracao_dispensada_ate = coalesce((p #>> '{configuracoes,calibracao_dispensada_ate}')::date, calibracao_dispensada_ate)
    where user_id = v_uid;
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p -> 'exercicios_proprios', '[]'::jsonb)) loop
    v_ctx := format('Exercício "%s"', v_item ->> 'nome');
    insert into public.exercicios_proprios (id, user_id, chave, nome, grupo, equip, tipo, reps_padrao, musc, sec, sem_carga)
    values (
      (v_item ->> 'id')::uuid, v_uid, v_item ->> 'chave', v_item ->> 'nome', v_item ->> 'grupo', v_item ->> 'equip',
      v_item ->> 'tipo', coalesce(v_item ->> 'reps_padrao', '10'),
      coalesce(array(select jsonb_array_elements_text(coalesce(v_item -> 'musc', '[]'::jsonb))), '{}'),
      coalesce(array(select jsonb_array_elements_text(coalesce(v_item -> 'sec', '[]'::jsonb))), '{}'),
      coalesce((v_item ->> 'sem_carga')::boolean, false))
    on conflict (user_id, chave) do update set
      nome = excluded.nome, grupo = excluded.grupo, equip = excluded.equip, tipo = excluded.tipo,
      reps_padrao = excluded.reps_padrao, musc = excluded.musc, sec = excluded.sec, sem_carga = excluded.sem_carga;
    n_ex := n_ex + 1;
  end loop;

  -- Treinos em duas passadas: primeiro todos, depois os finalizadores (que apontam para outros treinos).
  for v_item in select * from jsonb_array_elements(coalesce(p -> 'treinos', '[]'::jsonb)) loop
    v_ctx := format('Treino "%s"', v_item ->> 'nome');
    perform public.salvar_treino(v_item - 'finalizador_id');
    n_treinos := n_treinos + 1;
  end loop;
  for v_item in select * from jsonb_array_elements(coalesce(p -> 'treinos', '[]'::jsonb)) loop
    v_ctx := format('Finalizador do treino "%s"', v_item ->> 'nome');
    if nullif(v_item ->> 'finalizador_id', '') is not null then
      update public.treinos set finalizador_id = (v_item ->> 'finalizador_id')::uuid
      where user_id = v_uid and id = (v_item ->> 'id')::uuid;
    end if;
  end loop;

  v_ctx := 'Semana';
  if jsonb_typeof(p -> 'semana') = 'array' then
    if jsonb_array_length(p -> 'semana') <> 7 then
      raise exception 'a semana precisa ter 7 dias' using errcode = '22023', hint = 'semana_7_dias';
    end if;
    insert into public.semana (user_id, dia, treino_id)
    select v_uid, (d.ord - 1)::smallint, nullif(d.v #>> '{}', '')::uuid
    from jsonb_array_elements(p -> 'semana') with ordinality as d (v, ord)
    on conflict (user_id, dia) do update set treino_id = excluded.treino_id;
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p -> 'sessoes', '[]'::jsonb)) loop
    v_ctx := format('Sessão de %s (%s)', to_char((v_item ->> 'data')::date, 'DD/MM/YYYY'), v_item ->> 'nome');
    perform public.salvar_sessao(v_item);
    n_sessoes := n_sessoes + 1;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(p -> 'noites', '[]'::jsonb)) loop
    v_ctx := format('Noite de %s', to_char((v_item ->> 'data')::date, 'DD/MM/YYYY'));
    insert into public.noites (id, user_id, data, horas, qualidade, score)
    values ((v_item ->> 'id')::uuid, v_uid, (v_item ->> 'data')::date, (v_item ->> 'horas')::numeric,
            (v_item ->> 'qualidade')::smallint, (v_item ->> 'score')::smallint)
    on conflict (user_id, data) do update set
      horas = excluded.horas, qualidade = excluded.qualidade, score = excluded.score;
    n_noites := n_noites + 1;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(p -> 'medidas', '[]'::jsonb)) loop
    v_ctx := format('Medida de %s', to_char((v_item ->> 'data')::date, 'DD/MM/YYYY'));
    insert into public.medidas (id, user_id, data, peso_kg, cintura_cm, ombro_cm, gordura_pct)
    values ((v_item ->> 'id')::uuid, v_uid, (v_item ->> 'data')::date, (v_item ->> 'peso_kg')::numeric,
            (v_item ->> 'cintura_cm')::numeric, (v_item ->> 'ombro_cm')::numeric, (v_item ->> 'gordura_pct')::numeric)
    on conflict (id) do update set
      data = excluded.data, peso_kg = excluded.peso_kg, cintura_cm = excluded.cintura_cm,
      ombro_cm = excluded.ombro_cm, gordura_pct = excluded.gordura_pct;
    n_medidas := n_medidas + 1;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(p -> 'deloads', '[]'::jsonb)) loop
    v_ctx := format('Deload de %s', to_char((v_item ->> 'inicio')::date, 'DD/MM/YYYY'));
    insert into public.deloads (id, user_id, inicio, fim)
    values ((v_item ->> 'id')::uuid, v_uid, (v_item ->> 'inicio')::date, (v_item ->> 'fim')::date)
    on conflict (user_id, inicio) do update set fim = excluded.fim;
    n_deloads := n_deloads + 1;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(p -> 'calibracoes', '[]'::jsonb)) loop
    v_ctx := format('Calibragem de %s', to_char((v_item ->> 'aplicada_em')::date, 'DD/MM/YYYY'));
    insert into public.calibracoes (id, user_id, aplicada_em, limiar_h, queda_pct, sessoes)
    values ((v_item ->> 'id')::uuid, v_uid, (v_item ->> 'aplicada_em')::date, (v_item ->> 'limiar_h')::numeric,
            (v_item ->> 'queda_pct')::numeric, (v_item ->> 'sessoes')::smallint)
    on conflict (id) do nothing;
    n_calib := n_calib + 1;
  end loop;

  return jsonb_build_object(
    'treinos', n_treinos, 'sessoes', n_sessoes, 'noites', n_noites, 'medidas', n_medidas,
    'exercicios_proprios', n_ex, 'deloads', n_deloads, 'calibracoes', n_calib);
exception
  when others then
    get stacked diagnostics v_restricao = constraint_name, v_detalhe = pg_exception_detail;
    if sqlstate = '42501' then
      raise exception 'Nada foi importado. %: sem permissão para este registro.', v_ctx
        using errcode = '42501', hint = 'sem_permissao';
    end if;
    -- O hint leva o nome da regra quebrada (ex.: series_rir_faixa), que o app traduz para o português.
    raise exception 'Nada foi importado. %: %', v_ctx, sqlerrm
      using errcode = sqlstate, detail = coalesce(v_detalhe, ''), hint = coalesce(nullif(v_restricao, ''), 'importacao');
end;
$$;

-- Apaga a conta de quem chama e todos os dados dela.
create function public.apagar_minha_conta()
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.apagar_usuario(auth.uid());
$$;

revoke all on function public.salvar_treino(jsonb) from public, anon;
revoke all on function public.salvar_sessao(jsonb) from public, anon;
revoke all on function public.importar_backup(jsonb) from public, anon;
revoke all on function public.apagar_minha_conta() from public, anon;
grant execute on function public.salvar_treino(jsonb) to authenticated;
grant execute on function public.salvar_sessao(jsonb) to authenticated;
grant execute on function public.importar_backup(jsonb) to authenticated;
grant execute on function public.apagar_minha_conta() to authenticated;
