import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// A chave publicável foi feita para ficar no app: o banco só libera as linhas de quem está logado (RLS).
const URL_PADRAO = "https://hiroraxpqkylghzkvcxp.supabase.co";
const CHAVE_PADRAO = "sb_publishable_1Hlbkm8zWJu4tx6ul6cepQ_4TsdrPOh";

export type Supa = SupabaseClient<Database>;

let cliente: Supa | null = null;

export function supabase(): Supa {
  if (cliente) return cliente;
  cliente = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || URL_PADRAO,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || CHAVE_PADRAO,
    {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "healthcore-sessao",
      },
    },
  );
  return cliente;
}
