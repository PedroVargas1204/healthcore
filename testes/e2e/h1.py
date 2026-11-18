from base import *
from a11y import ROTAS
async def f(p):
    ctx,pg,erros=await abrir(p, perfil='/tmp/hc-perfil-limpo')
    for r in ROTAS+['/entrar/','/boas-vindas/','/treino/','/treino/fechar/']:
        await pg.goto(BASE+r); await pg.wait_for_timeout(1300)
        print(await pg.evaluate("[...document.querySelectorAll('h1')].map(h=>h.textContent.trim().slice(0,30))"), r)
    await ctx.close()
rodar(f)
