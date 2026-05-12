// Типи БД — відповідають схемі в PROJECT_CONTEXT.md
// Повна версія генерується через: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ClientStatus = 'new' | 'classified' | 'in_work' | 'pause' | 'closed'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageChannel = 'whatsapp' | 'email' | 'phone' | 'zoom'
export type SupportedLanguage = 'de' | 'ru' | 'ua'
export type TenantTier = 'starter' | 'pro' | 'scale'
export type JcOrAa = 'jc' | 'aa' | 'unknown'
export type AuditAction =
  | 'message_sent'
  | 'draft_created'
  | 'approval_given'
  | 'draft_edited'
  | 'draft_rejected'
  | 'status_changed'
  | 'template_used'
  | 'promise_created'
  | 'promise_missed'

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          email: string
          name: string | null
          tier: TenantTier
          language_default: SupportedLanguage
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string | null
          email: string | null
          language_communication: SupportedLanguage | null
          language_documents: SupportedLanguage | null
          language_business: SupportedLanguage | null
          status: ClientStatus
          jc_or_aa: JcOrAa | null
          has_avgs: boolean
          business_idea: string | null
          federal_state: string | null
          has_gewerbe: boolean | null
          next_step: string | null
          next_step_due: string | null
          notes: string | null
          linkedin_url: string | null
          website_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      messages: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          direction: MessageDirection
          channel: MessageChannel
          content: string
          language: SupportedLanguage | null
          ai_draft: boolean
          ai_draft_content: string | null
          template_version: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      audit_log: {
        Row: {
          id: string
          tenant_id: string
          actor: 'human' | 'ai'
          action: AuditAction
          entity_type: string | null
          entity_id: string | null
          template_version: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>
        // Update і Delete навмисно відсутні — audit_log є append-only
      }
      promises: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          message_id: string | null
          description: string
          due_date: string
          status: 'pending' | 'done' | 'missed'
          alerted_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['promises']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['promises']['Insert']>
      }
      templates: {
        Row: {
          id: string
          tenant_id: string
          name: string
          language: SupportedLanguage
          scenario: 'first_contact' | 'follow_up' | 'qualification' | 'rejection' | 'pause'
          content: string
          version: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['templates']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['templates']['Insert']>
      }
      knowledge_items: {
        Row: {
          id: string
          tenant_id: string
          category: 'stable' | 'volatile'
          type: 'template' | 'sop' | 'legal' | 'program' | 'case'
          title: string
          content: string
          source: string | null
          valid_until: string | null
          last_verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['knowledge_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['knowledge_items']['Insert']>
      }
    }
  }
}
