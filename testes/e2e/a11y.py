"""Varredura de acessibilidade (axe-core) em todas as telas, tema escuro e claro."""
import sys, json
from base import *
AXE=open(os.path.join(AQUI,'../../node_modules/axe-core/axe.min.js')).read()
S='37edb6e7-763a-4320-a4ff-3daf9001eb9e'
ROTAS=['/', '/treinos/', '/sono/', '/historico/', '/progresso/', '/progresso/musculos/', f'/historico/sessao/?id={S}',
  f'/historico/editar/?id={S}', '/treinos/modelos/', '/biblioteca/', '/exercicio/?id=elev_lateral', '/ajustes/', '/ajustes/conta/',
  '/ajustes/medidas/', f'/treino/resumo/?id={S}', '/importar/', '/privacidade/', '/boas-vindas/plano/']
async def f(p):
    total={}
    for tema in ['dark','light']:
        ctx,pg,erros=await abrir(p, tema=tema)
        for r in ROTAS:
            await pg.goto(BASE+r); await pg.wait_for_timeout(1500)
            await pg.add_script_tag(content=AXE)
            res=await pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21aa','best-practice']}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,ex:v.nodes.slice(0,3).map(n=>n.target.join(' ')+' :: '+(n.failureSummary||'').split('\\n').slice(1,2).join(' ').slice(0,140))})))")
            for v in res:
                k=(v['id'],v['impact'])
                total.setdefault(k,[]).append((tema,r,v['n'],v['ex']))
        await ctx.close()
    for (i,imp),l in sorted(total.items(), key=lambda x:x[0][1] or ''):
        print(f'== {i} [{imp}] em {len(l)} telas')
        for tema,r,n,ex in l[:4]: print('  ',tema,r,n, ex[:2])
if __name__=="__main__": rodar(f)
