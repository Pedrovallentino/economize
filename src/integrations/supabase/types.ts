export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      caixinhas_poupanca: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          saldo: number
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          saldo?: number
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          saldo?: number
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      carteiras: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          saldo: number
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          saldo?: number
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          saldo?: number
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      historico_caixinhas: {
        Row: {
          caixinha_id: string
          created_at: string
          descricao: string | null
          id: string
          saldo_anterior: number
          saldo_novo: number
          tipo: string
          valor: number
        }
        Insert: {
          caixinha_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          saldo_anterior: number
          saldo_novo: number
          tipo: string
          valor: number
        }
        Update: {
          caixinha_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          saldo_anterior?: number
          saldo_novo?: number
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_caixinhas_caixinha_id_fkey"
            columns: ["caixinha_id"]
            isOneToOne: false
            referencedRelation: "caixinhas_poupanca"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_financeiras: {
        Row: {
          concluida: boolean
          created_at: string
          data_limite: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          usuario_id: string
          valor_acumulado: number
          valor_objetivo: number
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          data_limite: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          usuario_id: string
          valor_acumulado?: number
          valor_objetivo: number
        }
        Update: {
          concluida?: boolean
          created_at?: string
          data_limite?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          usuario_id?: string
          valor_acumulado?: number
          valor_objetivo?: number
        }
        Relationships: []
      }
      movimentacoes: {
        Row: {
          ativa: boolean
          carteira_id: string
          created_at: string
          data_vencimento: string
          descricao: string | null
          frequencia: Database["public"]["Enums"]["frequencia_movimentacao"]
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          updated_at: string
          usuario_id: string
          valor: number
        }
        Insert: {
          ativa?: boolean
          carteira_id: string
          created_at?: string
          data_vencimento: string
          descricao?: string | null
          frequencia?: Database["public"]["Enums"]["frequencia_movimentacao"]
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          updated_at?: string
          usuario_id: string
          valor: number
        }
        Update: {
          ativa?: boolean
          carteira_id?: string
          created_at?: string
          data_vencimento?: string
          descricao?: string | null
          frequencia?: Database["public"]["Enums"]["frequencia_movimentacao"]
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
          updated_at?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_carteira_id_fkey"
            columns: ["carteira_id"]
            isOneToOne: false
            referencedRelation: "carteiras"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          id: string
          nome_completo: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_completo?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_completo?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      frequencia_movimentacao: "avulsa" | "semanal" | "quinzenal" | "mensal"
      tipo_movimentacao: "receita" | "despesa"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      frequencia_movimentacao: ["avulsa", "semanal", "quinzenal", "mensal"],
      tipo_movimentacao: ["receita", "despesa"],
    },
  },
} as const
