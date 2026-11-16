import sys
from base import *
# uso: fotos.py largura tema prefixo rota=nome ...
async def f(p):
    L=int(sys.argv[1]); ctx,pg,erros=await abrir(p, largura=L, altura=844 if L>=390 else 667, tema=sys.argv[2])
    for par in sys.argv[4:]:
        rota,nome=par.rsplit('=',1)
        await pg.goto(BASE+rota); await pg.wait_for_timeout(1800)
        await foto(pg, f'{sys.argv[3]}-{nome}', True)
        if erros: print(nome, erros[:5]); erros.clear()
    await ctx.close()
rodar(f)
