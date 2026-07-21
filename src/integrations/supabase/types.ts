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
      course_sources: {
        Row: {
          course_id: string
          created_at: string
          id: string
          order_number: number
          publisher: string
          title: string
          url: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          order_number: number
          publisher: string
          title: string
          url: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          order_number?: number
          publisher?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string
          id: string
          is_published: boolean
          order_number: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_published?: boolean
          order_number: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          order_number?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_interactions: {
        Row: {
          after_section_id: string | null
          config: Json
          created_at: string
          id: string
          instructions: string
          is_active: boolean
          lesson_id: string
          order_number: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          after_section_id?: string | null
          config: Json
          created_at?: string
          id?: string
          instructions: string
          is_active?: boolean
          lesson_id: string
          order_number: number
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          after_section_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          instructions?: string
          is_active?: boolean
          lesson_id?: string
          order_number?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_interactions_after_section_id_fkey"
            columns: ["after_section_id"]
            isOneToOne: false
            referencedRelation: "lesson_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_interactions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          concept_key: string
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          is_remediation: boolean
          order_number: number
          question: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          concept_key?: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_remediation?: boolean
          order_number: number
          question: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          concept_key?: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_remediation?: boolean
          order_number?: number
          question?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "lesson_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_quiz_answers: {
        Row: {
          answer: string
          correct_answer: boolean
          id: string
          order_number: number
          question_id: string
        }
        Insert: {
          answer: string
          correct_answer?: boolean
          id?: string
          order_number: number
          question_id: string
        }
        Update: {
          answer?: string
          correct_answer?: boolean
          id?: string
          order_number?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lesson_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_quizzes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          passing_score: number | null
          section_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          passing_score?: number | null
          section_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          passing_score?: number | null
          section_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_quizzes_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "lesson_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_sections: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          order_number: number
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          order_number: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          order_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_sources: {
        Row: {
          created_at: string
          id: string
          lesson_section_id: string
          order_number: number
          relevance_note: string | null
          source_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_section_id: string
          order_number?: number
          relevance_note?: string | null
          source_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_section_id?: string
          order_number?: number
          relevance_note?: string | null
          source_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sources_lesson_section_id_fkey"
            columns: ["lesson_section_id"]
            isOneToOne: false
            referencedRelation: "lesson_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_number: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_number: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          id: string
          organization: string
          slug: string
          source_type: string
          title: string
          updated_at: string
          url: string
          verified_on: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization: string
          slug: string
          source_type?: string
          title: string
          updated_at?: string
          url: string
          verified_on?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization?: string
          slug?: string
          source_type?: string
          title?: string
          updated_at?: string
          url?: string
          verified_on?: string
        }
        Relationships: []
      }
      steg_1_quiz_om_personen: {
        Row: {
          category: string | null
          created_at: string
          id: string
          order_number: number
          question: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          order_number: number
          question: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          order_number?: number
          question?: string
        }
        Relationships: []
      }
      steg1_user_quiz_answers_sparad_data: {
        Row: {
          answer_id: string
          created_at: string
          id: string
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          id?: string
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          id?: string
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_answers_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "svar_steg_1_quiz_om_personen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "steg_1_quiz_om_personen"
            referencedColumns: ["id"]
          },
        ]
      }
      svar_steg_1_quiz_om_personen: {
        Row: {
          created_at: string
          fråga_id: string
          id: string
          order_number: number
          svar_text: string
          value: string | null
        }
        Insert: {
          created_at?: string
          fråga_id: string
          id?: string
          order_number: number
          svar_text: string
          value?: string | null
        }
        Update: {
          created_at?: string
          fråga_id?: string
          id?: string
          order_number?: number
          svar_text?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "svar_steg_1_quiz_fraga_id_fkey"
            columns: ["fråga_id"]
            isOneToOne: false
            referencedRelation: "steg_1_quiz_om_personen"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_interaction_responses: {
        Row: {
          answers: Json
          completed: boolean
          created_at: string
          id: string
          interaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          completed?: boolean
          created_at?: string
          id?: string
          interaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          completed?: boolean
          created_at?: string
          id?: string
          interaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_interaction_responses_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "lesson_interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_quiz_answers: {
        Row: {
          answer_id: string
          created_at: string
          id: string
          question_id: string
          quiz_id: string
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          id?: string
          question_id: string
          quiz_id: string
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          id?: string
          question_id?: string
          quiz_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_quiz_answers_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "lesson_quiz_answer_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_quiz_answers_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "lesson_quiz_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lesson_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_quiz_answers_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "lesson_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          full_name: string | null
          id: string
          occupation: string | null
          onboarding_age_range: string | null
          onboarding_completed_at: string | null
          onboarding_income: string | null
          onboarding_topic: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          occupation?: string | null
          onboarding_age_range?: string | null
          onboarding_completed_at?: string | null
          onboarding_income?: string | null
          onboarding_topic?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          occupation?: string | null
          onboarding_age_range?: string | null
          onboarding_completed_at?: string | null
          onboarding_income?: string | null
          onboarding_topic?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      user_progress_saved_data: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          progress_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          progress_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          progress_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      lesson_quiz_answer_options: {
        Row: {
          answer: string | null
          id: string | null
          order_number: number | null
          question_id: string | null
        }
        Insert: {
          answer?: string | null
          id?: string | null
          order_number?: number | null
          question_id?: string | null
        }
        Update: {
          answer?: string | null
          id?: string | null
          order_number?: number | null
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lesson_questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_lesson_quiz_result: {
        Args: { p_quiz_id: string }
        Returns: {
          answered_questions: number
          correct_answers: number
          lesson_completed: boolean
          lesson_id: string
          lesson_progress_percentage: number
          passed: boolean
          passing_score: number
          quiz_id: string
          quiz_type: string
          remediation_questions: number
          score: number
          total_questions: number
        }[]
      }
      submit_lesson_quiz_answer: {
        Args: { p_answer_id: string; p_question_id: string }
        Returns: {
          answered_questions: number
          correct_answer: string
          correct_answer_id: string
          explanation: string
          is_correct: boolean
          lesson_completed: boolean
          lesson_id: string
          lesson_progress_percentage: number
          passed: boolean
          question_is_remediation: boolean
          quiz_id: string
          quiz_type: string
          score: number
          selected_answer_id: string
          total_questions: number
        }[]
      }
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
    Enums: {},
  },
} as const
