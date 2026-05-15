// Типи БД — 1:1 відповідають схемі в supabase/migrations/001_init_schema.sql
// Джерело правди — SQL міграція

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          clerk_org_id: string
          name: string
          phone_number_id: string | null
          waba_id: string | null
          access_token_enc: string | null
          whatsapp_connected: boolean
          phone_number_source: string
          tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_org_id: string
          name: string
          phone_number_id?: string | null
          waba_id?: string | null
          access_token_enc?: string | null
          whatsapp_connected?: boolean
          phone_number_source?: string
          tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          clerk_org_id?: string
          name?: string
          phone_number_id?: string | null
          waba_id?: string | null
          access_token_enc?: string | null
          whatsapp_connected?: boolean
          phone_number_source?: string
          tier?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          phone: string
          name: string | null
          language: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          phone: string
          name?: string | null
          language?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          phone?: string
          name?: string | null
          language?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          wamid: string | null
          direction: string
          status: string
          message_type: string
          body: string | null
          media_id: string | null
          media_url: string | null
          media_filename: string | null
          ai_draft: string | null
          ai_classification: string | null
          transcription: string | null
          ai_generated: boolean | null
          parent_message_id: string | null
          is_read: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          wamid?: string | null
          direction: string
          status?: string
          message_type: string
          body?: string | null
          media_id?: string | null
          media_url?: string | null
          media_filename?: string | null
          ai_draft?: string | null
          ai_classification?: string | null
          transcription?: string | null
          ai_generated?: boolean | null
          parent_message_id?: string | null
          is_read?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          client_id?: string
          wamid?: string | null
          direction?: string
          status?: string
          message_type?: string
          body?: string | null
          media_id?: string | null
          media_url?: string | null
          media_filename?: string | null
          ai_draft?: string | null
          ai_classification?: string | null
          transcription?: string | null
          ai_generated?: boolean | null
          parent_message_id?: string | null
          is_read?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          tenant_id: string | null
          entity_type: string
          entity_id: string | null
          action: string
          actor: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          entity_type: string
          entity_id?: string | null
          action: string
          actor: string
          metadata?: Json | null
          created_at?: string
        }
        // Update навмисно не використовується — audit_log є append-only
        // Але присутній в типі для сумісності з GenericTable
        Update: {
          tenant_id?: string | null
          entity_type?: string
          entity_id?: string | null
          action?: string
          actor?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      promises: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          message_id: string | null
          text: string
          due_date: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          message_id?: string | null
          text: string
          due_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          client_id?: string
          message_id?: string | null
          text?: string
          due_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          id: string
          tenant_id: string | null
          language: string
          scenario: string
          subject: string | null
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          language: string
          scenario: string
          subject?: string | null
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string | null
          language?: string
          scenario?: string
          subject?: string | null
          body?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_items: {
        Row: {
          id: string
          tenant_id: string | null
          type: string
          title: string
          content: string
          language: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          type: string
          title: string
          content: string
          language?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string | null
          type?: string
          title?: string
          content?: string
          language?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
