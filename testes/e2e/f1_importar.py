import sys
from base import *
ARQ=sys.argv[1] if len(sys.argv)>1 else '/tmp/backup-rico.json'
ESCOLHA=sys.argv[2] if len(sys.argv)>2 else 'Usar o plano novo'
async def f(p):
    ctx,pg,erros=await abrir(p)
    await pg.goto(BASE+'/'); await pg.wait_for_timeout(2500)
    print('1', pg.url); await foto(pg,'01-boasvindas')
    await pg.goto(BASE+'/importar/?origem=inicio'); await pg.wait_for_timeout(1500)
    await pg.set_input_files('input[type=file]', ARQ); await pg.wait_for_timeout(800)
    await foto(pg,'02-previa')
    await pg.get_by_role('button', name='Importar').click()
    await pg.get_by_text('Tudo certo').wait_for(timeout=30000)
    await foto(pg,'03-pronto')
    await pg.get_by_role('button', name=ESCOLHA).click()
    await pg.wait_for_timeout(4000)
    print('2', pg.url); await foto(pg,'04-hoje'); await foto(pg,'04-hoje-cheia', True)
    print('\n'.join(erros[:30]))
    await ctx.close()
rodar(f)
