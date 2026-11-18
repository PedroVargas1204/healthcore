# HealthCore

App de treino para celular (PWA): musculação com foco em ombro lateral e dorsal, condicionamento estilo Hyrox, sono e progresso. Funciona sem internet durante o treino e sincroniza quando a conexão volta.

## Como é feito

- **Next.js (App Router) + TypeScript + Tailwind**, exportado como site estático (`out/`).
- **Supabase**: Postgres com RLS (cada pessoa só vê os próprios dados) e login com Google.
- **No aparelho**: IndexedDB (Dexie). Toda tela lê do aparelho; cada mudança entra numa fila e sobe para a nuvem.
- **Service worker** gerado depois do build (`scripts/gerar-sw.mjs`): guarda o app inteiro para abrir sem rede.

## Pastas

| Pasta | O que tem |
|---|---|
| `src/app` | Telas |
| `src/componentes` | Peças de interface |
| `src/lib/dominio` | Regras: catálogo, volume por músculo, recordes, conversor do backup antigo |
| `src/lib/dados` | Banco do aparelho, fila e sincronização |
| `src/lib/acoes` | Treino em andamento, importar, exportar, planos |
| `src/lib/dominio/regras.ts` | Recomendação de carga: prontidão, sugestão por exercício, deload, calibragem do sono |
| `testes/referencia` | Recomendação do app antigo, guardada só para os testes de comparação |
| `supabase/migrations` | Esquema do banco, RLS e funções |
| `supabase/tests` | Testes do banco |
| `testes` | Testes de unidade e de ponta a ponta |
| `DESIGN.md` | Sistema de design aprovado |

## Comandos

```
npm install
npm run dev        # desenvolvimento
npm run build      # gera out/ e o service worker
npm test           # testes de unidade
npm run typecheck
npm run lint
```

Os testes de ponta a ponta (`testes/e2e`) usam um Postgres e um PostgREST locais com as migrações aplicadas; `servidor.mjs` serve `out/` e simula queda de rede. Com o backup importado:

```
python3 testes/e2e/suite.py      # fluxos principais, sem rede, dois aparelhos, atualização do app
python3 testes/e2e/a11y.py       # acessibilidade (axe) em todas as telas, tema claro e escuro
python3 testes/e2e/estouro.py    # nada sai da tela em 320 e 375 pontos e com letra de 135% a 312%
```

Testes do banco: `supabase/tests/banco.sql` (depois `limpeza.sql`).
