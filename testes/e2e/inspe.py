import sys
from base import *
async def f(p):
    ctx,pg,erros=await abrir(p)
    await pg.goto(BASE+sys.argv[1]); await pg.wait_for_timeout(2500)
    print(await pg.evaluate(sys.argv[2]))
    await ctx.close()
rodar(f)
