"""Service worker: depois da primeira visita o app abre e navega sem rede nenhuma."""
from base import *
async def f(p):
    ctx,pg,erros=await abrir(p, perfil='/tmp/hc-perfil-sw', sw='allow')
    await pg.goto(BASE+'/'); await pg.wait_for_timeout(6000)
    print('sw', await pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>r&&(r.active?.state))"))
    print('caches', await pg.evaluate("caches.keys().then(async k=>[k, (await (await caches.open(k[0])).keys()).length])"))
    await ctx.set_offline(True)
    for r in ['/', '/treinos/', '/sono/', '/progresso/musculos/', '/treino/', '/exercicio/?id=elev_lateral']:
        try:
            await pg.goto(BASE+r, timeout=8000); await pg.wait_for_timeout(1500)
            t=(await pg.inner_text('body'))[:60].replace('\n',' | ')
            print('offline', r, '->', t)
        except Exception as e: print('FALHOU', r, str(e)[:120])
    await foto(pg,'30-offline')
    await ctx.set_offline(False)
    await ctx.close()
rodar(f)
