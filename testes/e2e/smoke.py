import asyncio, json, subprocess, sys
from playwright.async_api import async_playwright
UID='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'
SESSAO=subprocess.check_output(['node','jwt.mjs',UID,'pessoa@teste.local','Pessoa Teste']).decode().strip()
BASE='http://localhost:3020'
async def rota(route):
    u=route.request.url.replace('https://hiroraxpqkylghzkvcxp.supabase.co', BASE)
    try:
        r=await route.fetch(url=u)
        await route.fulfill(response=r)
    except Exception:
        await route.abort()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, color_scheme='dark', has_touch=True, is_mobile=True, service_workers='block')
        await ctx.route('https://hiroraxpqkylghzkvcxp.supabase.co/**', rota)
        await ctx.add_init_script(f"localStorage.setItem('healthcore-sessao', {json.dumps(SESSAO)});")
        pg=await ctx.new_page(); erros=[]
        pg.on('pageerror', lambda e: erros.append('pageerror '+str(e)))
        pg.on('console', lambda m: erros.append(m.type+' '+m.text) if m.type in ('error','warning') else None)
        await pg.goto(BASE+'/'); await pg.wait_for_timeout(3000)
        print('url', pg.url)
        await pg.screenshot(path='/tmp/s1.png')
        print('\n'.join(erros[:20]))
        await b.close()
asyncio.run(main())
