# Gera um backup v2 de teste com 6 semanas de treinos, sono e medidas a partir do backup real.
import json, random, datetime, sys
random.seed(7)
b = json.load(open(sys.argv[1]))
E = b['E']; hoje = datetime.date.fromisoformat(sys.argv[3]) if len(sys.argv) > 3 else datetime.date.today()
semana = ['A','B','C',None,'D','E',None]
base_kg = {'puxada':55,'remada_apoiada':50,'pullover':25,'elev_lateral':10,'rosca_direta':25,'agachamento':90,'stiff':70,'leg_press':160,'panturrilha':80,'prancha':0,
  'desenvolvimento':20,'elev_lateral_polia':6,'crucifixo_inverso':8,'triceps_polia':25,'rosca_martelo':12,'supino_inclinado':22,'barra_fixa':0,'crossover':15,'remada_baixa':55,'bulgaro':14,'mesa_flexora':40,'extensora':45,'abdominal_infra':0}
T = []; sono = {}
for d in range(42, 0, -1):
    dia = hoje - datetime.timedelta(days=d)
    k = dia.isoformat()
    sono[k] = {'h': round(random.choice([6.2,6.8,7,7.2,7.5,7.8,5.6,7.3]),2), 'q': random.randint(2,5)}
    L = semana[dia.weekday()]
    if not L or random.random() < 0.12: continue
    tr = E['treinos'][L]; sem = (42 - d) // 7
    ex = []
    for it in tr['ex']:
        kg0 = base_kg.get(it['exId'], 20); kg = kg0 + (sem * (2 if kg0 >= 20 else 1) if kg0 else 0)
        series = []
        for s in range(it['series']):
            reps = 10 - (1 if s >= 2 else 0) + (1 if sem % 2 else 0)
            series.append({'kg': kg, 'reps': reps, 'rir': random.choice([0,1,1,2,2,3])})
        ex.append({'id': it['exId'], 'cat': it['cat'], 'alvo': it['reps'], 'sug': {'kg': kg, 'reps': it['reps'], 'series': it['series'], 'tipo': 'manter', 'motivo': 'Teste'}, 'sugAceita': True, 'series': series})
    nivel = random.choice(['verde','verde','amarelo','vermelho'])
    ini = datetime.datetime.combine(dia, datetime.time(18, 30)).timestamp() * 1000
    T.append({'id': 's' + k, 'tipo': 'forca', 'treinoId': L, 'nome': tr['nome'], 'data': k, 'inicio': ini, 'fim': ini + 55*60000, 'duracaoMin': 55, 'kcal': random.randint(380, 520),
      'energia': random.randint(2,5), 'dorMusc': random.randint(1,3), 'dorArt': {'sim': False, 'onde': '', 'ex': []}, 'obs': '', 'prontidao': {'nivel': nivel, 'motivo': 'Teste ' + nivel}, 'ex': ex})
T.sort(key=lambda t: t['data'], reverse=True)
# uma sessão antiga com dor sem exercício (vira observação)
T[-1]['dorArt'] = {'sim': True, 'onde': 'ombro', 'ex': []}
E['sono'] = sono
E['medidas'] = [
  {'id': 'm1', 'data': (hoje - datetime.timedelta(days=40)).isoformat(), 'peso': 76.1, 'cintura': 83, 'ombro': 114},
  {'id': 'm2', 'data': (hoje - datetime.timedelta(days=26)).isoformat(), 'peso': 75.6, 'cintura': 82.4, 'ombro': 114.8},
  {'id': 'm3', 'data': (hoje - datetime.timedelta(days=12)).isoformat(), 'peso': 75.3, 'cintura': 81.6, 'ombro': 115.6},
  {'id': 'm4', 'data': (hoje - datetime.timedelta(days=2)).isoformat(), 'peso': 75.2, 'cintura': 81, 'ombro': 116, 'bf': 15},
]
b['T'] = T; b['exportadoEm'] = datetime.datetime.now().isoformat()
json.dump(b, open(sys.argv[2], 'w'), ensure_ascii=False)
print(len(T), 'sessões,', len(sono), 'noites')
