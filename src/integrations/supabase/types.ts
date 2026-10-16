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
      contributions: {
        Row: {
          attachment_url: string | null
          contributor_email: string
          contributor_name: string
          contributor_phone: string | null
          created_at: string
          editorial_notes: string | null
          id: string
          message: string
          related_person: string | null
          related_year: number | null
          relation: string | null
          status: Database["public"]["Enums"]["contribution_status"]
          subject: string
        }
        Insert: {
          attachment_url?: string | null
          contributor_email: string
          contributor_name: string
          contributor_phone?: string | null
          created_at?: string
          editorial_notes?: string | null
          id?: string
          message: string
          related_person?: string | null
          related_year?: number | null
          relation?: string | null
          status?: Database["public"]["Enums"]["contribution_status"]
          subject: string
        }
        Update: {
          attachment_url?: string | null
          contributor_email?: string
          contributor_name?: string
          contributor_phone?: string | null
          created_at?: string
          editorial_notes?: string | null
          id?: string
          message?: string
          related_person?: string | null
          related_year?: number | null
          relation?: string | null
          status?: Database["public"]["Enums"]["contribution_status"]
          subject?: string
        }
        Relationships: []
      }
      editions: {
        Row: {
          cancellation_reason: string | null
          cancelled: boolean
          context: string | null
          cover_image: string | null
          created_at: string
          id: string
          notes: string | null
          theme: string | null
          title: string | null
          verification: Database["public"]["Enums"]["verification_status"]
          year: number
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled?: boolean
          context?: string | null
          cover_image?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          theme?: string | null
          title?: string | null
          verification?: Database["public"]["Enums"]["verification_status"]
          year: number
        }
        Update: {
          cancellation_reason?: string | null
          cancelled?: boolean
          context?: string | null
          cover_image?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          theme?: string | null
          title?: string | null
          verification?: Database["public"]["Enums"]["verification_status"]
          year?: number
        }
        Relationships: []
      }
      family_relationships: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          person_a: string
          person_b: string
          relationship: Database["public"]["Enums"]["relationship_type"]
          verification: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          person_a: string
          person_b: string
          relationship: Database["public"]["Enums"]["relationship_type"]
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          person_a?: string
          person_b?: string
          relationship?: Database["public"]["Enums"]["relationship_type"]
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "family_relationships_person_a_fkey"
            columns: ["person_a"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_relationships_person_b_fkey"
            columns: ["person_b"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          bytes: number | null
          caption: string | null
          created_at: string
          credit_author: string | null
          credit_source: string | null
          edition_id: string | null
          height: number | null
          id: string
          is_cover: boolean
          is_featured: boolean
          mime_type: string | null
          municipality_id: string | null
          person_id: string | null
          photo_flags: string[]
          photo_type: Database["public"]["Enums"]["photo_type"]
          sort_order: number
          storage_path: string
          story_id: string | null
          tags: string[]
          title: string | null
          updated_at: string
          uploaded_by: string | null
          url: string
          usage_permission: Database["public"]["Enums"]["usage_permission"]
          verification: Database["public"]["Enums"]["verification_status"]
          width: number | null
          year: number | null
        }
        Insert: {
          alt_text?: string | null
          bytes?: number | null
          caption?: string | null
          created_at?: string
          credit_author?: string | null
          credit_source?: string | null
          edition_id?: string | null
          height?: number | null
          id?: string
          is_cover?: boolean
          is_featured?: boolean
          mime_type?: string | null
          municipality_id?: string | null
          person_id?: string | null
          photo_flags?: string[]
          photo_type?: Database["public"]["Enums"]["photo_type"]
          sort_order?: number
          storage_path: string
          story_id?: string | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          url: string
          usage_permission?: Database["public"]["Enums"]["usage_permission"]
          verification?: Database["public"]["Enums"]["verification_status"]
          width?: number | null
          year?: number | null
        }
        Update: {
          alt_text?: string | null
          bytes?: number | null
          caption?: string | null
          created_at?: string
          credit_author?: string | null
          credit_source?: string | null
          edition_id?: string | null
          height?: number | null
          id?: string
          is_cover?: boolean
          is_featured?: boolean
          mime_type?: string | null
          municipality_id?: string | null
          person_id?: string | null
          photo_flags?: string[]
          photo_type?: Database["public"]["Enums"]["photo_type"]
          sort_order?: number
          storage_path?: string
          story_id?: string | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          url?: string
          usage_permission?: Database["public"]["Enums"]["usage_permission"]
          verification?: Database["public"]["Enums"]["verification_status"]
          width?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      media_people: {
        Row: {
          created_at: string
          is_primary: boolean
          media_id: string
          person_id: string
        }
        Insert: {
          created_at?: string
          is_primary?: boolean
          media_id: string
          person_id: string
        }
        Update: {
          created_at?: string
          is_primary?: boolean
          media_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_people_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          cabecera: string | null
          created_at: string
          description: string | null
          emblema: string | null
          id: string
          name: string
          region: string | null
          slug: string
        }
        Insert: {
          cabecera?: string | null
          created_at?: string
          description?: string | null
          emblema?: string | null
          id?: string
          name: string
          region?: string | null
          slug: string
        }
        Update: {
          cabecera?: string | null
          created_at?: string
          description?: string | null
          emblema?: string | null
          id?: string
          name?: string
          region?: string | null
          slug?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          bio: string | null
          birth_year: number | null
          created_at: string
          death_year: number | null
          editorial_notes: string | null
          full_name: string
          id: string
          is_ambassador: boolean
          maiden_name: string | null
          origin_municipality_id: string | null
          portrait: string | null
          slug: string
          updated_at: string
          verification: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          death_year?: number | null
          editorial_notes?: string | null
          full_name: string
          id?: string
          is_ambassador?: boolean
          maiden_name?: string | null
          origin_municipality_id?: string | null
          portrait?: string | null
          slug: string
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          death_year?: number | null
          editorial_notes?: string | null
          full_name?: string
          id?: string
          is_ambassador?: boolean
          maiden_name?: string | null
          origin_municipality_id?: string | null
          portrait?: string | null
          slug?: string
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "people_origin_municipality_id_fkey"
            columns: ["origin_municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      recognitions: {
        Row: {
          created_at: string
          edition_id: string
          id: string
          notes: string | null
          person_id: string
          type: Database["public"]["Enums"]["recognition_type"]
        }
        Insert: {
          created_at?: string
          edition_id: string
          id?: string
          notes?: string | null
          person_id: string
          type: Database["public"]["Enums"]["recognition_type"]
        }
        Update: {
          created_at?: string
          edition_id?: string
          id?: string
          notes?: string | null
          person_id?: string
          type?: Database["public"]["Enums"]["recognition_type"]
        }
        Relationships: [
          {
            foreignKeyName: "recognitions_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recognitions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      representations: {
        Row: {
          age: number | null
          created_at: string
          edition_id: string
          id: string
          municipality_id: string | null
          notes: string | null
          person_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          edition_id: string
          id?: string
          municipality_id?: string | null
          notes?: string | null
          person_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          edition_id?: string
          id?: string
          municipality_id?: string | null
          notes?: string | null
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "representations_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "representations_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "representations_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          logo: string | null
          motivation: string | null
          name: string
          since_year: number | null
          slug: string
          sponsorship_type: Database["public"]["Enums"]["sponsorship_type"]
          status: Database["public"]["Enums"]["sponsor_status"]
          tagline: string | null
          website: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          logo?: string | null
          motivation?: string | null
          name: string
          since_year?: number | null
          slug: string
          sponsorship_type: Database["public"]["Enums"]["sponsorship_type"]
          status?: Database["public"]["Enums"]["sponsor_status"]
          tagline?: string | null
          website?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          logo?: string | null
          motivation?: string | null
          name?: string
          since_year?: number | null
          slug?: string
          sponsorship_type?: Database["public"]["Enums"]["sponsorship_type"]
          status?: Database["public"]["Enums"]["sponsor_status"]
          tagline?: string | null
          website?: string | null
        }
        Relationships: []
      }
      sponsorship_leads: {
        Row: {
          budget_range: string | null
          company: string
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          role: string | null
          sponsorship_type:
            | Database["public"]["Enums"]["sponsorship_type"]
            | null
          status: string
        }
        Insert: {
          budget_range?: string | null
          company: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          role?: string | null
          sponsorship_type?:
            | Database["public"]["Enums"]["sponsorship_type"]
            | null
          status?: string
        }
        Update: {
          budget_range?: string | null
          company?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          role?: string | null
          sponsorship_type?:
            | Database["public"]["Enums"]["sponsorship_type"]
            | null
          status?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          body: string | null
          category: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          related_edition_id: string | null
          related_municipality_id: string | null
          related_person_id: string | null
          slug: string
          sponsor_id: string | null
          title: string
          verification: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          body?: string | null
          category: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          related_edition_id?: string | null
          related_municipality_id?: string | null
          related_person_id?: string | null
          slug: string
          sponsor_id?: string | null
          title: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          body?: string | null
          category?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          related_edition_id?: string | null
          related_municipality_id?: string | null
          related_person_id?: string | null
          slug?: string
          sponsor_id?: string | null
          title?: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "stories_related_edition_id_fkey"
            columns: ["related_edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_related_municipality_id_fkey"
            columns: ["related_municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_related_person_id_fkey"
            columns: ["related_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_admin_if_first: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      contribution_status: "pending" | "approved" | "rejected"
      photo_type:
        | "retrato"
        | "coronacion"
        | "carro_alegorico"
        | "vestido"
        | "familia"
        | "prensa"
        | "grupo"
        | "otro"
      recognition_type:
        | "flor_de_oro"
        | "embajadora"
        | "fotogenia"
        | "simpatia"
        | "finalista"
        | "princesa"
        | "otro"
      relationship_type:
        | "madre_hija"
        | "hermanas"
        | "abuela_nieta"
        | "tia_sobrina"
        | "primas"
        | "madrina"
        | "otro"
      sponsor_status: "ejemplo" | "prospecto" | "activo" | "historico"
      sponsorship_type:
        | "fundador"
        | "decada"
        | "municipio"
        | "digitalizacion"
        | "experiencias"
        | "aliado"
      usage_permission:
        | "autorizado"
        | "dominio_publico"
        | "uso_editorial"
        | "pendiente"
      verification_status:
        | "verified"
        | "partial"
        | "investigating"
        | "community"
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
      app_role: ["admin", "editor", "viewer"],
      contribution_status: ["pending", "approved", "rejected"],
      photo_type: [
        "retrato",
        "coronacion",
        "carro_alegorico",
        "vestido",
        "familia",
        "prensa",
        "grupo",
        "otro",
      ],
      recognition_type: [
        "flor_de_oro",
        "embajadora",
        "fotogenia",
        "simpatia",
        "finalista",
        "princesa",
        "otro",
      ],
      relationship_type: [
        "madre_hija",
        "hermanas",
        "abuela_nieta",
        "tia_sobrina",
        "primas",
        "madrina",
        "otro",
      ],
      sponsor_status: ["ejemplo", "prospecto", "activo", "historico"],
      sponsorship_type: [
        "fundador",
        "decada",
        "municipio",
        "digitalizacion",
        "experiencias",
        "aliado",
      ],
      usage_permission: [
        "autorizado",
        "dominio_publico",
        "uso_editorial",
        "pendiente",
      ],
      verification_status: [
        "verified",
        "partial",
        "investigating",
        "community",
      ],
    },
  },
} as const
