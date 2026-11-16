from base import *
async def f(p):
    ctx,pg,erros=await abrir(p)
    await pg.goto(BASE+'/treinos/modelos/'); await pg.wait_for_timeout(2000)
    await foto(pg,'50-modelos')
    await pg.get_by_role('button', name='Usar este plano').last.click(); await pg.wait_for_timeout(600)
    await pg.get_by_role('button', name='Usar', exact=True).click(); await pg.wait_for_timeout(2500)
    await pg.goto(BASE+'/'); await pg.wait_for_timeout(2000); await foto(pg,'51-hoje-cond', True)
    b=pg.get_by_role('button', name='Começar')
    if not await b.count(): b=pg.get_by_role('button', name='Treinar de novo')
    await b.click(); await pg.wait_for_timeout(1500)
    if '/treino' not in pg.url:
        await foto(pg,'52-escolha'); print(await pg.inner_text('body'))
    await foto(pg,'52-cond', True); print(pg.url); print((await pg.inner_text('body'))[:900])
    print([e for e in erros if 'Service Worker' not in e][:8])
    await ctx.close()
rodar(f)
