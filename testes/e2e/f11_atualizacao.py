"""Atualização do app: com o app aberto há um tempo, uma versão nova publicada só entra quando ele vai para segundo
plano (e aí recarrega escondido). Simula a versão nova trocando o nome da versão no sw.js servido."""
import re, shutil, sys
from base import *
SW = os.path.join(AQUI, '../../out/sw.js')
falhas = []
def conferir(c, m):
    print(('ok     ' if c else 'FALHOU ') + m)
    if not c: falhas.append(m)
async def f(p):
    shutil.rmtree('/tmp/hc-perfil-atualiza', ignore_errors=True)
    ctx, pg, _ = await abrir(p, perfil='/tmp/hc-perfil-atualiza', sw='allow')
    await pg.goto(BASE+'/'); await pg.wait_for_timeout(5000)
    await pg.reload(); await pg.wait_for_timeout(7000)  # passa a janela de abertura (5 s) e a checagem que a navegação faz
    conferir(await pg.evaluate("!!navigator.serviceWorker.controller"), 'service worker controla a página')
    v1 = await pg.evaluate("caches.keys()")
    original = open(SW).read()
    try:
        open(SW, 'w').write(re.sub(r'const VERSAO = "[^"]+"', 'const VERSAO = "hc-teste-nova"', original))
        await pg.evaluate("window.__marca = 1")
        await pg.wait_for_timeout(5500)  # passou o momento de abertura: agora só atualiza em segundo plano
        await pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>r.update())"); await pg.wait_for_timeout(4000)
        espera = await pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>!!r.waiting)")
        conferir(espera, 'versão nova baixou e está esperando')
        conferir(await pg.evaluate("window.__marca === 1"), 'com o app na tela, não recarregou')
        await pg.evaluate("Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}); document.dispatchEvent(new Event('visibilitychange'))")
        await pg.wait_for_timeout(4000)
        conferir(await pg.evaluate("window.__marca === undefined"), 'ao ir para segundo plano, recarregou')
        chaves = await pg.evaluate("caches.keys()")
        conferir(chaves == ['hc-teste-nova'], f'só o cache novo ficou ({v1} → {chaves})')
    finally:
        open(SW, 'w').write(original)
    await ctx.close()
rodar(f)
sys.exit(1 if falhas else 0)
