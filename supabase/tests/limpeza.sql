-- Apaga as pessoas de teste e os schemas de teste.
delete from auth.users where id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333');
drop schema if exists teste cascade;
drop schema if exists teste_carga cascade;
