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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      eventos: {
        Row: {
          chave_pix: string | null
          created_at: string
          data: string
          descricao: string | null
          horario: string
          id: string
          imagem_url: string | null
          local: string | null
          nome: string
          obrigatorio: boolean | null
          qr_code_url: string | null
          taxa_inscricao: number | null
          tipo: Database["public"]["Enums"]["event_type"]
          updated_at: string
          whatsapp_link: string | null
        }
        Insert: {
          chave_pix?: string | null
          created_at?: string
          data: string
          descricao?: string | null
          horario: string
          id?: string
          imagem_url?: string | null
          local?: string | null
          nome: string
          obrigatorio?: boolean | null
          qr_code_url?: string | null
          taxa_inscricao?: number | null
          tipo: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          whatsapp_link?: string | null
        }
        Update: {
          chave_pix?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          horario?: string
          id?: string
          imagem_url?: string | null
          local?: string | null
          nome?: string
          obrigatorio?: boolean | null
          qr_code_url?: string | null
          taxa_inscricao?: number | null
          tipo?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          whatsapp_link?: string | null
        }
        Relationships: []
      }
      grupos_oracao: {
        Row: {
          created_at: string
          descricao: string | null
          horario: string
          id: string
          imagem_url: string | null
          local: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          horario: string
          id?: string
          imagem_url?: string | null
          local: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          horario?: string
          id?: string
          imagem_url?: string | null
          local?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      inscricoes: {
        Row: {
          confirmado: boolean | null
          created_at: string
          dados_formulario: Json | null
          evento_id: string
          id: string
          presente: boolean | null
          user_id: string
        }
        Insert: {
          confirmado?: boolean | null
          created_at?: string
          dados_formulario?: Json | null
          evento_id: string
          id?: string
          presente?: boolean | null
          user_id: string
        }
        Update: {
          confirmado?: boolean | null
          created_at?: string
          dados_formulario?: Json | null
          evento_id?: string
          id?: string
          presente?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscricoes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscricoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      noticias: {
        Row: {
          autor_id: string | null
          conteudo: string
          created_at: string
          id: string
          imagem_url: string | null
          publicado: boolean | null
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id?: string | null
          conteudo: string
          created_at?: string
          id?: string
          imagem_url?: string | null
          publicado?: boolean | null
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          imagem_url?: string | null
          publicado?: boolean | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "noticias_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          endereco?: string | null
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_coordenador: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      event_type:
        | "formacao"
        | "retiro"
        | "reuniao"
        | "experiencia_oracao"
        | "introducao_dons"
      user_role: "admin" | "coordenador" | "servo"
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
      event_type: [
        "formacao",
        "retiro",
        "reuniao",
        "experiencia_oracao",
        "introducao_dons",
      ],
      user_role: ["admin", "coordenador", "servo"],
    },
  },
} as const
