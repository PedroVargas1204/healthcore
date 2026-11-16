from base import *
async def f(p):
    ctx,pg,erros=await abrir(p)
    await pg.goto(BASE+'/treino/resumo/?id=37edb6e7-763a-4320-a4ff-3daf9001eb9e'); await pg.wait_for_timeout(2000)
    await pg.get_by_role('button', name='Compartilhar').click(); await pg.wait_for_timeout(1500)
    await foto(pg,'40-adesivo')
    print(await pg.inner_text('[role=dialog]'))
    print([e for e in erros if 'Service Worker' not in e][:8])
    await ctx.close()
rodar(f)
