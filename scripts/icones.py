# Gera os ícones PNG do app a partir de public/icone.svg (rode uma vez; os PNGs vão para o repositório).
from playwright.sync_api import sync_playwright
svg = open('public/icone.svg').read()
alvos = [('icone-192.png', 192, 0), ('icone-512.png', 512, 0), ('icone-mascara-512.png', 512, 0.1), ('apple-touch-icon.png', 180, 0)]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for nome, tam, folga in alvos:
        pg = b.new_page(viewport={'width': tam, 'height': tam})
        pad = int(tam * folga)
        pg.set_content(f'<html><body style="margin:0;background:#FF4D2E"><div style="padding:{pad}px">{svg.replace("<svg ", f"<svg width=\"{tam-2*pad}\" height=\"{tam-2*pad}\" ")}</div></body></html>')
        pg.screenshot(path=f'public/{nome}', omit_background=False)
        pg.close()
    b.close()
print('ok')
