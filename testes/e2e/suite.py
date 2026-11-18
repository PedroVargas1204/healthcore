"""Suíte de ponta a ponta. Precisa do Postgres, do PostgREST e do servidor.mjs no ar, e do backup já importado.

Roda: python3 suite.py   (sai com código 1 se algum passo falhar)"""
import re, subprocess, urllib.request, sys, traceback
from base import *

def sql(q): return subprocess.check_output(['psql','-h','/tmp/pglocal','-p','54329','-U','postgres','hc','-Atc',q]).decode().strip()
def rede(falhar): urllib.request.urlopen(f'{BASE}/__teste/rede?falhar={1 if falhar else 0}').read()
S = sql("select id from sessoes where user_id='%s' and tipo='forca' order by data desc limit 1" % UID)
T = sql("select id from treinos where user_id='%s' and tipo='forca' order by posicao limit 1" % UID)
T_NOME = sql(f"select nome from treinos where id='{T}'")
resultados = []

async def sincronizar(pg):
    await pg.goto(BASE+'/ajustes/conta/'); await pg.wait_for_timeout(1200)
    await pg.get_by_role('button', name='Sincronizar agora').click()
    await pg.get_by_text('Tudo salvo na nuvem.').wait_for(timeout=10000)

async def passo(nome, f, pg):
    try:
        await f(pg); resultados.append((nome, 'ok', ''))
    except Exception as e:
        resultados.append((nome, 'FALHOU', f'{type(e).__name__}: {str(e)[:300]}'))
        await foto(pg, 'falha-'+nome.replace(' ','-'))

async def editar_sessao(pg):
    kcal = sql(f"select coalesce(kcal,0) from sessoes where id='{S}'")
    novo = 432 if kcal != '432' else 433
    await pg.goto(f'{BASE}/historico/editar/?id={S}'); await pg.wait_for_timeout(1500)
    await pg.get_by_label('Kcal').fill(str(novo))
    await pg.get_by_role('button', name='Salvar alterações').click(); await pg.wait_for_timeout(800)
    await sincronizar(pg)
    assert sql(f"select kcal from sessoes where id='{S}'") == str(novo), 'kcal não chegou ao banco'

async def editar_treino(pg):
    for nome in ['Treino renomeado no teste', T_NOME]:
        await pg.goto(f'{BASE}/treinos/editar/?id={T}'); await pg.wait_for_timeout(1500)
        campo = pg.locator('input[maxlength="60"]').first
        await campo.fill(nome)
        await pg.get_by_role('button', name='Salvar treino').click(); await pg.wait_for_timeout(800)
        await sincronizar(pg)
        assert sql(f"select nome from treinos where id='{T}'") == nome, f'nome não virou {nome}'

async def treino_forca(pg):
    await pg.goto(BASE+'/'); await pg.wait_for_timeout(1500)
    if await pg.get_by_role('button', name='Continuar').count():  # treino aberto de uma execução anterior
        await pg.get_by_role('button', name='Continuar').click()
    else:
        b = pg.get_by_role('button', name='Treinar de novo')
        if not await b.count(): b = pg.get_by_role('button', name='Escolher outro treino')
        await b.click(); await pg.wait_for_timeout(500)
        await pg.get_by_text(T_NOME, exact=True).first.click()
    await pg.wait_for_url('**/treino/', timeout=8000); await pg.wait_for_timeout(800)
    # digitar a carga: o campo mostra o que se digita e, ao sair, o valor formatado
    carga = pg.get_by_role('textbox', name='carga').first
    await carga.click(); await carga.fill('61,5'); await carga.press('Enter'); await pg.wait_for_timeout(300)
    assert await carga.input_value() == '61,5', f'carga mostrou {await carga.input_value()}'
    await pg.get_by_role('button', name=re.compile(r'^Mais .* em carga$')).first.click(); await pg.wait_for_timeout(200)
    v = await carga.input_value(); assert v != '61,5', 'botão + não atualizou o campo'
    await pg.get_by_role('group', name='RIR').get_by_role('button').nth(2).click(); await pg.wait_for_timeout(800)
    await pg.get_by_role('dialog', name='Descanso').wait_for(timeout=3000)
    await pg.get_by_role('button', name='Pular').click(); await pg.wait_for_timeout(400)
    # fechar com uma série feita
    await pg.goto(BASE+'/treino/fechar/'); await pg.wait_for_timeout(1500)
    assert await pg.get_by_role('heading', name='Fechar treino').count(), 'tela de fechar não abriu'
    antes = int(sql(f"select count(*) from sessoes where user_id='{UID}'"))
    await pg.get_by_role('button', name='Salvar treino').click()
    await pg.wait_for_url('**/treino/resumo/**', timeout=8000)
    await sincronizar(pg)
    assert int(sql(f"select count(*) from sessoes where user_id='{UID}'")) == antes + 1, 'sessão não chegou ao banco'

async def sem_rede_e_sair(pg):
    rede(True)
    try:
        await pg.goto(BASE+'/sono/'); await pg.wait_for_timeout(1500)
        await pg.get_by_role('button', name='Lançar').or_(pg.get_by_role('button', name='Editar')).first.click(); await pg.wait_for_timeout(600)
        d = pg.get_by_role('dialog')
        await d.get_by_text('7,5', exact=True).click(); await d.get_by_text('4', exact=True).click()
        await d.get_by_role('button', name='Salvar').click(); await pg.wait_for_timeout(1000)
        await pg.goto(BASE+'/ajustes/conta/'); await pg.wait_for_timeout(1200)
        await pg.get_by_text('Sair da conta').click(); await pg.wait_for_timeout(500)
        assert await pg.get_by_role('heading', name='Sair sem salvar tudo?').count(), 'sair com pendência não pediu confirmação'
        await pg.get_by_role('button', name='Ficar').click(); await pg.wait_for_timeout(300)
        assert '/ajustes/conta/' in pg.url, 'saiu mesmo escolhendo Ficar'
    finally:
        rede(False)
    await sincronizar(pg)

async def f(p):
    ctx, pg, erros = await abrir(p)
    await pg.goto(BASE+'/'); await pg.wait_for_timeout(3000)
    for nome, fn in [('editar sessao', editar_sessao), ('editar treino', editar_treino), ('treino de forca', treino_forca), ('sem rede e sair', sem_rede_e_sair)]:
        await passo(nome, fn, pg)
    graves = [e for e in erros if 'Service Worker' not in e and 'Failed to load resource' not in e]
    resultados.append(('erros no console', 'ok' if not graves else 'FALHOU', '; '.join(graves[:5])))
    await ctx.close()

rodar(f)
for etapa in ['f3_offline.py', 'f4_sw.py', 'f10_dois_aparelhos.py', 'f11_atualizacao.py']:
    r = subprocess.run([sys.executable, etapa], capture_output=True, text=True, cwd=AQUI)
    resultados.append((etapa, 'ok' if r.returncode == 0 and 'FALHOU' not in r.stdout else 'FALHOU', (r.stdout + r.stderr)[-300:] if r.returncode else ''))
for n, st, det in resultados: print(f'{st:7} {n}  {det}')
sys.exit(1 if any(st != 'ok' for _, st, _ in resultados) else 0)
