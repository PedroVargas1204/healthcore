import sys
from base import *
async def f(p):
    e=float(sys.argv[1]); pref=sys.argv[2]
    ctx,pg,erros=await abrir(p, largura=390, altura=844)
    await pg.add_init_script(f"new MutationObserver((m,o)=>{{if(document.head){{const s=document.createElement('style');s.textContent='html{{font-size:{e*17}px}}';document.head.prepend(s);o.disconnect()}}}}).observe(document,{{childList:true,subtree:true}})")
    for r in sys.argv[3:]:
        rota,nome=r.rsplit('=',1)
        await pg.goto(BASE+rota); await pg.wait_for_timeout(1500)
        await foto(pg, f'{pref}-{nome}')
    await ctx.close()
rodar(f)
