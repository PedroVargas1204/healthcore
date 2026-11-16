-- HealthCore · carga para medir a importação (8 treinos, 400 sessões, 9.600 séries, 730 noites, 100 medidas).
-- Rode como postgres. Depois meça com importar_c.sql (psql) e limpe com limpeza.sql.
drop schema if exists teste_carga cascade;
delete from auth.users where id = '33333333-3333-4333-8333-333333333333';
create schema teste_carga;
create table teste_carga.dados (v jsonb);
grant usage on schema teste_carga to authenticated;
grant select on teste_carga.dados to authenticated;
insert into auth.users (id, email, raw_user_meta_data) values ('33333333-3333-4333-8333-333333333333', 'c@teste.local', '{"full_name":"Pessoa C"}');
insert into teste_carga.dados select jsonb_build_object(
  'perfil', jsonb_build_object('nome', 'Pessoa C', 'altura_cm', 175),
  'treinos', (select jsonb_agg(jsonb_build_object(
      'id', md5('treino' || t)::uuid, 'nome', 'Treino ' || t, 'tipo', 'forca', 'tags', '[]'::jsonb, 'posicao', t,
      'exercicios', (select jsonb_agg(jsonb_build_object('ex_chave', (array['supino_inclinado','puxada','remada_baixa','elev_lateral','crossover','rosca_direta'])[e],
                       'series', 3, 'reps', '8-10', 'cat', case when e <= 3 then 'comp' else 'iso' end)) from generate_series(1, 6) e),
      'estacoes', '[]'::jsonb)) from generate_series(0, 7) t),
  'semana', (select jsonb_agg(md5('treino' || d)::uuid) from generate_series(0, 6) d),
  'sessoes', (select jsonb_agg(jsonb_build_object(
      'id', md5('sessao' || i)::uuid, 'tipo', 'forca', 'treino_id', md5('treino' || (i % 8))::uuid, 'nome', 'Treino ' || (i % 8),
      'data', current_date - i * 2, 'inicio', ((current_date - i * 2) + time '18:00')::timestamptz,
      'fim', ((current_date - i * 2) + time '19:00')::timestamptz, 'duracao_min', 60, 'energia', 3, 'dor_muscular', 2,
      'dor_articular', false, 'prontidao', 'verde', 'em_deload', false, 'tempos', '[]'::jsonb,
      'exercicios', (select jsonb_agg(jsonb_build_object('ex_chave', (array['supino_inclinado','puxada','remada_baixa','elev_lateral','crossover','rosca_direta'])[e],
                       'cat', case when e <= 3 then 'comp' else 'iso' end, 'alvo', '8-10',
                       'series', (select jsonb_agg(jsonb_build_object('kg', 20 + e, 'reps', 10 - s, 'rir', 1)) from generate_series(1, 4) s)))
                     from generate_series(1, 6) e))) from generate_series(1, 400) i),
  'noites', (select jsonb_agg(jsonb_build_object('id', md5('noite' || i)::uuid, 'data', current_date - i, 'horas', 7, 'qualidade', 3, 'score', 80)) from generate_series(1, 730) i),
  'medidas', (select jsonb_agg(jsonb_build_object('id', md5('medida' || i)::uuid, 'data', current_date - i * 7, 'peso_kg', 75)) from generate_series(1, 100) i));
