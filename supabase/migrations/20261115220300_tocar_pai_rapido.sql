-- HealthCore · tocar_pai acha o pai pela chave primária.
-- Na versão anterior, o ramo das séries juntava sessoes com sessao_exercicios e o plano genérico varria
-- todas as sessões da pessoa a cada série: reimportar 400 sessões passava do limite de 8 s.

create or replace function private.tocar_pai()
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
    -- Se o exercício já saiu (apagado junto com a sessão ou trocado pelo salvar_sessao), não há pai a tocar.
    update public.sessoes set atualizado_em = now()
    where id = (select e.sessao_id from public.sessao_exercicios e
                where e.id = (v_linha ->> 'sessao_exercicio_id')::uuid)
      and atualizado_em < now();
  end if;
  return null;
end;
$$;

revoke all on function private.tocar_pai() from public, anon, authenticated, service_role;
