from base import *
async def f(p):
    ctx,pg,erros=await abrir(p)
    await pg.goto(BASE+'/'); await pg.wait_for_timeout(2000)
    await pg.get_by_role('button', name='Começar').click(); await pg.wait_for_timeout(1500)
    print('a', pg.url); await foto(pg,'10-apos-comecar')
    if '/treino' not in pg.url:
        print(await pg.inner_text('body'))
    await foto(pg,'11-treino', True)
    rir=pg.get_by_role('group', name='RIR').get_by_role('button')
    await rir.nth(2).click(); await pg.wait_for_timeout(1200)
    await foto(pg,'12-descanso')
    await pg.get_by_role('button', name='Pular').click(); await pg.wait_for_timeout(500)
    await foto(pg,'13-serie2', True)
    # conclui todas as series de todos os exercicios
    for i in range(60):
        if await pg.get_by_role('dialog', name='Descanso').count():
            await pg.get_by_role('button', name='Pular').click(); await pg.wait_for_timeout(150); continue
        if await rir.count():
            await rir.nth(1 if i%3 else 0).click(); await pg.wait_for_timeout(250); continue
        prox=pg.get_by_role('button', name='Próximo:')
        if await prox.count(): await prox.click(); await pg.wait_for_timeout(250); continue
        break
    await foto(pg,'14-fim', True)
    await pg.get_by_role('button', name='Fechar treino').click(); await pg.wait_for_timeout(1200)
    print('b', pg.url); await foto(pg,'15-fechar', True)
    await pg.get_by_role('button', name='Salvar treino').click(); await pg.wait_for_timeout(2500)
    print('c', pg.url); await foto(pg,'16-resumo', True)
    print(await pg.inner_text('body'))
    print('\n'.join(e for e in erros if 'Service Worker' not in e))
    await ctx.close()
rodar(f)
