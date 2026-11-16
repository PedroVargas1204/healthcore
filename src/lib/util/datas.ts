// Datas como chaves 'AAAA-MM-DD' no fuso do celular, como no app antigo.

export type ChaveData = string;

export const DIAS_C = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"] as const;
export const DIAS_L = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;
export const DIAS_AB = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
export const DIAS_LETRA = ["S", "T", "Q", "Q", "S", "S", "D"] as const;
export const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"] as const;
export const MES_AB = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;

const dois = (n: number) => String(n).padStart(2, "0");

export const chave = (d: Date): ChaveData => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;

export const deChave = (k: ChaveData): Date => {
  const [a, m, d] = k.split("-").map(Number);
  return new Date(a, (m ?? 1) - 1, d ?? 1);
};

/** Dia da semana com segunda = 0 e domingo = 6. */
export const diaSemana = (d: Date) => (d.getDay() + 6) % 7;

export const somarDias = (k: ChaveData, n: number): ChaveData => {
  const d = deChave(k);
  d.setDate(d.getDate() + n);
  return chave(d);
};

export const inicioSemana = (k: ChaveData): ChaveData => somarDias(k, -diaSemana(deChave(k)));

export const hojeK = (): ChaveData => chave(new Date());

export const diasEntre = (a: ChaveData, b: ChaveData) => Math.round((deChave(b).getTime() - deChave(a).getTime()) / 864e5);

/** "Sex, 13 nov" */
export const dataCurta = (k: ChaveData) => {
  const d = deChave(k);
  return `${DIAS_AB[diaSemana(d)]}, ${d.getDate()} ${MES_AB[d.getMonth()]}`;
};

/** "13 de novembro" */
export const dataLonga = (k: ChaveData) => {
  const d = deChave(k);
  return `${d.getDate()} de ${MESES[d.getMonth()]}`;
};

/** "13/11" */
export const rotData = (k: ChaveData) => {
  const d = deChave(k);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

export const nomeDia = (k: ChaveData) => DIAS_L[diaSemana(deChave(k))];

/** Horário curto "18:42" de um instante ISO ou em milissegundos. */
export const hora = (t: string | number) => {
  const d = new Date(t);
  return `${dois(d.getHours())}:${dois(d.getMinutes())}`;
};
