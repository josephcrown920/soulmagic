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
      assets: {
        Row: {
          created_at: string
          file_path: string
          id: string
          kind: string
          name: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          kind: string
          name: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          kind?: string
          name?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          created_at: string
          file_path: string
          height: number | null
          id: string
          lora_id: string | null
          prompt: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          file_path: string
          height?: number | null
          id?: string
          lora_id?: string | null
          prompt: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          file_path?: string
          height?: number | null
          id?: string
          lora_id?: string | null
          prompt?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          id: string
          input_path: string
          output_path: string | null
          preset_id: string | null
          preset_snapshot: Json | null
          progress: number | null
          replicate_prediction_id: string | null
          source_filename: string
          status: string
          thumbnail_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          input_path: string
          output_path?: string | null
          preset_id?: string | null
          preset_snapshot?: Json | null
          progress?: number | null
          replicate_prediction_id?: string | null
          source_filename: string
          status?: string
          thumbnail_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          input_path?: string
          output_path?: string | null
          preset_id?: string | null
          preset_snapshot?: Json | null
          progress?: number | null
          replicate_prediction_id?: string | null
          source_filename?: string
          status?: string
          thumbnail_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "presets"
            referencedColumns: ["id"]
          },
        ]
      }
      loras: {
        Row: {
          base_model: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          kind: string
          name: string
          preview_path: string | null
          progress: number | null
          replicate_model_name: string | null
          replicate_model_owner: string | null
          replicate_training_id: string | null
          replicate_version_id: string | null
          status: string
          training_image_paths: string[] | null
          training_steps: number | null
          trigger_word: string | null
          updated_at: string
          user_id: string
          weights_url: string | null
        }
        Insert: {
          base_model?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          kind?: string
          name: string
          preview_path?: string | null
          progress?: number | null
          replicate_model_name?: string | null
          replicate_model_owner?: string | null
          replicate_training_id?: string | null
          replicate_version_id?: string | null
          status?: string
          training_image_paths?: string[] | null
          training_steps?: number | null
          trigger_word?: string | null
          updated_at?: string
          user_id: string
          weights_url?: string | null
        }
        Update: {
          base_model?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          kind?: string
          name?: string
          preview_path?: string | null
          progress?: number | null
          replicate_model_name?: string | null
          replicate_model_owner?: string | null
          replicate_training_id?: string | null
          replicate_version_id?: string | null
          status?: string
          training_image_paths?: string[] | null
          training_steps?: number | null
          trigger_word?: string | null
          updated_at?: string
          user_id?: string
          weights_url?: string | null
        }
        Relationships: []
      }
      luts: {
        Row: {
          created_at: string
          file_path: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          amount: number | null
          currency: string | null
          event_type: string
          id: string
          paystack_event_id: string | null
          processed_at: string
          raw: Json
          reference: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          currency?: string | null
          event_type: string
          id?: string
          paystack_event_id?: string | null
          processed_at?: string
          raw: Json
          reference?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          currency?: string | null
          event_type?: string
          id?: string
          paystack_event_id?: string | null
          processed_at?: string
          raw?: Json
          reference?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      presets: {
        Row: {
          background_upscale: boolean | null
          contrast: number | null
          created_at: string
          description: string | null
          face_model: string | null
          face_ref_id: string | null
          face_strength: number | null
          id: string
          is_default: boolean | null
          lora_id: string | null
          lut_id: string | null
          name: string
          outfit_prompt: string | null
          reference_asset_ids: string[] | null
          saturation: number | null
          scene_outfit_pass: boolean
          scene_prompt: string | null
          sharpness: number | null
          skin_smoothing: number | null
          updated_at: string
          user_id: string
          warmth: number | null
        }
        Insert: {
          background_upscale?: boolean | null
          contrast?: number | null
          created_at?: string
          description?: string | null
          face_model?: string | null
          face_ref_id?: string | null
          face_strength?: number | null
          id?: string
          is_default?: boolean | null
          lora_id?: string | null
          lut_id?: string | null
          name: string
          outfit_prompt?: string | null
          reference_asset_ids?: string[] | null
          saturation?: number | null
          scene_outfit_pass?: boolean
          scene_prompt?: string | null
          sharpness?: number | null
          skin_smoothing?: number | null
          updated_at?: string
          user_id: string
          warmth?: number | null
        }
        Update: {
          background_upscale?: boolean | null
          contrast?: number | null
          created_at?: string
          description?: string | null
          face_model?: string | null
          face_ref_id?: string | null
          face_strength?: number | null
          id?: string
          is_default?: boolean | null
          lora_id?: string | null
          lut_id?: string | null
          name?: string
          outfit_prompt?: string | null
          reference_asset_ids?: string[] | null
          saturation?: number | null
          scene_outfit_pass?: boolean
          scene_prompt?: string | null
          sharpness?: number | null
          skin_smoothing?: number | null
          updated_at?: string
          user_id?: string
          warmth?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "presets_face_ref_id_fkey"
            columns: ["face_ref_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presets_lut_id_fkey"
            columns: ["lut_id"]
            isOneToOne: false
            referencedRelation: "luts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accent_color: string | null
          created_at: string
          default_preset_id: string | null
          display_name: string | null
          id: string
          notifications_enabled: boolean | null
          output_format: string | null
          output_resolution: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          default_preset_id?: string | null
          display_name?: string | null
          id?: string
          notifications_enabled?: boolean | null
          output_format?: string | null
          output_resolution?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          default_preset_id?: string | null
          display_name?: string | null
          id?: string
          notifications_enabled?: boolean | null
          output_format?: string | null
          output_resolution?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_preset_fk"
            columns: ["default_preset_id"]
            isOneToOne: false
            referencedRelation: "presets"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          monthly_images: number
          monthly_jobs: number
          monthly_loras: number
          name: string
          paystack_plan_code_ngn: string | null
          paystack_plan_code_usd: string | null
          price_ngn_kobo: number
          price_usd_cents: number
          priority_queue: boolean
          slug: string
          sort_order: number
          updated_at: string
          watermark: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          monthly_images?: number
          monthly_jobs?: number
          monthly_loras?: number
          name: string
          paystack_plan_code_ngn?: string | null
          paystack_plan_code_usd?: string | null
          price_ngn_kobo?: number
          price_usd_cents?: number
          priority_queue?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
          watermark?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          monthly_images?: number
          monthly_jobs?: number
          monthly_loras?: number
          name?: string
          paystack_plan_code_ngn?: string | null
          paystack_plan_code_usd?: string | null
          price_ngn_kobo?: number
          price_usd_cents?: number
          priority_queue?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
          watermark?: boolean
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          created_at: string
          id: string
          images_generated: number
          jobs_processed: number
          loras_trained: number
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          images_generated?: number
          jobs_processed?: number
          loras_trained?: number
          period_start: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          images_generated?: number
          jobs_processed?: number
          loras_trained?: number
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          paystack_customer_code: string | null
          paystack_email_token: string | null
          paystack_subscription_code: string | null
          plan_slug: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          plan_slug?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          plan_slug?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_slug_fkey"
            columns: ["plan_slug"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["slug"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_usage_counter: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          id: string
          images_generated: number
          jobs_processed: number
          loras_trained: number
          period_start: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "usage_counters"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_plan: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
