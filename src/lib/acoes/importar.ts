// Importação do backup: tudo de uma vez pela função importar_backup.
// Backups grandes vão em partes de até 200 sessões (cada parte cabe folgada no limite de 8 s do banco).
// Repetir é seguro: os ids vêm do id antigo, então nada duplica.

import { supabase } from "../dados/supabase";
import { sincronizar } from "../dados/sync";
import { mensagemDoErro, type ErroBanco } from "../dados/erros";
import type { PedidoImportacao } from "../dominio/conversor";

const PARTE = 200;

export type Contagem = Record<string, number>;

export class FalhaImportacao extends Error {
  constructor(
    message: string,
    public parcial: boolean,
  ) {
    super(message);
  }
}

export async function importar(pedido: PedidoImportacao, aoProgredir?: (feito: number, total: number) => void): Promise<Contagem> {
  const supa = supabase();
  const { sessoes, ...resto } = pedido;
  const partes = Math.max(1, Math.ceil(sessoes.length / PARTE));
  const total: Contagem = {};
  for (let i = 0; i < partes; i++) {
    const corpo = i === 0 ? { ...resto, sessoes: sessoes.slice(0, PARTE) } : { sessoes: sessoes.slice(i * PARTE, (i + 1) * PARTE) };
    const r = await supa.rpc("importar_backup", { p: corpo as never });
    if (r.error) {
      const msg = mensagemDoErro(r.error as ErroBanco);
      throw new FalhaImportacao(i === 0 ? msg : `${msg} As primeiras ${i * PARTE} sessões já entraram; importar de novo completa sem duplicar.`, i > 0);
    }
    for (const [k, v] of Object.entries((r.data ?? {}) as Contagem)) total[k] = (total[k] ?? 0) + (i > 0 && k !== "sessoes" ? 0 : v);
    aoProgredir?.(i + 1, partes);
  }
  await sincronizar();
  return total;
}
