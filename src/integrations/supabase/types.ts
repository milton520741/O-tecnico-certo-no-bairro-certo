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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          bio: string | null
          company_name: string
          created_at: string
          id: string
          is_banned: boolean
          is_verified: boolean
          logo_url: string | null
          phone_whatsapp: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          company_name: string
          created_at?: string
          id: string
          is_banned?: boolean
          is_verified?: boolean
          logo_url?: string | null
          phone_whatsapp?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          company_name?: string
          created_at?: string
          id?: string
          is_banned?: boolean
          is_verified?: boolean
          logo_url?: string | null
          phone_whatsapp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_services: {
        Row: {
          company_id: string
          service_id: number
        }
        Insert: {
          company_id: string
          service_id: number
        }
        Update: {
          company_id?: string
          service_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      company_zones: {
        Row: {
          company_id: string
          zone_id: number
        }
        Insert: {
          company_id: string
          zone_id: number
        }
        Update: {
          company_id?: string
          zone_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_zones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_zones_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          created_at: string
          file_path: string
          id: number
          note: string | null
          owner_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          reviewed: boolean
          subscription_id: number | null
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: number
          note?: string | null
          owner_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          reviewed?: boolean
          subscription_id?: number | null
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: number
          note?: string | null
          owner_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          reviewed?: boolean
          subscription_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          caption: string | null
          created_at: string
          id: number
          image_url: string
          technician_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: number
          image_url: string
          technician_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: number
          image_url?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          icon: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: number
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_at: string | null
          id: number
          owner_id: string
          owner_type: Database["public"]["Enums"]["owner_type"]
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_at?: string | null
          id?: number
          owner_id: string
          owner_type: Database["public"]["Enums"]["owner_type"]
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_at?: string | null
          id?: number
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["owner_type"]
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: []
      }
      technician_services: {
        Row: {
          service_id: number
          technician_id: string
        }
        Insert: {
          service_id: number
          technician_id: string
        }
        Update: {
          service_id?: number
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_services_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_zones: {
        Row: {
          technician_id: string
          zone_id: number
        }
        Insert: {
          technician_id: string
          zone_id: number
        }
        Update: {
          technician_id?: string
          zone_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "technician_zones_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_zones_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string
          id: string
          is_banned: boolean
          is_premium: boolean
          is_verified: boolean
          phone_whatsapp: string | null
          profile_photo_url: string | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name: string
          id: string
          is_banned?: boolean
          is_premium?: boolean
          is_verified?: boolean
          phone_whatsapp?: string | null
          profile_photo_url?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_banned?: boolean
          is_premium?: boolean
          is_verified?: boolean
          phone_whatsapp?: string | null
          profile_photo_url?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          created_at: string
          id: number
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_due_subscriptions: { Args: never; Returns: number }
      get_public_whatsapp: { Args: { _owner_id: string }; Returns: string }
      has_active_subscription: { Args: { _owner_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "technician" | "company" | "admin"
      owner_type: "technician" | "company"
      subscription_plan: "simples" | "premium" | "empresa_mensal"
      subscription_status: "pending" | "active" | "expired" | "rejected"
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
      app_role: ["technician", "company", "admin"],
      owner_type: ["technician", "company"],
      subscription_plan: ["simples", "premium", "empresa_mensal"],
      subscription_status: ["pending", "active", "expired", "rejected"],
    },
  },
} as const
