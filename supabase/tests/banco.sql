-- HealthCore · testes do banco (RLS, funções, sincronização, apagar conta).
-- Roda inteiro numa chamada só (SQL editor da Supabase ou psql) como postgres, num banco com as migrações.
-- Cria duas pessoas de teste (A e B) em auth.users e o schema teste; no fim mostra quantos passaram.
-- Depois rode limpeza.sql: ela apaga as pessoas de teste e o schema teste.
-- apoio de teste (some no fim)
create schema teste;
create table teste.resultado (n serial, ok boolean, nome text);
create table teste.dados (nome text primary key, v jsonb);
grant select on teste.dados to authenticated, anon;
insert into teste.dados values ('payload', '{"perfil":{"nome":"Pessoa A","altura_cm":175,"modelo":"dimorfismo5","onboarding_concluido":true},"configuracoes":{"regras":{"sonoVerdeMedia":7,"sonoVerdeNoite":6.5,"sonoAmareloNoite":6,"sonoVermelhoMedia":6,"sonoCritico":5,"noitesCriticas":2,"sessoesRelato":2,"rir0Frequente":50,"energiaBaixa":2,"dorMuscVermelho":4,"rirSubir":1,"isoSessoesTopo":2,"vezesAbaixo":2,"reducaoAbaixo":5,"reducaoVermelho":7.5,"saltoMaxLateral":10,"incCompHalteres":2,"incCompBarra":2.5,"incCompMaquina":2.5,"incCompPolia":2.5,"incPctComp":0,"incIsoHalteres":1,"incIsoBarra":2.5,"incIsoMaquina":2.5,"incIsoPolia":2.5,"incPctIso":0,"estagnacaoSessoes":3,"semanasDeload":6,"deloadVolume":40,"deloadCarga":0,"descComposto":120,"descIsolado":75,"calibMinSemanas":4,"calibMinSessoes":12},"som_descanso":true,"deload_dispensado_ate":null,"calibracao_dispensada_ate":null},"exercicios_proprios":[],"treinos":[{"id":"b653be65-fa34-5c12-b7e7-fae95976c572","nome":"Costas (largura) + ombro","tipo":"forca","tags":[],"voltas":null,"descanso_voltas_s":null,"finalizador_id":null,"obs":null,"posicao":0,"exercicios":[{"ex_chave":"puxada","series":4,"reps":"8-10","descanso_s":null,"obs":null,"cat":"comp"},{"ex_chave":"remada_apoiada","series":3,"reps":"8-10","descanso_s":null,"obs":null,"cat":"comp"},{"ex_chave":"pullover","series":3,"reps":"12","descanso_s":null,"obs":null,"cat":"iso"},{"ex_chave":"elev_lateral","series":4,"reps":"12-15","descanso_s":null,"obs":null,"cat":"iso"},{"ex_chave":"rosca_direta","series":3,"reps":"10","descanso_s":null,"obs":null,"cat":"iso"}],"estacoes":[]},{"id":"55d4669c-1b54-5857-9527-f38605f13174","nome":"Inferior (força)","tipo":"forca","tags":["pernas"],"voltas":null,"descanso_voltas_s":null,"finalizador_id":null,"obs":null,"posicao":1,"exercicios":[{"ex_chave":"agachamento","series":4,"reps":"6-8","descanso_s":null,"obs":null,"cat":"comp"},{"ex_chave":"stiff","series":3,"reps":"8-10","descanso_s":null,"obs":null,"cat":"comp"},{"ex_chave":"leg_press","series":3,"reps":"10-12","descanso_s":null,"obs":null,"cat":"comp"},{"ex_chave":"panturrilha","series":4,"reps":"12","descanso_s":null,"obs":null,"cat":"iso"},{"ex_chave":"prancha","series":3,"reps":"40 s","descanso_s":null,"obs":null,"cat":"iso"}],"estacoes":[]},{"id":"96b356f7-fe4a-5613-bd07-7ca689c00194","nome":"Ombros + braços","tipo":"forca","tags":[],"voltas":null,"descanso_voltas_s":null,"finalizador_id":null,"obs":null,"posicao":2,"exercicios":[{"ex_chave":"desenvolvimento","series":3,"reps":"8-10","descanso_s":null,"obs":null,"cat":"comp"},{"ex_chave":"elev_lateral_polia","series":4,"reps":"12-15","descanso_s":null,"obs":null,"cat":"iso"},{"ex_chave":"crucifixo_inverso","series":3,"reps":"15","descanso_s":null,"obs":null,"cat":"iso"},{"ex_chave":"triceps_polia","series":3,"reps":"12","descanso_s":null,"obs":null,"cat":"iso"},{"ex_chave":"rosca_martelo","series":3,"reps":"12","descanso_s":null,"obs":null,"cat":"iso"}],"estacoes":[]},{"id":"e23799d8-1238-5967-a410-444c47be086b","nome":"Peito + costas","tipo":"forca","tags":[],"voltas":null,"descanso_voltas_s":null,"finalizador_id":null,"obs":null,"posicao":3,"exercicios":[{"ex_chave":"supino_inclinado","series":4,"reps":"8-10","descanso_s":null,"obs":null,"cat":"comp"},{"ex_chave":"barra_fixa","series":3,"reps":"falha","descanso_s":null,"obs":null,"cat":"comp"},{"ex_chave":"crossover","series":3,"reps":"12","descanso_s":null,"obs":null,"cat":"iso"},{"ex_chave":"remada_baixa","series":3,"reps":"10","descanso_s":null,"obs":null,"cat":"comp"},{"ex_chave":"elev_lateral","series":3,"reps":"15","descanso_s":null,"obs":null,"cat":"iso"}],"estacoes":[]},{"id":"cbb95923-1b13-5d10-b122-8ee323f75576","nome":"Inferior (volume)","tipo":"forca","tags":["pernas"],"voltas":null,"descanso_voltas_s":null,"finalizador_id":null,"obs":null,"posicao":4,"exercicios":[{"ex_chave":"bulgaro","series":3,"reps":"10","descanso_s":null,"obs":null,"cat":"comp"},{"ex_chave":"mesa_flexora","series":3,"reps":"12","descanso_s":null,"obs":null,"cat":"iso"},{"ex_chave":"extensora","series":3,"reps":"12","descanso_s":null,"obs":null,"cat":"iso"},{"ex_chave":"abdominal_infra","series":3,"reps":"12","descanso_s":null,"obs":null,"cat":"iso"}],"estacoes":[]}],"semana":["b653be65-fa34-5c12-b7e7-fae95976c572","55d4669c-1b54-5857-9527-f38605f13174","96b356f7-fe4a-5613-bd07-7ca689c00194","e23799d8-1238-5967-a410-444c47be086b","cbb95923-1b13-5d10-b122-8ee323f75576","b653be65-fa34-5c12-b7e7-fae95976c572","55d4669c-1b54-5857-9527-f38605f13174"],"sessoes":[],"noites":[],"medidas":[{"id":"c28b0c13-d8ca-5443-ad7e-712a91831cd1","data":"2026-11-13","peso_kg":75,"cintura_cm":null,"ombro_cm":null,"gordura_pct":15}],"deloads":[],"calibracoes":[]}'::jsonb), ('sessao', '{"id":"aaaaaaaa-0000-4000-8000-000000000001","tipo":"forca","treino_id":"e23799d8-1238-5967-a410-444c47be086b","nome":"Peito + costas","data":"2026-11-13","inicio":"2026-11-13T21:00:00Z","fim":"2026-11-13T21:54:00Z","duracao_min":54,"kcal":410,"energia":4,"dor_muscular":2,"dor_articular":true,"dor_articular_onde":"ombro direito","dor_articular_ex":["supino_inclinado"],"obs":null,"prontidao":"verde","prontidao_motivo":"Média de sono 7,1 h","em_deload":false,"exercicios":[{"ex_chave":"supino_inclinado","cat":"comp","alvo":"8-10","sugestao":{"kg":24,"reps":"8-10","tipo":"subir","motivo":"+2 kg"},"sugestao_aceita":true,"series":[{"kg":24,"reps":10,"rir":1},{"kg":24,"reps":9,"rir":1},{"kg":24,"reps":8,"rir":0}]},{"ex_chave":"elev_lateral","cat":"iso","alvo":"12-15","sugestao":null,"sugestao_aceita":null,"series":[{"kg":12,"reps":15,"rir":null}]}],"tempos":[]}'::jsonb);
insert into teste.dados select 'ruim', jsonb_set(p.v, '{sessoes}', jsonb_build_array(
  jsonb_set(jsonb_set(jsonb_set(s.v, '{id}', '"aaaaaaaa-0000-4000-8000-000000000002"'), '{data}', '"2026-10-12"'),
    '{exercicios}', '[{"ex_chave":"supino_inclinado","cat":"comp","alvo":"8-10","series":[{"kg":20,"reps":10,"rir":5}]}]')))
from teste.dados p, teste.dados s where p.nome = 'payload' and s.nome = 'sessao';

grant usage on schema teste to authenticated, anon;
grant insert, select on teste.resultado to authenticated, anon;
grant usage on sequence teste.resultado_n_seq to authenticated, anon;
create function teste.ok(cond boolean, nome text) returns void language plpgsql as $$
begin insert into teste.resultado (ok, nome) values (coalesce(cond, false), nome); end $$;
create function teste.erro(cmd text, trecho text, nome text) returns void language plpgsql as $$
declare h text;
begin
  begin execute cmd; insert into teste.resultado (ok, nome) values (false, nome || ' (não deu erro)');
  exception when others then
    get stacked diagnostics h = pg_exception_hint;
    insert into teste.resultado (ok, nome) values (position(lower(trecho) in lower(sqlerrm || ' ' || coalesce(h, ''))) > 0, nome || ' [' || sqlerrm || ' | hint ' || coalesce(h, '-') || ']');
  end;
end $$;
grant execute on all functions in schema teste to authenticated, anon;

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'a@teste.local', '{"full_name":"Pessoa A"}'), ('22222222-2222-4222-8222-222222222222', 'b@teste.local', '{"full_name":"Pessoa B"}');
select teste.ok((select count(*) = 2 from public.perfis where user_id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')), 'gatilho cria perfil');
select teste.ok((select count(*) = 2 from public.configuracoes where user_id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')), 'gatilho cria configurações');

-- ===== Pessoa A importa o backup real =====
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-4111-8111-111111111111', 'role', 'authenticated')::text, false);
set role authenticated;
select teste.ok((public.importar_backup((select v from teste.dados where nome = 'payload')) ->> 'treinos')::int = 5, 'importa 5 treinos');
select teste.ok((select count(*) from public.treinos) = 5, 'A vê 5 treinos');
select teste.ok((select count(*) from public.semana) = 7, 'semana com 7 dias');
select teste.ok((select count(*) from public.treino_exercicios) > 20, 'exercícios dos treinos entraram');
select teste.ok((select nome = 'Pessoa A' and altura_cm = 175 from public.perfis), 'perfil importado');
select teste.ok((select gordura_pct = 15 and peso_kg = 75 from public.medidas), 'medida importada');
select public.importar_backup((select v from teste.dados where nome = 'payload'));
select teste.ok((select count(*) from public.treinos) = 5 and (select count(*) from public.medidas) = 1, 'importar de novo não duplica');
select teste.ok(public.salvar_sessao((select v from teste.dados where nome = 'sessao')) is not null, 'salva sessão com séries');
select public.salvar_sessao((select v from teste.dados where nome = 'sessao'));
select teste.ok((select count(*) from public.series) = 4 and (select count(*) from public.sessao_exercicios) = 2, 'salvar a mesma sessão de novo não duplica');
insert into public.sessao_rascunho (dados) values ('{"sessao_id":"aaaaaaaa-0000-4000-8000-000000000001"}');
select public.salvar_sessao((select v from teste.dados where nome = 'sessao'));
select teste.ok((select count(*) from public.sessao_rascunho) = 0, 'salvar a sessão limpa o rascunho dela');
insert into public.sessao_rascunho (dados) values ('{"sessao_id":"bbbbbbbb-0000-4000-8000-000000000009"}');
select public.salvar_sessao((select v from teste.dados where nome = 'sessao'));
select teste.ok((select count(*) from public.sessao_rascunho) = 1, 'reenviar sessão antiga não apaga o treino em andamento');
delete from public.sessao_rascunho;
select public.salvar_sessao(((select v from teste.dados where nome = 'sessao') - 'exercicios' - 'tempos') || '{"kcal": 420}');
select teste.ok((select count(*) from public.series) = 4 and (select kcal from public.sessoes) = 420, 'pedido só com o cabeçalho não apaga as séries');
select public.salvar_sessao(jsonb_set(jsonb_set((select v from teste.dados where nome = 'sessao'), '{id}', '"aaaaaaaa-0000-4000-8000-000000000003"'), '{treino_id}', '"99999999-9999-4999-8999-999999999999"'));
select teste.ok((select treino_id is null from public.sessoes where id = 'aaaaaaaa-0000-4000-8000-000000000003'), 'sessão de treino apagado em outro aparelho salva sem vínculo');
delete from public.sessoes where id = 'aaaaaaaa-0000-4000-8000-000000000003';
select teste.erro($$select public.importar_backup((select v from teste.dados where nome = 'ruim'))$$, 'Nada foi importado. Sessão de 12/10/2026', 'importação com RIR 5 é recusada e diz onde');
select teste.erro($$select public.importar_backup((select v from teste.dados where nome = 'ruim'))$$, 'series_rir_faixa', 'erro da importação traz o nome da regra para o app traduzir');
select teste.erro($$update public.sessoes set dor_articular_ex = '{""}'$$, 'sessoes_dor_ex_validos', 'dor articular com exercício vazio é recusada');
select teste.erro($$update public.configuracoes set regras = '{"rirSubir": "x"}'$$, 'configuracoes_regras_validas', 'regra com texto no lugar de número é recusada sem erro de conversão');
select teste.erro($$insert into public.calibracoes (aplicada_em, limiar_h, queda_pct, sessoes) values (current_date + 9, 6, 8, 12)$$, 'data_futura', 'calibragem no futuro é recusada');
select teste.ok((select count(*) from public.sessoes) = 1, 'importação recusada não deixou nada pela metade');
select teste.erro($$update public.configuracoes set regras = '{"rirSubir": 9}'$$, 'check', 'regra fora da faixa é recusada');
select teste.erro($$update public.configuracoes set regras = '{"inventada": 1}'$$, 'check', 'regra desconhecida é recusada');
select teste.ok((select count(*) = 0 from public.configuracoes where regras ? 'inventada'), 'regras continuam válidas');
select teste.erro($$insert into public.noites (data, horas) values (current_date + 5, 7)$$, 'ainda não chegou', 'noite no futuro é recusada');
select teste.erro($$insert into public.noites (data, horas) values (current_date, 15)$$, 'check', 'noite de 15 h é recusada');
select teste.erro($$update public.sessoes set dor_articular_ex = '{}'$$, 'check', 'dor articular sem exercício é recusada');
select teste.erro($$insert into public.medidas (data) values (current_date)$$, 'check', 'medida vazia é recusada');
insert into public.sessao_rascunho (dados) values ('{"treino":"D"}');

-- ===== Pessoa B não vê nem mexe em nada de A =====
reset role;
select set_config('request.jwt.claims', json_build_object('sub', '22222222-2222-4222-8222-222222222222', 'role', 'authenticated')::text, false);
set role authenticated;
select teste.ok((select count(*) from public.treinos) = 0, 'B não vê treinos de A');
select teste.ok((select count(*) from public.sessoes) = 0 and (select count(*) from public.series) = 0, 'B não vê sessões nem séries de A');
select teste.ok((select count(*) from public.perfis) = 1 and (select nome from public.perfis) = 'Pessoa B', 'B só vê o próprio perfil');
select teste.ok((select count(*) from public.sessao_rascunho) = 0, 'B não vê o rascunho de A');
with u as (update public.treinos set nome = 'invadido' returning 1) select teste.ok((select count(*) from u) = 0, 'B não altera treino de A');
with d as (delete from public.medidas returning 1) select teste.ok((select count(*) from d) = 0, 'B não apaga medida de A');
select teste.erro(format($$insert into public.treinos (user_id, nome, tipo) values (%L, 'x', 'forca')$$, '11111111-1111-4111-8111-111111111111'), 'row-level security', 'B não cria treino em nome de A');
select teste.erro(format($$insert into public.treino_exercicios (treino_id, posicao, ex_chave, series, reps, cat) values (%L, 9, 'x', 3, '10', 'comp')$$, 'e23799d8-1238-5967-a410-444c47be086b'), 'foreign key', 'B não pendura exercício no treino de A');
select teste.erro(format($$insert into public.semana (dia, treino_id) values (0, %L)$$, 'e23799d8-1238-5967-a410-444c47be086b'), 'foreign key', 'B não põe treino de A na própria semana');
select teste.erro($$select public.salvar_sessao((select v from teste.dados where nome = 'sessao'))$$, 'row-level security', 'B não sobrescreve sessão de A pelo id');
select teste.erro($$select public.importar_backup((select v from teste.dados where nome = 'payload'))$$, 'sem_permissao', 'B não importa por cima dos ids de A');
select teste.erro(format($$select private.apagar_usuario(%L)$$, '11111111-1111-4111-8111-111111111111'), 'própria conta', 'B não apaga a conta de A');

-- ===== Visitante sem login não alcança nada =====
reset role;
select set_config('request.jwt.claims', '', false);
set role anon;
select teste.erro($$select count(*) from public.treinos$$, 'permission denied', 'sem login não lê treinos');
select teste.erro($$select public.importar_backup('{}')$$, 'permission denied', 'sem login não chama funções');

-- ===== Remoção e sincronização =====
reset role;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-4111-8111-111111111111', 'role', 'authenticated')::text, false);
set role authenticated;
delete from public.treinos where id = 'e23799d8-1238-5967-a410-444c47be086b';
select teste.ok((select count(*) from public.remocoes where tabela = 'treinos' and registro_id = 'e23799d8-1238-5967-a410-444c47be086b') = 1, 'remoção fica registrada');
select teste.ok((select count(*) from public.semana where treino_id is null) >= 1, 'semana fica com descanso no lugar do treino apagado');
select teste.ok((select treino_id is null and nome like 'Peito%' from public.sessoes), 'sessão mantém o nome se o treino some');
select teste.ok((select count(*) from public.treino_exercicios where treino_id = 'e23799d8-1238-5967-a410-444c47be086b') = 0, 'exercícios do treino apagado somem');
select teste.erro($$insert into public.remocoes (user_id, tabela, registro_id) values (auth.uid(), 'treinos', gen_random_uuid())$$, 'permission denied', 'remoções só pelo gatilho');
select public.importar_backup((select v from teste.dados where nome = 'payload'));
select teste.ok((select count(*) from public.treinos where id = 'e23799d8-1238-5967-a410-444c47be086b') = 1 and (select count(*) from public.remocoes where registro_id = 'e23799d8-1238-5967-a410-444c47be086b') = 0, 'reimportar o treino apagado tira a lápide dele');

-- ===== Apagar a conta =====
select public.apagar_minha_conta();
reset role;
select teste.ok((select count(*) from auth.users where id = '11111111-1111-4111-8111-111111111111') = 0, 'conta de A apagada');
select teste.ok((select count(*) from public.sessoes where user_id = '11111111-1111-4111-8111-111111111111') + (select count(*) from public.treinos where user_id = '11111111-1111-4111-8111-111111111111') + (select count(*) from public.series where user_id = '11111111-1111-4111-8111-111111111111') + (select count(*) from public.remocoes where user_id = '11111111-1111-4111-8111-111111111111') + (select count(*) from public.perfis where user_id = '11111111-1111-4111-8111-111111111111') = 0, 'todos os dados de A foram junto');
select teste.ok((select count(*) from public.perfis where user_id = '22222222-2222-4222-8222-222222222222') = 1, 'B continua intacto');

-- resultado
reset role;
select count(*) filter (where ok) as passaram, count(*) filter (where not ok) as falharam,
  string_agg(case when ok then null else n || ': ' || nome end, ' || ' order by n) as falhas
from teste.resultado;
