"""Mesmo login em dois aparelhos: o que um muda aparece no outro, apagar some nos dois e, se os dois mudam o mesmo
registro, vale o último que subiu (e o outro aparelho fica igual a ele)."""
import subprocess, sys
from base import *
def sql(q): return subprocess.check_output(['psql','-h','/tmp/pglocal','-p','54329','-U','postgres','hc','-Atc',q]).decode().strip()
S = sql(f"select id from sessoes where user_id='{UID}' and tipo='forca' order by data desc limit 1")
falhas = []
def conferir(cond, msg):
    print(('ok     ' if cond else 'FALHOU ') + msg)
    if not cond: falhas.append(msg)

async def sincronizar(pg):
    await pg.goto(BASE+'/ajustes/conta/'); await pg.wait_for_timeout(1000)
    await pg.get_by_role('button', name='Sincronizar agora').click()
    await pg.get_by_text('Tudo salvo na nuvem.').wait_for(timeout=10000)
    await pg.wait_for_timeout(500)

async def kcal(pg, valor=None):
    await pg.goto(f'{BASE}/historico/editar/?id={S}'); await pg.wait_for_timeout(1300)
    campo = pg.get_by_label('Kcal')
    if valor is None: return await campo.input_value()
    await campo.fill(str(valor)); await pg.get_by_role('button', name='Salvar alterações').click(); await pg.wait_for_timeout(600)

async def medidas(pg):
    await pg.goto(BASE+'/ajustes/medidas/'); await pg.wait_for_timeout(1300)
    return await pg.get_by_role('button', name='Apagar medida', exact=False).count()

async def f(p):
    a, pa, _ = await abrir(p, perfil='/tmp/hc-perfil-limpo')
    b, pb, _ = await abrir(p, perfil='/tmp/hc-perfil-b')
    for pg in (pa, pb):
        await pg.goto(BASE+'/'); await pg.wait_for_timeout(2500); await sincronizar(pg)

    # 1. A muda, B vê
    await kcal(pa, 501); await sincronizar(pa); await sincronizar(pb)
    conferir(await kcal(pb) == '501', 'mudança feita no aparelho A aparece no B')

    # 2. Os dois mudam o mesmo registro: B sobe por último e vale o dele, inclusive no A
    await kcal(pa, 610); await kcal(pb, 720)
    await sincronizar(pa); await sincronizar(pb)
    conferir(sql(f"select kcal from sessoes where id='{S}'") == '720', 'conflito: vale o último que subiu (720)')
    await sincronizar(pa)
    conferir(await kcal(pa) == '720', 'conflito: o aparelho A fica igual à nuvem')

    # 3. B apaga uma medida, ela some no A
    na = await medidas(pa); nb = await medidas(pb)
    conferir(na == nb and na > 0, f'os dois têm as mesmas medidas ({na} e {nb})')
    if nb:
        await pb.get_by_role('button', name='Apagar medida', exact=False).first.click(); await pb.wait_for_timeout(500)
        conf = pb.get_by_role('dialog').get_by_role('button', name='Apagar')
        if await conf.count(): await conf.click(); await pb.wait_for_timeout(500)
        await sincronizar(pb); await sincronizar(pa)
        conferir(await medidas(pa) == nb - 1, 'medida apagada no B some do A')
    await a.close(); await b.close()

rodar(f)
sys.exit(1 if falhas else 0)
