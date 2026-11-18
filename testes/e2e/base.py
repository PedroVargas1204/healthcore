"""Apoio dos testes de ponta a ponta: abre o Chrome com uma sessao falsa e manda o trafego do Supabase para o servidor local."""
import asyncio, json, subprocess, os, sys
from playwright.async_api import async_playwright
UID='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'
AQUI=os.path.dirname(os.path.abspath(__file__))
SESSAO=subprocess.check_output(['node',os.path.join(AQUI,'jwt.mjs'),UID,'pessoa@teste.local','Pessoa Teste']).decode().strip()
BASE='http://localhost:3020'
PERFIL='/tmp/hc-perfil-limpo'
async def rota(route):
    u=route.request.url.replace('https://hiroraxpqkylghzkvcxp.supabase.co', BASE)
    try:
        r=await route.fetch(url=u)
        await route.fulfill(response=r)
    except Exception:
        await route.abort()
async def abrir(p, largura=390, altura=844, tema='dark', perfil=PERFIL, sw='block', escala=2):
    ctx=await p.chromium.launch_persistent_context(perfil, executable_path='/usr/bin/google-chrome', args=['--no-sandbox'],
        viewport={'width':largura,'height':altura}, device_scale_factor=escala, color_scheme=tema, has_touch=True, is_mobile=True, service_workers=sw)
    await ctx.route('https://hiroraxpqkylghzkvcxp.supabase.co/**', rota)
    await ctx.add_init_script(f"localStorage.setItem('healthcore-sessao', {json.dumps(SESSAO)});")
    pg=ctx.pages[0] if ctx.pages else await ctx.new_page()
    erros=[]
    pg.on('pageerror', lambda e: erros.append('pageerror '+str(e)))
    pg.on('console', lambda m: erros.append(m.type+' '+m.text) if m.type in ('error','warning') else None)
    return ctx, pg, erros
async def foto(pg, nome, cheia=False):
    await pg.screenshot(path=f'/tmp/fotos/{nome}.png', full_page=cheia)
def rodar(f):
    os.makedirs('/tmp/fotos', exist_ok=True)
    async def m():
        async with async_playwright() as p:
            await f(p)
    asyncio.run(m())
