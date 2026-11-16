// Gerado a partir de dados.js do app antigo (catálogo e modelos) e do plano aprovado na Fase 1.
// Para mudar um exercício, edite aqui; o banco só guarda os exercícios que você criar.

import type { Exercicio, Modelo } from "./tipos";

export const EX: Record<string, Exercicio> = {
  "elev_lateral": {
    "nome": "Elevação lateral",
    "grupo": "Ombro",
    "musc": [
      "Deltoide lateral"
    ],
    "sec": [
      "Deltoide anterior",
      "Trapézio superior"
    ],
    "equip": "Halteres",
    "tipo": "iso",
    "v": 1,
    "reps": "12-15",
    "var": "elevação lateral na polia ou sentado, com amplitude até onde não doer",
    "passos": [
      "Em pé, halteres ao lado do corpo e tronco levemente inclinado à frente.",
      "Com os cotovelos um pouco dobrados, leve os braços para os lados até a linha do ombro.",
      "Pense em empurrar os halteres para longe de você, não para cima.",
      "Desça controlando em 2 a 3 segundos."
    ],
    "erros": [
      [
        "Balançar o corpo para subir",
        "Reduza a carga: quem trabalha é o ombro, não o impulso."
      ],
      [
        "Subir acima do ombro e encolher",
        "Pare na linha do ombro para não puxar com o trapézio."
      ]
    ]
  },
  "elev_lateral_polia": {
    "nome": "Elevação lateral na polia",
    "grupo": "Ombro",
    "musc": [
      "Deltoide lateral"
    ],
    "sec": [
      "Trapézio superior"
    ],
    "equip": "Polia",
    "tipo": "iso",
    "v": 1,
    "reps": "12-15",
    "var": "elevação lateral com halteres, sentado",
    "passos": [
      "Polia baixa, cabo passando pela frente do corpo, segurando com a mão do lado oposto.",
      "Afaste o braço para o lado até a linha do ombro, cotovelo levemente dobrado.",
      "Segure meio segundo em cima e desça devagar."
    ],
    "erros": [
      [
        "Girar o tronco",
        "Segure no aparelho com a outra mão e mantenha o tronco parado."
      ],
      [
        "Puxar com a mão",
        "Conduza com o cotovelo; a mão só acompanha."
      ]
    ]
  },
  "desenvolvimento": {
    "nome": "Desenvolvimento com halteres",
    "grupo": "Ombro",
    "musc": [
      "Deltoide anterior",
      "Deltoide lateral"
    ],
    "sec": [
      "Tríceps"
    ],
    "equip": "Halteres",
    "tipo": "comp",
    "v": 0,
    "reps": "8-10",
    "var": "desenvolvimento na máquina com pegada neutra",
    "passos": [
      "Sentado com encosto, halteres na altura das orelhas, palmas para a frente.",
      "Empurre para cima até quase estender os cotovelos.",
      "Desça até a altura das orelhas sem perder o controle."
    ],
    "erros": [
      [
        "Arquear demais a lombar",
        "Costas no encosto e abdômen firme."
      ],
      [
        "Descer pouco",
        "Use uma carga que permita descer até a orelha."
      ]
    ]
  },
  "crucifixo_inverso": {
    "nome": "Crucifixo inverso",
    "grupo": "Ombro",
    "musc": [
      "Deltoide posterior"
    ],
    "sec": [
      "Romboides",
      "Trapézio médio"
    ],
    "equip": "Halteres",
    "tipo": "iso",
    "v": 0,
    "reps": "15",
    "var": "crucifixo inverso na máquina (peck deck invertido)",
    "passos": [
      "Tronco inclinado à frente, quase paralelo ao chão, halteres pendurados.",
      "Abra os braços para os lados com os cotovelos levemente dobrados.",
      "Pare quando os braços ficarem na linha do tronco e desça devagar."
    ],
    "erros": [
      [
        "Juntar demais as escápulas",
        "Foque em abrir os braços: o trabalho é do ombro de trás."
      ],
      [
        "Carga alta",
        "É um músculo pequeno: carga leve e muitas repetições."
      ]
    ]
  },
  "puxada": {
    "nome": "Puxada alta aberta",
    "grupo": "Costas",
    "musc": [
      "Dorsal"
    ],
    "sec": [
      "Bíceps",
      "Romboides"
    ],
    "equip": "Polia",
    "tipo": "comp",
    "v": 1,
    "reps": "8-10",
    "var": "puxada com pegada neutra (triângulo) ou supinada",
    "passos": [
      "Pegada um pouco mais aberta que os ombros, coxas presas no apoio.",
      "Puxe a barra até a parte de cima do peito levando os cotovelos para baixo e para trás.",
      "Peito para cima, sem jogar o tronco para trás.",
      "Suba controlando até esticar os braços."
    ],
    "erros": [
      [
        "Puxar com os braços",
        "Pense em levar os cotovelos até o bolso da calça."
      ],
      [
        "Balançar o tronco",
        "Uma leve inclinação é normal; balanço é sinal de carga alta."
      ]
    ]
  },
  "barra_fixa": {
    "nome": "Barra fixa aberta",
    "grupo": "Costas",
    "musc": [
      "Dorsal"
    ],
    "sec": [
      "Bíceps",
      "Romboides"
    ],
    "equip": "Peso corporal",
    "tipo": "comp",
    "v": 1,
    "reps": "falha",
    "semCarga": 1,
    "var": "puxada alta com pegada neutra",
    "passos": [
      "Pegada aberta, palmas para a frente, corpo pendurado com os braços estendidos.",
      "Puxe levando o peito em direção à barra e os cotovelos para baixo.",
      "Desça até estender os braços por completo."
    ],
    "erros": [
      [
        "Meia repetição",
        "Desça até o fim: amplitude conta mais que número."
      ],
      [
        "Chutar as pernas",
        "Corpo firme. Se ainda não sai, use o graviton ou um elástico."
      ]
    ]
  },
  "pullover": {
    "nome": "Pullover na polia",
    "grupo": "Costas",
    "musc": [
      "Dorsal"
    ],
    "sec": [
      "Tríceps",
      "Serrátil"
    ],
    "equip": "Polia",
    "tipo": "iso",
    "v": 1,
    "reps": "12",
    "var": "pullover com corda, amplitude menor",
    "passos": [
      "Polia alta com barra reta ou corda, tronco levemente inclinado à frente.",
      "Com os braços quase retos, traga a barra em arco até as coxas.",
      "Volte devagar até sentir o dorsal alongar."
    ],
    "erros": [
      [
        "Dobrar os cotovelos",
        "Braços quase retos, senão vira exercício de tríceps."
      ],
      [
        "Usar o tronco",
        "O tronco fica parado; só os braços se movem."
      ]
    ]
  },
  "remada_apoiada": {
    "nome": "Remada apoiada",
    "grupo": "Costas",
    "musc": [
      "Dorsal",
      "Romboides"
    ],
    "sec": [
      "Bíceps",
      "Deltoide posterior"
    ],
    "equip": "Máquina",
    "tipo": "comp",
    "v": 0,
    "reps": "8-10",
    "var": "remada unilateral com halter apoiado no banco",
    "passos": [
      "Peito apoiado no banco ou na máquina, braços estendidos.",
      "Puxe levando os cotovelos para trás, rente ao corpo.",
      "Segure um instante e volte esticando bem."
    ],
    "erros": [
      [
        "Tirar o peito do apoio",
        "O apoio isola as costas: mantenha o contato."
      ],
      [
        "Encurtar a volta",
        "Estique os braços por completo em cada repetição."
      ]
    ]
  },
  "remada_baixa": {
    "nome": "Remada baixa",
    "grupo": "Costas",
    "musc": [
      "Dorsal",
      "Romboides"
    ],
    "sec": [
      "Bíceps"
    ],
    "equip": "Polia",
    "tipo": "comp",
    "v": 0,
    "reps": "10",
    "var": "remada apoiada na máquina",
    "passos": [
      "Sentado, pés apoiados, joelhos levemente dobrados, coluna neutra.",
      "Puxe o triângulo até o abdômen levando os cotovelos para trás.",
      "Volte controlando, deixando as escápulas abrirem."
    ],
    "erros": [
      [
        "Balançar o tronco",
        "O tronco fica quase parado."
      ],
      [
        "Encolher os ombros",
        "Ombros longe das orelhas o tempo todo."
      ]
    ]
  },
  "supino_inclinado": {
    "nome": "Supino inclinado com halteres",
    "grupo": "Peito",
    "musc": [
      "Peitoral superior"
    ],
    "sec": [
      "Deltoide anterior",
      "Tríceps"
    ],
    "equip": "Halteres",
    "tipo": "comp",
    "v": 0,
    "reps": "8-10",
    "var": "supino inclinado na máquina ou com pegada neutra",
    "passos": [
      "Banco a uns 30°, escápulas juntas e pés firmes no chão.",
      "Desça os halteres ao lado do peito, cotovelos a uns 45° do corpo.",
      "Empurre para cima aproximando os halteres no topo."
    ],
    "erros": [
      [
        "Banco inclinado demais",
        "Acima de 45° o ombro assume o trabalho."
      ],
      [
        "Cotovelos muito abertos",
        "Mantenha uns 45° para proteger o ombro."
      ]
    ]
  },
  "crossover": {
    "nome": "Crossover",
    "grupo": "Peito",
    "musc": [
      "Peitoral"
    ],
    "sec": [
      "Deltoide anterior"
    ],
    "equip": "Polia",
    "tipo": "iso",
    "v": 0,
    "reps": "12",
    "var": "crucifixo na máquina (peck deck)",
    "passos": [
      "Polias na altura dos ombros, um passo à frente, tronco levemente inclinado.",
      "Traga as mãos em arco até se encontrarem na frente do peito.",
      "Volte devagar até sentir o peito alongar."
    ],
    "erros": [
      [
        "Virar um supino",
        "Cotovelos fixos e levemente dobrados: o movimento é de abraço."
      ],
      [
        "Voltar rápido",
        "Controle a volta, é onde o peito mais trabalha."
      ]
    ]
  },
  "agachamento": {
    "nome": "Agachamento livre",
    "grupo": "Pernas",
    "musc": [
      "Quadríceps",
      "Glúteos"
    ],
    "sec": [
      "Adutores",
      "Lombar"
    ],
    "equip": "Barra",
    "tipo": "comp",
    "v": 0,
    "reps": "6-8",
    "var": "agachamento no hack ou leg press",
    "passos": [
      "Barra apoiada no trapézio, pés na largura dos ombros, pontas levemente para fora.",
      "Desça levando o quadril para trás e os joelhos na direção dos pés.",
      "Desça até a coxa ficar ao menos paralela ao chão, com a coluna neutra.",
      "Suba empurrando o chão com o pé inteiro."
    ],
    "erros": [
      [
        "Joelhos caindo para dentro",
        "Empurre os joelhos para fora, na linha dos pés."
      ],
      [
        "Calcanhar saindo do chão",
        "Peso no meio do pé; trabalhe a mobilidade do tornozelo."
      ]
    ]
  },
  "stiff": {
    "nome": "Stiff",
    "grupo": "Pernas",
    "musc": [
      "Posterior de coxa",
      "Glúteos"
    ],
    "sec": [
      "Lombar"
    ],
    "equip": "Barra",
    "tipo": "comp",
    "v": 0,
    "reps": "8-10",
    "var": "mesa flexora ou stiff com halteres e amplitude menor",
    "passos": [
      "Em pé, barra na frente das coxas, joelhos levemente dobrados.",
      "Leve o quadril para trás descendo a barra rente às pernas.",
      "Desça até sentir o posterior alongar e suba contraindo o glúteo."
    ],
    "erros": [
      [
        "Arredondar a coluna",
        "Coluna neutra o tempo todo: desça só até onde consegue mantê-la."
      ],
      [
        "Afastar a barra do corpo",
        "A barra desliza rente às pernas."
      ]
    ]
  },
  "leg_press": {
    "nome": "Leg press",
    "grupo": "Pernas",
    "musc": [
      "Quadríceps",
      "Glúteos"
    ],
    "sec": [],
    "equip": "Máquina",
    "tipo": "comp",
    "v": 0,
    "reps": "10-12",
    "var": "leg press com amplitude menor ou cadeira extensora",
    "passos": [
      "Pés na largura do quadril, no meio da plataforma, costas coladas no encosto.",
      "Desça até os joelhos ficarem perto de 90°.",
      "Empurre sem travar os joelhos no topo."
    ],
    "erros": [
      [
        "Tirar o quadril do banco",
        "Desça só até onde o quadril continua apoiado."
      ],
      [
        "Travar os joelhos",
        "Pare um pouco antes da extensão total."
      ]
    ]
  },
  "bulgaro": {
    "nome": "Agachamento búlgaro",
    "grupo": "Pernas",
    "musc": [
      "Quadríceps",
      "Glúteos"
    ],
    "sec": [
      "Adutores"
    ],
    "equip": "Halteres",
    "tipo": "comp",
    "v": 0,
    "reps": "10",
    "var": "avanço estático ou leg press unilateral",
    "passos": [
      "Pé de trás apoiado no banco, pé da frente um passo grande à frente.",
      "Desça o joelho de trás em direção ao chão, tronco levemente inclinado.",
      "Suba empurrando com o pé da frente."
    ],
    "erros": [
      [
        "Pé da frente muito perto",
        "Afaste mais, para o joelho não passar muito da ponta do pé."
      ],
      [
        "Perder o equilíbrio",
        "Comece sem carga ou segurando em um apoio."
      ]
    ]
  },
  "avanco": {
    "nome": "Avanço com halteres",
    "grupo": "Pernas",
    "musc": [
      "Quadríceps",
      "Glúteos"
    ],
    "sec": [
      "Adutores"
    ],
    "equip": "Halteres",
    "tipo": "comp",
    "v": 0,
    "reps": "10",
    "var": "agachamento búlgaro ou leg press",
    "passos": [
      "Halteres ao lado do corpo, dê um passo longo à frente.",
      "Desça até o joelho de trás quase tocar o chão.",
      "Empurre com o pé da frente e troque de perna."
    ],
    "erros": [
      [
        "Passo curto demais",
        "Passo longo deixa o joelho da frente confortável."
      ],
      [
        "Tronco desabando",
        "Peito aberto e abdômen firme."
      ]
    ]
  },
  "mesa_flexora": {
    "nome": "Mesa flexora",
    "grupo": "Pernas",
    "musc": [
      "Posterior de coxa"
    ],
    "sec": [
      "Panturrilha"
    ],
    "equip": "Máquina",
    "tipo": "iso",
    "v": 0,
    "reps": "12",
    "var": "cadeira flexora sentada",
    "passos": [
      "Deitado, rolo logo acima do calcanhar, quadril colado no banco.",
      "Dobre os joelhos trazendo o rolo em direção ao glúteo.",
      "Desça devagar até quase esticar."
    ],
    "erros": [
      [
        "Levantar o quadril",
        "Quadril colado no banco; diminua a carga se precisar."
      ],
      [
        "Soltar o peso na descida",
        "Desça em 2 a 3 segundos."
      ]
    ]
  },
  "extensora": {
    "nome": "Cadeira extensora",
    "grupo": "Pernas",
    "musc": [
      "Quadríceps"
    ],
    "sec": [],
    "equip": "Máquina",
    "tipo": "iso",
    "v": 0,
    "reps": "12",
    "var": "extensora com amplitude parcial (sem dor)",
    "passos": [
      "Joelho alinhado com o eixo da máquina, rolo acima do tornozelo.",
      "Estenda as pernas até quase travar e segure meio segundo.",
      "Desça controlando."
    ],
    "erros": [
      [
        "Dar tranco",
        "Movimento controlado, sem impulso."
      ],
      [
        "Amplitude curta",
        "Use toda a amplitude que o joelho permite sem dor."
      ]
    ]
  },
  "panturrilha": {
    "nome": "Panturrilha em pé",
    "grupo": "Pernas",
    "musc": [
      "Panturrilha"
    ],
    "sec": [],
    "equip": "Máquina",
    "tipo": "iso",
    "v": 0,
    "reps": "12",
    "var": "panturrilha sentado",
    "passos": [
      "Ponta dos pés na borda do apoio, joelhos estendidos.",
      "Suba o máximo que conseguir e segure 1 segundo.",
      "Desça até alongar bem a panturrilha."
    ],
    "erros": [
      [
        "Quicar embaixo",
        "Pause embaixo para não usar o efeito mola."
      ],
      [
        "Amplitude curta",
        "Alongar e subir completo dá mais resultado."
      ]
    ]
  },
  "prancha": {
    "nome": "Prancha",
    "grupo": "Core",
    "musc": [
      "Abdômen"
    ],
    "sec": [
      "Lombar",
      "Ombros"
    ],
    "equip": "Peso corporal",
    "tipo": "iso",
    "v": 0,
    "reps": "40 s",
    "semCarga": 1,
    "var": "prancha com joelhos apoiados",
    "passos": [
      "Antebraços no chão, cotovelos abaixo dos ombros.",
      "Corpo em linha reta da cabeça aos calcanhares.",
      "Contraia abdômen e glúteos e respire normalmente."
    ],
    "erros": [
      [
        "Quadril caído",
        "Contraia o glúteo para manter a linha."
      ],
      [
        "Quadril alto demais",
        "Desça até o corpo ficar reto."
      ]
    ]
  },
  "abdominal_infra": {
    "nome": "Abdominal infra",
    "grupo": "Core",
    "musc": [
      "Abdômen"
    ],
    "sec": [
      "Flexores do quadril"
    ],
    "equip": "Peso corporal",
    "tipo": "iso",
    "v": 0,
    "reps": "12",
    "semCarga": 1,
    "var": "elevação de joelhos deitado",
    "passos": [
      "Deitado, mãos ao lado do corpo ou segurando um apoio atrás da cabeça.",
      "Suba as pernas e tire o quadril do chão enrolando a pelve.",
      "Desça devagar sem encostar os pés no chão."
    ],
    "erros": [
      [
        "Usar só as pernas",
        "O movimento é do quadril enrolando, não só das pernas subindo."
      ],
      [
        "Descer rápido",
        "Controle a descida."
      ]
    ]
  },
  "farmer": {
    "nome": "Farmer's carry",
    "grupo": "Core",
    "musc": [
      "Antebraço",
      "Trapézio"
    ],
    "sec": [
      "Abdômen",
      "Pernas"
    ],
    "equip": "Halteres",
    "tipo": "comp",
    "v": 0,
    "reps": "40 m",
    "var": "carregar um halter só (suitcase carry), mais leve",
    "passos": [
      "Um halter pesado em cada mão, braços estendidos ao lado do corpo.",
      "Caminhe com passos curtos e rápidos, ombros para baixo.",
      "Mantenha o tronco reto, sem inclinar para os lados."
    ],
    "erros": [
      [
        "Encolher os ombros",
        "Ombros longe das orelhas o caminho todo."
      ],
      [
        "Passos longos",
        "Passos curtos dão mais estabilidade."
      ]
    ]
  },
  "rosca_direta": {
    "nome": "Rosca direta",
    "grupo": "Braços",
    "musc": [
      "Bíceps"
    ],
    "sec": [
      "Antebraço"
    ],
    "equip": "Barra",
    "tipo": "iso",
    "v": 0,
    "reps": "10",
    "var": "rosca com halteres e pegada neutra",
    "passos": [
      "Em pé, pegada na largura dos ombros, cotovelos ao lado do corpo.",
      "Suba a barra dobrando os cotovelos, sem mexer os ombros.",
      "Desça até esticar os braços."
    ],
    "erros": [
      [
        "Balançar o tronco",
        "Encoste numa parede se precisar."
      ],
      [
        "Cotovelos indo para a frente",
        "Cotovelos fixos ao lado do corpo."
      ]
    ]
  },
  "rosca_martelo": {
    "nome": "Rosca martelo",
    "grupo": "Braços",
    "musc": [
      "Braquial",
      "Bíceps"
    ],
    "sec": [
      "Antebraço"
    ],
    "equip": "Halteres",
    "tipo": "iso",
    "v": 0,
    "reps": "12",
    "var": "rosca na polia com corda",
    "passos": [
      "Halteres com as palmas viradas para o corpo.",
      "Suba dobrando os cotovelos, mantendo a pegada neutra.",
      "Desça controlando."
    ],
    "erros": [
      [
        "Girar o punho",
        "A pegada fica neutra o tempo todo."
      ],
      [
        "Usar impulso",
        "Carga que permita subir sem balanço."
      ]
    ]
  },
  "triceps_polia": {
    "nome": "Tríceps na polia",
    "grupo": "Braços",
    "musc": [
      "Tríceps"
    ],
    "sec": [],
    "equip": "Polia",
    "tipo": "iso",
    "v": 0,
    "reps": "12",
    "var": "tríceps na polia com corda e amplitude menor",
    "passos": [
      "Polia alta com corda ou barra, cotovelos colados ao corpo.",
      "Estenda os cotovelos até os braços ficarem retos.",
      "Volte até uns 90° sem mexer os ombros."
    ],
    "erros": [
      [
        "Cotovelos abrindo",
        "Cotovelos fixos ao lado do corpo."
      ],
      [
        "Jogar o corpo sobre a carga",
        "Tronco estável; diminua o peso."
      ]
    ]
  }
};

export const GRUPOS = ["Todos","Ombro","Costas","Peito","Pernas","Braços","Core"] as const;
export const EQUIPS = ["Halteres","Barra","Máquina","Polia","Peso corporal"] as const;
export const LATERAIS: readonly string[] = ["elev_lateral","elev_lateral_polia"];
export const PRINCIPAIS: readonly string[] = ["puxada","supino_inclinado","elev_lateral","agachamento"];

export const SUBS = {
  "ski": "Sem SkiErg: puxada no cabo em pé com braços estendidos, ou remo ergômetro",
  "push": "Sem trenó: empurre a esteira desligada, corpo inclinado e passos curtos",
  "pull": "Sem trenó: puxada de corda ou remada pesada no cabo",
  "remo": "Sem remo: remada baixa leve em ritmo alto",
  "farmer": "Sem kettlebell: halteres pesados ou anilhas",
  "lunge": "Sem saco: anilha no peito ou halteres",
  "wall": "Sem alvo na parede: thruster com halteres (agachamento + desenvolvimento)",
  "corrida": "Esteira ocupada: bike ou remo no mesmo tempo"
};

export const MODELOS: Modelo[] = [
  {
    "id": "dimorfismo5",
    "nome": "Dimorfismo 5x",
    "original": true,
    "frase": "Volume alto para ombro lateral e dorsal em 5 treinos de musculação.",
    "intensidade": "Moderada a alta",
    "duracao": "50 a 60 min por treino",
    "treinos": [
      {
        "id": "A",
        "nome": "Costas (largura) + ombro",
        "tipo": "forca",
        "tags": [],
        "ex": [
          {
            "exId": "puxada",
            "series": 4,
            "reps": "8-10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "remada_apoiada",
            "series": 3,
            "reps": "8-10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "pullover",
            "series": 3,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "elev_lateral",
            "series": 4,
            "reps": "12-15",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "rosca_direta",
            "series": 3,
            "reps": "10",
            "desc": null,
            "obs": "",
            "cat": "iso"
          }
        ]
      },
      {
        "id": "B",
        "nome": "Inferior (força)",
        "tipo": "forca",
        "tags": [
          "pernas"
        ],
        "ex": [
          {
            "exId": "agachamento",
            "series": 4,
            "reps": "6-8",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "stiff",
            "series": 3,
            "reps": "8-10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "leg_press",
            "series": 3,
            "reps": "10-12",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "panturrilha",
            "series": 4,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "prancha",
            "series": 3,
            "reps": "40 s",
            "desc": null,
            "obs": "",
            "cat": "iso"
          }
        ]
      },
      {
        "id": "C",
        "nome": "Ombros + braços",
        "tipo": "forca",
        "tags": [],
        "ex": [
          {
            "exId": "desenvolvimento",
            "series": 3,
            "reps": "8-10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "elev_lateral_polia",
            "series": 4,
            "reps": "12-15",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "crucifixo_inverso",
            "series": 3,
            "reps": "15",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "triceps_polia",
            "series": 3,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "rosca_martelo",
            "series": 3,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          }
        ]
      },
      {
        "id": "D",
        "nome": "Peito + costas",
        "tipo": "forca",
        "tags": [],
        "ex": [
          {
            "exId": "supino_inclinado",
            "series": 4,
            "reps": "8-10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "barra_fixa",
            "series": 3,
            "reps": "falha",
            "desc": null,
            "obs": "Até a falha",
            "cat": "comp"
          },
          {
            "exId": "crossover",
            "series": 3,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "remada_baixa",
            "series": 3,
            "reps": "10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "elev_lateral",
            "series": 3,
            "reps": "15",
            "desc": null,
            "obs": "Drop set na última série",
            "cat": "iso"
          }
        ]
      },
      {
        "id": "E",
        "nome": "Inferior (volume)",
        "tipo": "forca",
        "tags": [
          "pernas"
        ],
        "ex": [
          {
            "exId": "bulgaro",
            "series": 3,
            "reps": "10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "mesa_flexora",
            "series": 3,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "extensora",
            "series": 3,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "abdominal_infra",
            "series": 3,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          }
        ]
      }
    ],
    "semana": [
      "A",
      "B",
      "C",
      null,
      "D",
      "E",
      null
    ]
  },
  {
    "id": "hibrido",
    "nome": "Híbrido Dimorfismo + Condicionamento",
    "frase": "4 treinos de musculação com 15 séries semanais de elevação lateral, mais zona 2 e um Hyrox curto que não encosta nos dias de pernas, ombro ou costas.",
    "intensidade": "Alta",
    "duracao": "50 a 65 min (musculação), 30 a 45 min (condicionamento)",
    "treinos": [
      {
        "id": "H1",
        "nome": "Superior A · costas e ombro",
        "tipo": "forca",
        "tags": [],
        "ex": [
          {
            "exId": "puxada",
            "series": 4,
            "reps": "8-10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "remada_apoiada",
            "series": 3,
            "reps": "8-10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "elev_lateral",
            "series": 5,
            "reps": "12-15",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "supino_inclinado",
            "series": 3,
            "reps": "8-10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "pullover",
            "series": 3,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          }
        ]
      },
      {
        "id": "H2",
        "nome": "Inferior · força",
        "tipo": "forca",
        "tags": [
          "pernas"
        ],
        "finalizador": "F1",
        "ex": [
          {
            "exId": "agachamento",
            "series": 4,
            "reps": "6-8",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "stiff",
            "series": 3,
            "reps": "8-10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "leg_press",
            "series": 3,
            "reps": "10-12",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "panturrilha",
            "series": 3,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          }
        ]
      },
      {
        "id": "H3",
        "nome": "Superior B · ombro e peito",
        "tipo": "forca",
        "tags": [],
        "ex": [
          {
            "exId": "desenvolvimento",
            "series": 3,
            "reps": "8-10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "elev_lateral_polia",
            "series": 5,
            "reps": "12-15",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "barra_fixa",
            "series": 3,
            "reps": "falha",
            "desc": null,
            "obs": "Até a falha",
            "cat": "comp"
          },
          {
            "exId": "crossover",
            "series": 3,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "triceps_polia",
            "series": 2,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          }
        ]
      },
      {
        "id": "H4",
        "nome": "Superior C · costas e ombro",
        "tipo": "forca",
        "tags": [],
        "ex": [
          {
            "exId": "remada_baixa",
            "series": 3,
            "reps": "10",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "puxada",
            "series": 3,
            "reps": "10-12",
            "desc": null,
            "obs": "",
            "cat": "comp"
          },
          {
            "exId": "elev_lateral",
            "series": 5,
            "reps": "15",
            "desc": null,
            "obs": "Drop set na última série",
            "cat": "iso"
          },
          {
            "exId": "crucifixo_inverso",
            "series": 3,
            "reps": "15",
            "desc": null,
            "obs": "",
            "cat": "iso"
          },
          {
            "exId": "rosca_martelo",
            "series": 3,
            "reps": "12",
            "desc": null,
            "obs": "",
            "cat": "iso"
          }
        ]
      },
      {
        "id": "C1",
        "nome": "Zona 2 + core",
        "tipo": "cond",
        "tags": [],
        "voltas": 1,
        "descanso": 0,
        "obs": "Ritmo em que dá para conversar. Não atrapalha a recuperação.",
        "itens": [
          {
            "nome": "Esteira inclinada (zona 2)",
            "alvo": "30 min",
            "sub": "Bike ou elíptico no mesmo tempo"
          },
          {
            "nome": "Prancha",
            "alvo": "3 × 40 s",
            "sub": ""
          },
          {
            "nome": "Farmer's carry leve",
            "alvo": "4 × 40 m",
            "sub": "Sem kettlebell: halteres pesados ou anilhas"
          }
        ]
      },
      {
        "id": "C2",
        "nome": "Hyrox curto",
        "tipo": "cond",
        "tags": [
          "hyrox"
        ],
        "voltas": 3,
        "descanso": 90,
        "obs": "Forte, mas sem chegar ao limite.",
        "itens": [
          {
            "nome": "Corrida na esteira",
            "alvo": "500 m",
            "sub": "Esteira ocupada: bike ou remo no mesmo tempo"
          },
          {
            "nome": "SkiErg",
            "alvo": "250 m",
            "sub": "Sem SkiErg: puxada no cabo em pé com braços estendidos, ou remo ergômetro"
          },
          {
            "nome": "Farmer's carry",
            "alvo": "50 m",
            "sub": "Sem kettlebell: halteres pesados ou anilhas"
          },
          {
            "nome": "Wall ball",
            "alvo": "15 reps",
            "sub": "Sem alvo na parede: thruster com halteres (agachamento + desenvolvimento)"
          }
        ]
      },
      {
        "id": "F1",
        "nome": "Finalizador · esteira 10 × 30 s",
        "tipo": "cond",
        "tags": [],
        "finalizadorDe": true,
        "voltas": 10,
        "descanso": 0,
        "obs": "10 min. Tiro forte e caminhada para recuperar.",
        "itens": [
          {
            "nome": "Tiro na esteira",
            "alvo": "30 s",
            "sub": "Esteira ocupada: bike ou remo no mesmo tempo"
          },
          {
            "nome": "Caminhada",
            "alvo": "30 s",
            "sub": ""
          }
        ]
      },
      {
        "id": "F2",
        "nome": "Finalizador · remo + burpee",
        "tipo": "cond",
        "tags": [],
        "finalizadorDe": true,
        "voltas": 4,
        "descanso": 30,
        "obs": "Cerca de 12 min.",
        "itens": [
          {
            "nome": "Remo ergômetro",
            "alvo": "200 m",
            "sub": "Sem remo: remada baixa leve em ritmo alto"
          },
          {
            "nome": "Burpee broad jump",
            "alvo": "8 reps",
            "sub": ""
          }
        ]
      },
      {
        "id": "F3",
        "nome": "Finalizador · farmer + wall ball",
        "tipo": "cond",
        "tags": [],
        "finalizadorDe": true,
        "voltas": 3,
        "descanso": 45,
        "obs": "Cerca de 10 min.",
        "itens": [
          {
            "nome": "Farmer's carry",
            "alvo": "40 m",
            "sub": "Sem kettlebell: halteres pesados ou anilhas"
          },
          {
            "nome": "Wall ball",
            "alvo": "12 reps",
            "sub": "Sem alvo na parede: thruster com halteres (agachamento + desenvolvimento)"
          }
        ]
      }
    ],
    "semana": [
      "H1",
      "H2",
      "H3",
      "H4",
      null,
      "C2",
      "C1"
    ]
  },
  {
    "id": "hyrox",
    "nome": "Hyrox na academia",
    "frase": "Corrida na esteira intercalada com as estações da prova, adaptadas para academia comum, com substitutos para o que faltar.",
    "intensidade": "Alta",
    "duracao": "35 a 60 min",
    "treinos": [
      {
        "id": "Y1",
        "nome": "Hyrox simulado · meia prova",
        "tipo": "cond",
        "tags": [
          "hyrox"
        ],
        "voltas": 1,
        "descanso": 0,
        "obs": "Metade das distâncias da prova. Anote o tempo de cada trecho.",
        "itens": [
          {
            "nome": "Corrida na esteira",
            "alvo": "500 m",
            "sub": "Esteira ocupada: bike ou remo no mesmo tempo"
          },
          {
            "nome": "SkiErg",
            "alvo": "500 m",
            "sub": "Sem SkiErg: puxada no cabo em pé com braços estendidos, ou remo ergômetro"
          },
          {
            "nome": "Corrida na esteira",
            "alvo": "500 m",
            "sub": "Esteira ocupada: bike ou remo no mesmo tempo"
          },
          {
            "nome": "Empurrar trenó",
            "alvo": "25 m",
            "sub": "Sem trenó: empurre a esteira desligada, corpo inclinado e passos curtos"
          },
          {
            "nome": "Corrida na esteira",
            "alvo": "500 m",
            "sub": "Esteira ocupada: bike ou remo no mesmo tempo"
          },
          {
            "nome": "Puxar trenó",
            "alvo": "25 m",
            "sub": "Sem trenó: puxada de corda ou remada pesada no cabo"
          },
          {
            "nome": "Corrida na esteira",
            "alvo": "500 m",
            "sub": "Esteira ocupada: bike ou remo no mesmo tempo"
          },
          {
            "nome": "Burpee broad jump",
            "alvo": "40 m",
            "sub": ""
          },
          {
            "nome": "Corrida na esteira",
            "alvo": "500 m",
            "sub": "Esteira ocupada: bike ou remo no mesmo tempo"
          },
          {
            "nome": "Remo ergômetro",
            "alvo": "500 m",
            "sub": "Sem remo: remada baixa leve em ritmo alto"
          },
          {
            "nome": "Corrida na esteira",
            "alvo": "500 m",
            "sub": "Esteira ocupada: bike ou remo no mesmo tempo"
          },
          {
            "nome": "Farmer's carry",
            "alvo": "100 m",
            "sub": "Sem kettlebell: halteres pesados ou anilhas"
          },
          {
            "nome": "Corrida na esteira",
            "alvo": "500 m",
            "sub": "Esteira ocupada: bike ou remo no mesmo tempo"
          },
          {
            "nome": "Avanço com saco",
            "alvo": "50 m",
            "sub": "Sem saco: anilha no peito ou halteres"
          },
          {
            "nome": "Corrida na esteira",
            "alvo": "500 m",
            "sub": "Esteira ocupada: bike ou remo no mesmo tempo"
          },
          {
            "nome": "Wall ball",
            "alvo": "50 reps",
            "sub": "Sem alvo na parede: thruster com halteres (agachamento + desenvolvimento)"
          }
        ]
      },
      {
        "id": "Y2",
        "nome": "Intervalado de estações",
        "tipo": "cond",
        "tags": [
          "hyrox"
        ],
        "voltas": 4,
        "descanso": 90,
        "obs": "Mesmo ritmo em todas as voltas.",
        "itens": [
          {
            "nome": "Corrida na esteira",
            "alvo": "400 m",
            "sub": "Esteira ocupada: bike ou remo no mesmo tempo"
          },
          {
            "nome": "Remo ergômetro",
            "alvo": "250 m",
            "sub": "Sem remo: remada baixa leve em ritmo alto"
          },
          {
            "nome": "Farmer's carry",
            "alvo": "50 m",
            "sub": "Sem kettlebell: halteres pesados ou anilhas"
          },
          {
            "nome": "Wall ball",
            "alvo": "15 reps",
            "sub": "Sem alvo na parede: thruster com halteres (agachamento + desenvolvimento)"
          }
        ]
      },
      {
        "id": "Y3",
        "nome": "Força-resistência Hyrox",
        "tipo": "cond",
        "tags": [
          "hyrox"
        ],
        "voltas": 3,
        "descanso": 120,
        "obs": "Estações pesadas, ritmo controlado.",
        "itens": [
          {
            "nome": "Empurrar trenó",
            "alvo": "20 m",
            "sub": "Sem trenó: empurre a esteira desligada, corpo inclinado e passos curtos"
          },
          {
            "nome": "Puxar trenó",
            "alvo": "20 m",
            "sub": "Sem trenó: puxada de corda ou remada pesada no cabo"
          },
          {
            "nome": "Avanço com saco",
            "alvo": "20 passos",
            "sub": "Sem saco: anilha no peito ou halteres"
          },
          {
            "nome": "Burpee broad jump",
            "alvo": "10 reps",
            "sub": ""
          }
        ]
      }
    ],
    "semana": [
      "Y2",
      null,
      "Y3",
      null,
      "Y1",
      null,
      null
    ]
  }
];

/** Plano aprovado em 14/11: Dimorfismo 5x · evidência (78 → 96 séries por semana). */
export const PLANO_EVIDENCIA: Modelo = {
  "id": "evidencia",
  "nome": "Dimorfismo 5x · evidência",
  "frase": "O Dimorfismo 5x com mais volume onde dá largura: 15 a 20 séries por semana para deltoide lateral e dorsal, e 10 a 20 para o resto. Começa com 2 semanas de rampa.",
  "intensidade": "Moderada a alta",
  "duracao": "55 a 65 min por treino",
  "treinos": [
    {
      "id": "A",
      "nome": "Costas (largura) + ombro",
      "tipo": "forca",
      "tags": [],
      "ex": [
        {
          "exId": "puxada",
          "series": 4,
          "reps": "8-10",
          "desc": null,
          "obs": "",
          "cat": "comp"
        },
        {
          "exId": "remada_apoiada",
          "series": 3,
          "reps": "8-10",
          "desc": null,
          "obs": "",
          "cat": "comp"
        },
        {
          "exId": "pullover",
          "series": 4,
          "reps": "12",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "elev_lateral",
          "series": 4,
          "reps": "12-15",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "rosca_direta",
          "series": 2,
          "reps": "10",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "crucifixo_inverso",
          "series": 3,
          "reps": "15",
          "desc": null,
          "obs": "",
          "cat": "iso"
        }
      ]
    },
    {
      "id": "B",
      "nome": "Inferior (força)",
      "tipo": "forca",
      "tags": [
        "pernas"
      ],
      "ex": [
        {
          "exId": "agachamento",
          "series": 4,
          "reps": "6-8",
          "desc": null,
          "obs": "",
          "cat": "comp"
        },
        {
          "exId": "stiff",
          "series": 4,
          "reps": "8-10",
          "desc": null,
          "obs": "",
          "cat": "comp"
        },
        {
          "exId": "leg_press",
          "series": 3,
          "reps": "10-12",
          "desc": null,
          "obs": "",
          "cat": "comp"
        },
        {
          "exId": "panturrilha",
          "series": 4,
          "reps": "12",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "prancha",
          "series": 3,
          "reps": "40 s",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "elev_lateral_polia",
          "series": 3,
          "reps": "12-15",
          "desc": null,
          "obs": "",
          "cat": "iso"
        }
      ]
    },
    {
      "id": "C",
      "nome": "Ombros + braços",
      "tipo": "forca",
      "tags": [],
      "ex": [
        {
          "exId": "desenvolvimento",
          "series": 3,
          "reps": "8-10",
          "desc": null,
          "obs": "",
          "cat": "comp"
        },
        {
          "exId": "elev_lateral_polia",
          "series": 4,
          "reps": "12-15",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "crucifixo_inverso",
          "series": 4,
          "reps": "15",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "triceps_polia",
          "series": 4,
          "reps": "12",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "rosca_martelo",
          "series": 3,
          "reps": "12",
          "desc": null,
          "obs": "",
          "cat": "iso"
        }
      ]
    },
    {
      "id": "D",
      "nome": "Peito + costas",
      "tipo": "forca",
      "tags": [],
      "ex": [
        {
          "exId": "supino_inclinado",
          "series": 4,
          "reps": "8-10",
          "desc": null,
          "obs": "",
          "cat": "comp"
        },
        {
          "exId": "barra_fixa",
          "series": 4,
          "reps": "falha",
          "desc": null,
          "obs": "Até a falha",
          "cat": "comp"
        },
        {
          "exId": "crossover",
          "series": 4,
          "reps": "12",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "remada_baixa",
          "series": 3,
          "reps": "10",
          "desc": null,
          "obs": "",
          "cat": "comp"
        },
        {
          "exId": "elev_lateral",
          "series": 3,
          "reps": "15",
          "desc": null,
          "obs": "Drop set na última série",
          "cat": "iso"
        }
      ]
    },
    {
      "id": "E",
      "nome": "Inferior (volume)",
      "tipo": "forca",
      "tags": [
        "pernas"
      ],
      "ex": [
        {
          "exId": "bulgaro",
          "series": 3,
          "reps": "10",
          "desc": null,
          "obs": "",
          "cat": "comp"
        },
        {
          "exId": "mesa_flexora",
          "series": 4,
          "reps": "12",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "extensora",
          "series": 3,
          "reps": "12",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "abdominal_infra",
          "series": 3,
          "reps": "12",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "elev_lateral",
          "series": 3,
          "reps": "12-15",
          "desc": null,
          "obs": "",
          "cat": "iso"
        },
        {
          "exId": "panturrilha",
          "series": 3,
          "reps": "12",
          "desc": null,
          "obs": "",
          "cat": "iso"
        }
      ]
    }
  ],
  "semana": [
    "A",
    "B",
    "C",
    null,
    "D",
    "E",
    null
  ]
};
