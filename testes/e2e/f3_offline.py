"""Sem rede: lança uma noite e uma medida, confere a fila; volta a rede e confere que subiu."""
import urllib.request, subprocess
from base import *
def rede(f): urllib.request.urlopen(f'{BASE}/__teste/rede?falhar={f}').read()
def sql(q): return subprocess.check_output(['psql','-h','/tmp/pglocal','-p','54329','-U','postgres','hc','-Atc',q]).decode().strip()
async def fila(pg):
    return await pg.evaluate("""async()=>{const d=await new Promise((ok,er)=>{const r=indexedDB.open('healthcore-aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa');r.onsuccess=()=>ok(r.result);r.onerror=er});
      return await new Promise(ok=>{const q=d.transaction('fila').objectStore('fila').getAllKeys();q.onsuccess=()=>ok(q.result)})}""")
async def f(p):
    ctx,pg,erros=await abrir(p)
    print('noites antes', sql("select count(*) from noites"))
    rede(1)
    await pg.goto(BASE+'/sono/'); await pg.wait_for_timeout(2000)
    await pg.get_by_role('button', name='Lançar').or_(pg.get_by_role('button', name='Editar')).first.click(); await pg.wait_for_timeout(800)
    await foto(pg,'20-folha-noite')
    d=pg.get_by_role('dialog')
    await d.get_by_text('7,5', exact=True).click()
    await d.get_by_text('4', exact=True).click()
    await d.get_by_role('button', name='Salvar').click(); await pg.wait_for_timeout(1500)
    await foto(pg,'21-sono-offline')
    pend = await fila(pg)
    if not pend: print('FALHOU: sem rede, a noite não entrou na fila')
    print('fila offline', pend, '| banco', sql("select count(*) from noites"))
    await pg.goto(BASE+'/ajustes/conta/'); await pg.wait_for_timeout(1500); await foto(pg,'22-conta-offline')
    rede(0)
    await pg.get_by_role('button', name='Sincronizar agora').click(); await pg.wait_for_timeout(3000)
    await foto(pg,'23-conta-online')
    restante = await fila(pg)
    if restante: print('FALHOU: fila não esvaziou', restante)
    print('fila online', restante, '| banco', sql("select count(*) from noites"), sql("select data,horas,qualidade from noites order by data desc limit 1"))
    print([e for e in erros if 'Service Worker' not in e][:8])
    await ctx.close()
rodar(f)
