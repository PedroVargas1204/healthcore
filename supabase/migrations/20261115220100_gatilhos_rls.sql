-- HealthCore · gatilhos, RLS e concessões (Fase 2). Depende de 20261115220000_esquema_base.

-- ---------------------------------------------------------------------------
-- 3. Gatilhos
-- ---------------------------------------------------------------------------
create trigger tocar_atualizado before update on public.perfis for each row execute function private.tocar_atualizado();
create trigger tocar_atualizado before update on public.configuracoes for each row execute function private.tocar_atualizado();
create trigger tocar_atualizado before update on public.exercicios_proprios for each row execute function private.tocar_atualizado();
create trigger tocar_atualizado before update on public.treinos for each row execute function private.tocar_atualizado();
create trigger tocar_atualizado before update on public.semana for each row execute function private.tocar_atualizado();
create trigger tocar_atualizado before update on public.sessoes for each row execute function private.tocar_atualizado();
create trigger tocar_atualizado before update on public.noites for each row execute function private.tocar_atualizado();
create trigger tocar_atualizado before update on public.medidas for each row execute function private.tocar_atualizado();
create trigger tocar_atualizado before update on public.deloads for each row execute function private.tocar_atualizado();
create trigger tocar_atualizado before update on public.calibracoes for each row execute function private.tocar_atualizado();
create trigger tocar_atualizado before update on public.sessao_rascunho for each row execute function private.tocar_atualizado();

create trigger recusar_data_futura before insert or update of data on public.sessoes for each row execute function private.recusar_data_futura('data');
create trigger recusar_data_futura before insert or update of data on public.noites for each row execute function private.recusar_data_futura('data');
create trigger recusar_data_futura before insert or update of data on public.medidas for each row execute function private.recusar_data_futura('data');
create trigger recusar_data_futura before insert or update of aplicada_em on public.calibracoes for each row execute function private.recusar_data_futura('aplicada_em');

create trigger tocar_pai after insert or update or delete on public.treino_exercicios for each row execute function private.tocar_pai();
create trigger tocar_pai after insert or update or delete on public.treino_estacoes for each row execute function private.tocar_pai();
create trigger tocar_pai after insert or update or delete on public.sessao_exercicios for each row execute function private.tocar_pai();
create trigger tocar_pai after insert or update or delete on public.sessao_tempos for each row execute function private.tocar_pai();
create trigger tocar_pai after insert or update or delete on public.series for each row execute function private.tocar_pai();

create trigger registrar_remocao after delete on public.treinos for each row execute function private.registrar_remocao();
create trigger registrar_remocao after delete on public.sessoes for each row execute function private.registrar_remocao();
create trigger registrar_remocao after delete on public.noites for each row execute function private.registrar_remocao();
create trigger registrar_remocao after delete on public.medidas for each row execute function private.registrar_remocao();
create trigger registrar_remocao after delete on public.exercicios_proprios for each row execute function private.registrar_remocao();
create trigger registrar_remocao after delete on public.deloads for each row execute function private.registrar_remocao();
create trigger registrar_remocao after delete on public.calibracoes for each row execute function private.registrar_remocao();

create trigger limpar_remocao after insert on public.treinos for each row execute function private.limpar_remocao();
create trigger limpar_remocao after insert on public.sessoes for each row execute function private.limpar_remocao();
create trigger limpar_remocao after insert on public.noites for each row execute function private.limpar_remocao();
create trigger limpar_remocao after insert on public.medidas for each row execute function private.limpar_remocao();
create trigger limpar_remocao after insert on public.exercicios_proprios for each row execute function private.limpar_remocao();
create trigger limpar_remocao after insert on public.deloads for each row execute function private.limpar_remocao();
create trigger limpar_remocao after insert on public.calibracoes for each row execute function private.limpar_remocao();

create trigger criar_perfil after insert on auth.users for each row execute function private.criar_perfil();

-- ---------------------------------------------------------------------------
-- 4. RLS: cada linha é de quem a criou
-- ---------------------------------------------------------------------------
alter table public.perfis enable row level security;
alter table public.configuracoes enable row level security;
alter table public.exercicios_proprios enable row level security;
alter table public.treinos enable row level security;
alter table public.treino_exercicios enable row level security;
alter table public.treino_estacoes enable row level security;
alter table public.semana enable row level security;
alter table public.sessoes enable row level security;
alter table public.sessao_exercicios enable row level security;
alter table public.series enable row level security;
alter table public.sessao_tempos enable row level security;
alter table public.noites enable row level security;
alter table public.medidas enable row level security;
alter table public.deloads enable row level security;
alter table public.calibracoes enable row level security;
alter table public.sessao_rascunho enable row level security;
alter table public.remocoes enable row level security;

create policy dono on public.perfis for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.configuracoes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.exercicios_proprios for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.treinos for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.treino_exercicios for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.treino_estacoes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.semana for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.sessoes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.sessao_exercicios for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.series for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.sessao_tempos for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.noites for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.medidas for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.deloads for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.calibracoes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono on public.sessao_rascunho for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dono_le on public.remocoes for select to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 5. Concessões: só o necessário, nada para anon
-- ---------------------------------------------------------------------------
grant select, update on public.perfis, public.configuracoes to authenticated;
grant select, insert, update, delete on
  public.exercicios_proprios, public.treinos, public.treino_exercicios, public.treino_estacoes,
  public.semana, public.sessoes, public.sessao_exercicios, public.series, public.sessao_tempos,
  public.noites, public.medidas, public.deloads, public.calibracoes, public.sessao_rascunho
  to authenticated;
grant select on public.remocoes to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
