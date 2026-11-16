-- Importa a carga como a pessoa C (psql, com \\timing). Rode duas vezes para medir a reimportação.
select set_config('request.jwt.claims', json_build_object('sub', '33333333-3333-4333-8333-333333333333', 'role', 'authenticated')::text, false);
set role authenticated;
\timing on
select public.importar_backup((select v from teste_carga.dados)) is not null as ok;
