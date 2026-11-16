// Gerado pela Supabase a partir do banco (projeto hiroraxpqkylghzkvcxp). Não editar à mão:
// depois de cada migração, gerar de novo.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      calibracoes: {
        Row: {
          aplicada_em: string
          atualizado_em: string
          criado_em: string
          id: string
          limiar_h: number
          queda_pct: number
          sessoes: number
          user_id: string
        }
        Insert: {
          aplicada_em: string
          atualizado_em?: string
          criado_em?: string
          id?: string
          limiar_h: number
          queda_pct: number
          sessoes: number
          user_id?: string
        }
        Update: {
          aplicada_em?: string
          atualizado_em?: string
          criado_em?: string
          id?: string
          limiar_h?: number
          queda_pct?: number
          sessoes?: number
          user_id?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          atualizado_em: string
          calibracao_dispensada_ate: string | null
          deload_dispensado_ate: string | null
          regras: Json
          som_descanso: boolean
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          calibracao_dispensada_ate?: string | null
          deload_dispensado_ate?: string | null
          regras?: Json
          som_descanso?: boolean
          user_id: string
        }
        Update: {
          atualizado_em?: string
          calibracao_dispensada_ate?: string | null
          deload_dispensado_ate?: string | null
          regras?: Json
          som_descanso?: boolean
          user_id?: string
        }
        Relationships: []
      }
      deloads: {
        Row: {
          atualizado_em: string
          criado_em: string
          fim: string
          id: string
          inicio: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          fim: string
          id?: string
          inicio: string
          user_id?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          fim?: string
          id?: string
          inicio?: string
          user_id?: string
        }
        Relationships: []
      }
      exercicios_proprios: {
        Row: {
          atualizado_em: string
          chave: string
          criado_em: string
          equip: string
          grupo: string
          id: string
          musc: string[]
          nome: string
          reps_padrao: string
          sec: string[]
          sem_carga: boolean
          tipo: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          chave: string
          criado_em?: string
          equip: string
          grupo: string
          id?: string
          musc?: string[]
          nome: string
          reps_padrao?: string
          sec?: string[]
          sem_carga?: boolean
          tipo: string
          user_id?: string
        }
        Update: {
          atualizado_em?: string
          chave?: string
          criado_em?: string
          equip?: string
          grupo?: string
          id?: string
          musc?: string[]
          nome?: string
          reps_padrao?: string
          sec?: string[]
          sem_carga?: boolean
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      medidas: {
        Row: {
          atualizado_em: string
          cintura_cm: number | null
          criado_em: string
          data: string
          gordura_pct: number | null
          id: string
          ombro_cm: number | null
          peso_kg: number | null
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          cintura_cm?: number | null
          criado_em?: string
          data: string
          gordura_pct?: number | null
          id?: string
          ombro_cm?: number | null
          peso_kg?: number | null
          user_id?: string
        }
        Update: {
          atualizado_em?: string
          cintura_cm?: number | null
          criado_em?: string
          data?: string
          gordura_pct?: number | null
          id?: string
          ombro_cm?: number | null
          peso_kg?: number | null
          user_id?: string
        }
        Relationships: []
      }
      noites: {
        Row: {
          atualizado_em: string
          criado_em: string
          data: string
          horas: number
          id: string
          qualidade: number | null
          score: number | null
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data: string
          horas: number
          id?: string
          qualidade?: number | null
          score?: number | null
          user_id?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data?: string
          horas?: number
          id?: string
          qualidade?: number | null
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      perfis: {
        Row: {
          altura_cm: number | null
          atualizado_em: string
          criado_em: string
          modelo: string | null
          nome: string
          onboarding_concluido: boolean
          user_id: string
        }
        Insert: {
          altura_cm?: number | null
          atualizado_em?: string
          criado_em?: string
          modelo?: string | null
          nome?: string
          onboarding_concluido?: boolean
          user_id: string
        }
        Update: {
          altura_cm?: number | null
          atualizado_em?: string
          criado_em?: string
          modelo?: string | null
          nome?: string
          onboarding_concluido?: boolean
          user_id?: string
        }
        Relationships: []
      }
      remocoes: {
        Row: {
          id: number
          registro_id: string
          removido_em: string
          tabela: string
          user_id: string
        }
        Insert: {
          id?: never
          registro_id: string
          removido_em?: string
          tabela: string
          user_id: string
        }
        Update: {
          id?: never
          registro_id?: string
          removido_em?: string
          tabela?: string
          user_id?: string
        }
        Relationships: []
      }
      semana: {
        Row: {
          atualizado_em: string
          dia: number
          treino_id: string | null
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          dia: number
          treino_id?: string | null
          user_id?: string
        }
        Update: {
          atualizado_em?: string
          dia?: number
          treino_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "semana_user_id_treino_id_fkey"
            columns: ["user_id", "treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      series: {
        Row: {
          id: string
          kg: number
          posicao: number
          reps: number
          rir: number | null
          sessao_exercicio_id: string
          user_id: string
        }
        Insert: {
          id?: string
          kg?: number
          posicao: number
          reps: number
          rir?: number | null
          sessao_exercicio_id: string
          user_id?: string
        }
        Update: {
          id?: string
          kg?: number
          posicao?: number
          reps?: number
          rir?: number | null
          sessao_exercicio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_user_id_sessao_exercicio_id_fkey"
            columns: ["user_id", "sessao_exercicio_id"]
            isOneToOne: false
            referencedRelation: "sessao_exercicios"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      sessao_exercicios: {
        Row: {
          alvo: string | null
          cat: string
          ex_chave: string
          id: string
          posicao: number
          sessao_id: string
          sugestao: Json | null
          sugestao_aceita: boolean | null
          user_id: string
        }
        Insert: {
          alvo?: string | null
          cat: string
          ex_chave: string
          id?: string
          posicao: number
          sessao_id: string
          sugestao?: Json | null
          sugestao_aceita?: boolean | null
          user_id?: string
        }
        Update: {
          alvo?: string | null
          cat?: string
          ex_chave?: string
          id?: string
          posicao?: number
          sessao_id?: string
          sugestao?: Json | null
          sugestao_aceita?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessao_exercicios_user_id_sessao_id_fkey"
            columns: ["user_id", "sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      sessao_rascunho: {
        Row: {
          atualizado_em: string
          dados: Json
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          dados: Json
          user_id?: string
        }
        Update: {
          atualizado_em?: string
          dados?: Json
          user_id?: string
        }
        Relationships: []
      }
      sessao_tempos: {
        Row: {
          estacao_pos: number
          id: string
          nome: string | null
          seg: number
          sessao_id: string
          user_id: string
          volta: number
        }
        Insert: {
          estacao_pos: number
          id?: string
          nome?: string | null
          seg: number
          sessao_id: string
          user_id?: string
          volta: number
        }
        Update: {
          estacao_pos?: number
          id?: string
          nome?: string | null
          seg?: number
          sessao_id?: string
          user_id?: string
          volta?: number
        }
        Relationships: [
          {
            foreignKeyName: "sessao_tempos_user_id_sessao_id_fkey"
            columns: ["user_id", "sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      sessoes: {
        Row: {
          atualizado_em: string
          criado_em: string
          data: string
          dor_articular: boolean
          dor_articular_ex: string[]
          dor_articular_onde: string | null
          dor_muscular: number | null
          duracao_min: number | null
          em_deload: boolean
          energia: number | null
          fim: string | null
          id: string
          inicio: string | null
          kcal: number | null
          nome: string
          obs: string | null
          prontidao: string | null
          prontidao_motivo: string | null
          rpe: number | null
          sugestao_motivo: string | null
          tempo_total_s: number | null
          tipo: string
          treino_id: string | null
          user_id: string
          voltas_feitas: number | null
          voltas_plan: number | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data: string
          dor_articular?: boolean
          dor_articular_ex?: string[]
          dor_articular_onde?: string | null
          dor_muscular?: number | null
          duracao_min?: number | null
          em_deload?: boolean
          energia?: number | null
          fim?: string | null
          id?: string
          inicio?: string | null
          kcal?: number | null
          nome: string
          obs?: string | null
          prontidao?: string | null
          prontidao_motivo?: string | null
          rpe?: number | null
          sugestao_motivo?: string | null
          tempo_total_s?: number | null
          tipo: string
          treino_id?: string | null
          user_id?: string
          voltas_feitas?: number | null
          voltas_plan?: number | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data?: string
          dor_articular?: boolean
          dor_articular_ex?: string[]
          dor_articular_onde?: string | null
          dor_muscular?: number | null
          duracao_min?: number | null
          em_deload?: boolean
          energia?: number | null
          fim?: string | null
          id?: string
          inicio?: string | null
          kcal?: number | null
          nome?: string
          obs?: string | null
          prontidao?: string | null
          prontidao_motivo?: string | null
          rpe?: number | null
          sugestao_motivo?: string | null
          tempo_total_s?: number | null
          tipo?: string
          treino_id?: string | null
          user_id?: string
          voltas_feitas?: number | null
          voltas_plan?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_user_id_treino_id_fkey"
            columns: ["user_id", "treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      treino_estacoes: {
        Row: {
          alvo: string | null
          id: string
          nome: string
          posicao: number
          substituto: string | null
          treino_id: string
          user_id: string
        }
        Insert: {
          alvo?: string | null
          id?: string
          nome: string
          posicao: number
          substituto?: string | null
          treino_id: string
          user_id?: string
        }
        Update: {
          alvo?: string | null
          id?: string
          nome?: string
          posicao?: number
          substituto?: string | null
          treino_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treino_estacoes_user_id_treino_id_fkey"
            columns: ["user_id", "treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      treino_exercicios: {
        Row: {
          cat: string
          descanso_s: number | null
          ex_chave: string
          id: string
          obs: string | null
          posicao: number
          reps: string
          series: number
          treino_id: string
          user_id: string
        }
        Insert: {
          cat: string
          descanso_s?: number | null
          ex_chave: string
          id?: string
          obs?: string | null
          posicao: number
          reps: string
          series: number
          treino_id: string
          user_id?: string
        }
        Update: {
          cat?: string
          descanso_s?: number | null
          ex_chave?: string
          id?: string
          obs?: string | null
          posicao?: number
          reps?: string
          series?: number
          treino_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treino_exercicios_user_id_treino_id_fkey"
            columns: ["user_id", "treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      treinos: {
        Row: {
          atualizado_em: string
          criado_em: string
          descanso_voltas_s: number | null
          finalizador_id: string | null
          id: string
          nome: string
          obs: string | null
          posicao: number
          tags: string[]
          tipo: string
          user_id: string
          voltas: number | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          descanso_voltas_s?: number | null
          finalizador_id?: string | null
          id?: string
          nome: string
          obs?: string | null
          posicao?: number
          tags?: string[]
          tipo: string
          user_id?: string
          voltas?: number | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          descanso_voltas_s?: number | null
          finalizador_id?: string | null
          id?: string
          nome?: string
          obs?: string | null
          posicao?: number
          tags?: string[]
          tipo?: string
          user_id?: string
          voltas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treinos_user_id_finalizador_id_fkey"
            columns: ["user_id", "finalizador_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apagar_minha_conta: { Args: never; Returns: undefined }
      importar_backup: { Args: { p: Json }; Returns: Json }
      salvar_sessao: { Args: { p: Json }; Returns: string }
      salvar_treino: { Args: { p: Json }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
