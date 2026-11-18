"""Procura estouro horizontal (coisa saindo pela direita) em todas as telas, em larguras e tamanhos de letra diferentes.
Letra (o padrão do iPhone é 17 px): 135% é o maior tamanho comum (23 px); 165% e 194% são os dois primeiros de
acessibilidade (28 e 33 px). 312% é o maior de acessibilidade (53 px): o app limita a 33 px, então tem que caber igual.
Uso: estouro.py [escalas separadas por vírgula, ex. 1.35,1.94]"""
import sys
from base import *
from a11y import ROTAS
EXTRA=['/treino/','/treino/fechar/']
async def f(p):
    achou=0
    escalas = [float(x) for x in sys.argv[1].split(',')] if len(sys.argv) > 1 else [1, 1.35, 1.65, 1.94, 3.12]
    casos = [(l, e) for e in escalas for l in ([375, 320] if e == 1 else [390])]
    for larg, escala in casos:
        ctx,pg,erros=await abrir(p, largura=larg, altura=700)
        # Simula o tamanho de letra do sistema como uma regra de CSS, que é o que o iPhone faz com -apple-system-body.
        await pg.add_init_script(f"new MutationObserver((m,o)=>{{if(document.head){{const s=document.createElement('style');s.textContent='html{{font-size:{escala*17}px}}';document.head.prepend(s);o.disconnect()}}}}).observe(document,{{childList:true,subtree:true}})")
        for r in ROTAS+EXTRA:
            await pg.goto(BASE+r); await pg.wait_for_timeout(1300)
            res=await pg.evaluate("""()=>{const W=document.documentElement.clientWidth; const fora=[];
              for(const el of document.querySelectorAll('body *')){const b=el.getBoundingClientRect(); if(!b.width||!b.height) continue;
                let q=el, fixo=false; while(q){if(getComputedStyle(q).position==='fixed'){fixo=true;break} q=q.parentElement} if(fixo) continue;
                let p=el.parentElement, rola=false; while(p){const o=getComputedStyle(p).overflowX; if(o==='auto'||o==='scroll'||o==='hidden'){rola=true;break} p=p.parentElement}
                if(!rola && b.right>W+1) fora.push((el.tagName+'.'+(el.className.baseVal??el.className)).slice(0,70)+' '+(el.textContent||'').trim().slice(0,25)+' →'+Math.round(b.right-W));}
              // Texto que vaza da própria caixa (uma palavra longa que não quebra) também empurra a tela.
              const w=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const rg=document.createRange();
              while(w.nextNode()){const t=w.currentNode; if(!t.textContent.trim()) continue; rg.selectNodeContents(t); const b=rg.getBoundingClientRect();
                if(b.right<=W+1||!b.width) continue; let p=t.parentElement, livre=true; while(p){const cs=getComputedStyle(p); if(cs.position==='fixed'||['auto','scroll','hidden','clip'].includes(cs.overflowX)){livre=false;break} p=p.parentElement}
                if(livre) fora.push('texto "'+t.textContent.trim().slice(0,30)+'" em '+(t.parentElement.className||t.parentElement.tagName).toString().slice(0,50)+' →'+Math.round(b.right-W));}
              return {sw:document.documentElement.scrollWidth, W, fora:fora.slice(0,5), fs:getComputedStyle(document.documentElement).fontSize}}""")
            if escala > 1.94 and res['fs'] != '33px': print(f"limite de letra não aplicado em {r}: {res['fs']}"); achou+=1
            if res['sw']>res['W']+1 or res['fora']:
                achou+=1; print(f"{larg}px {int(escala*100)}% {r} rolagem={res['sw']-res['W']} {res['fora']}")
                await foto(pg, f"estouro-{larg}-{int(escala*100)}-{r.strip('/').replace('/','_').split('?')[0] or 'hoje'}")
        await ctx.close()
    print('telas com estouro:', achou)
rodar(f)
