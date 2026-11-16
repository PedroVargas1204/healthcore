# HealthCore — DESIGN.md (v2, Fase 1)

Estilo: **Esportivo ousado**. App de registro de treino usado no meio da série, com uma mão e suado.
Ele precisa ser legível de longe, rápido de tocar e ter cara de quadro de academia, não de painel de SaaS.
As telas de referência estão no canvas "HealthCore – Telas", nas páginas Fundamentos, Mapa muscular, Fluxo de treino, Sono e Progresso e "Entrar, importar e conta".

## Princípios
- **Uma ousadia só por tela.** O título gigante condensado e o bloco laranja do treino do dia são o momento forte. O resto fica quieto: rótulos em caixa normal, divisórias finas, sem sombra.
- **Caixa alta só no título da tela, no bloco do dia e nos botões principais.** Nunca em rótulos.
- **Nada só pela cor.** Prontidão tem barras e palavra; recorde tem troféu e a palavra "Recorde"; o mapa tem legenda com números.
- **Uma mão, sem teclado no treino.** Carga e repetições mudam com botões de menos e mais; tocar no RIR conclui a série.
- **Texto que diz o que fazer.** Erros dizem o que aconteceu e o próximo passo; estados vazios levam à primeira ação.

## Cor
O tema segue o celular (`prefers-color-scheme`). Todo par de texto passa 4,5:1; marcas de gráfico passam 3:1.

| Papel | Token | Escuro | Claro |
|---|---|---|---|
| Fundo da tela | `bg` | `#111214` | `#ECEEF1` |
| Cartões | `s1` | `#1A1B1F` | `#FFFFFF` |
| Campos e botões secundários | `s2` | `#23252A` | `#F3F4F6` |
| Trilho, faixa de meta, item vazio | `s3` | `#2E3036` | `#E2E5E9` |
| Divisórias | `line` | `#2C2E34` | `#DADDE2` |
| Texto | `tx` | `#F3F4F6` | `#111317` |
| Texto de apoio forte | `tx2` | `#D5D8DD` | `#2B2F36` |
| Texto secundário | `mut` | `#A3A7B0` | `#555B66` |
| Desativado | `dim` | `#6E737D` | `#8A909A` |
| Destaque: ações e bloco do dia | `ac` | `#FF4D2E`, texto `#111214` | `#E5401F`, texto `#111317` |
| Destaque pressionado | `acPress` | `#E2462B` | `#CC3818` |
| Destaque como texto | `acTx` | `#FF6A4D` | `#C2331A` |
| Fundo de recorde | `acTint` | `#3A1A13` | `#FCE4DE` |
| Prontidão verde / amarela / vermelha (barras) | `ok` `warn` `bad` | `#34C77B` / `#F2B33D` / `#F0607A` | `#1F9D5B` / `#C9851A` / `#C92A45` |
| Texto sobre o fundo de prontidão | `okTx` `warnTx` `badTx` | `#5BD898` / `#F5C468` / `#F58A9D` | `#157A45` / `#8A5A0F` / `#A8213A` |
| Fundo de prontidão e avisos | `okTint` `warnTint` `badTint` | `#12291D` / `#2E2412` / `#331821` | `#E2F5EA` / `#FBF0DC` / `#FBE3E8` |

**Mapa muscular, séries fracionadas na semana** (um tom, do apagado ao aceso; no claro, mais escuro = mais séries):

| Faixa | 0 | 1–4 | 5–9 | 10–14 | 15+ | Corpo (cabeça, mãos) |
|---|---|---|---|---|---|---|
| Escuro | `#2B2D33` | `#5E2B20` | `#8F3521` | `#C9421F` | `#FF4D2E` | `#222429` |
| Claro | `#DCDFE4` | `#F6C4B5` | `#EE8E70` | `#DB5530` | `#B02E16` | `#EEF0F3` |

No bloco do dia (fundo laranja): músculos principais `#111214`, auxiliares `#7C2D20`, o resto `#E2462B`.
O vermelho da prontidão é carmim-rosado para não se confundir com o laranja das ações.

## Tipografia
Barlow Condensed nos títulos, números e botões principais; Barlow no resto. Tamanhos em rem: no iPhone, `html { font: -apple-system-body }` faz 1 rem seguir o tamanho de letra dos Ajustes. Mínimo de 12 px, só para eixo de gráfico.

| Estilo | Uso | Família e peso | rem (px a 16) | Entrelinha |
|---|---|---|---|---|
| Tela | título da tela, caixa alta | Condensed 800 | 3,25 (52), com teto | 0,9 |
| Número | carga, tempo, kcal | Condensed 800, tabular | 2,25 (36) | 1 |
| Título 1 | seções | Condensed 700 | 1,625 (26) | 1,05 |
| Título 2 | cartões | Condensed 700 | 1,375 (22) | 1,1 |
| Botão | ação principal, caixa alta | Condensed 700 | 1,25 (20) | 1 |
| Destaque | nome do exercício | Barlow 600 | 1,0625 (17) | 1,3 |
| Corpo | texto corrido | Barlow 400 | 1 (16) | 1,45 |
| Rótulo | campos e listas | Barlow 500 | 0,875 (14) | 1,35 |
| Legenda | notas e eixos | Barlow 500 | 0,8125 (13) | 1,35 |

Números de carga, reps, tempo e kcal sempre com `font-variant-numeric: tabular-nums`.

## Espaço, forma e movimento
- Escala de espaço: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40. Margem lateral de 20 px, largura máxima de 480 px.
- Respeitar as áreas seguras do iPhone (topo 47, base 34 no iPhone 14).
- Cantos: 8 px nos controles, 14 px nos cartões, 20 px no topo das folhas, pílulas totalmente arredondadas.
- Sem sombras: profundidade vem da troca de superfície.
- Movimento: toque 120 ms (botão afunda para 98%), troca 200 ms (folhas, abas, série concluída), alerta 320 ms (tela de descanso acende). Com "Reduzir movimento": 0 ms, só troca de cor.

## Componentes
- **Botão principal**: fundo `ac`, texto escuro, Condensed 700 em caixa alta, 56 px. Estados: pressionado (`acPress`, 98%), carregando (giro + verbo no gerúndio), desativado (`s3` + `dim`).
- **Botão secundário**: `s2` com texto normal. **Discreto**: só texto em `acTx`, com área de toque de 44 px. **Perigo**: `badTint` + `badTx`; a confirmação final usa `bad` cheio.
- **Alvos de toque**: no mínimo 44 × 44 px, chips e controles segmentados incluídos.
- **Série**: pendente (carga, reps e fileira de RIR 0, 1, 2, 3, 4+ com 56 px; tocar no RIR conclui), feita (check, valores, "RIR n") e recorde (`acTint`, troféu, "Recorde").
- **Carga com um dedo**: botões de menos e mais com 60 px e o número no meio; o passo é o incremento do equipamento.
- **Sinal de prontidão**: 3 barras crescentes, a palavra do nível e o motivo; no Hoje vira uma pílula.
- **Bloco do dia**: o único cartão com fundo `ac` na tela; leva o mapa muscular do treino.
- **Mapa muscular**: corpo de frente e de costas desenhado em formas simples, 2 px de folga entre músculos; sempre com legenda ou lista com os números.
- **Gráficos**: barras começam no zero; eixo com rótulos; linha de meta tracejada; marcas sem texto na cor da série; resumo em texto para leitor de tela.
- **Folha (sheet)**: alça, Cancelar à esquerda, título, ação à direita.
- **Avisos**: sem internet (`warnTint`), erro com ação (`badTint` + "Tentar de novo"), confirmação curta (fundo `tx`, texto `bg`), esqueleto de carregamento em `s2`.
- **Abas**: Hoje, Treinos, Sono, Histórico, Progresso; ícone de traço e rótulo de 12 px; somem no treino em andamento.
- **Adesivo para o story**: PNG transparente em 5 estilos (mapa e números, só o mapa, números, recorde, todos os recordes), texto branco ou preto, sombra leve para ler em qualquer foto.

## Ícones e imagens
Ícones de traço com 1,9 px, em SVG inline. Sem fotos, sem emoji. O botão do Google usa o visual oficial do Google.
