// WhatsApp Business API — типи webhook payload
// Блок 02 — суворий TypeScript, no any

export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'document'
  | 'audio'
  | 'video'
  | 'sticker'
  | 'unknown'

export interface WhatsAppTextMessage {
  body: string
}

export interface WhatsAppMediaMessage {
  id: string
  mime_type?: string
  sha256?: string
  filename?: string
  caption?: string
}

export interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: WhatsAppMessageType
  text?: WhatsAppTextMessage
  image?: WhatsAppMediaMessage
  document?: WhatsAppMediaMessage
  audio?: WhatsAppMediaMessage
  video?: WhatsAppMediaMessage
  sticker?: WhatsAppMediaMessage
}

export interface WhatsAppContact {
  wa_id: string
  profile?: {
    name: string
  }
}

export interface WhatsAppStatusUpdate {
  id: string
  recipient_id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  conversation?: {
    id: string
  }
  pricing?: {
    category: string
  }
}

export interface WhatsAppValue {
  messaging_product: 'whatsapp'
  metadata: {
    display_phone_number: string
    phone_number_id: string
  }
  contacts?: WhatsAppContact[]
  messages?: WhatsAppMessage[]
  statuses?: WhatsAppStatusUpdate[]
}

export interface WhatsAppChange {
  value: WhatsAppValue
  field: 'messages'
}

export interface WhatsAppEntry {
  id: string
  changes: WhatsAppChange[]
}

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account'
  entry: WhatsAppEntry[]
}
