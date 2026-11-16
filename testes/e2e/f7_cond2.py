from base import *
async def f(p):
    ctx,pg,erros=await abrir(p)
    await pg.goto(BASE+'/'); await pg.wait_for_timeout(2000)
    await pg.get_by_role('button', name='Treinar de novo').click(); await pg.wait_for_timeout(600)
    await pg.get_by_text('Intervalado de estações').click(); await pg.wait_for_timeout(1500)
    await foto(pg,'53-cond', True); print(pg.url); print((await pg.inner_text('body'))[:700])
    print([e for e in erros if 'Service Worker' not in e][:8])
    await ctx.close()
rodar(f)
