// Типи модуля inbox
// Розширення типів бази даних для UI-шару

import type { SupportedLanguage, ClientStatus } from '@/types'

export interface InboxMessage {
  id: string
  clientId: string
  clientName: string
  clientStatus: ClientStatus
  direction: 'inbound' | 'outbound'
  content: string
  aiDraft: string | null
  language: SupportedLanguage | null
  createdAt: string
  sentAt: string | null
}

export interface DraftAction {
  type: 'send' | 'edit' | 'reject'
  messageId: string
  editedContent?: string
}
