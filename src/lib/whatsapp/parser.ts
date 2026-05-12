import type {
  WhatsAppWebhookPayload,
  WhatsAppMessage,
  WhatsAppStatusUpdate,
  WhatsAppContact,
} from './types'

/**
 * Витягує масив повідомлень з webhook payload.
 * Може бути 0, 1 або більше повідомлень на один webhook.
 */
export function extractMessages(
  payload: WhatsAppWebhookPayload
): WhatsAppMessage[] {
  const messages: WhatsAppMessage[] = []

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.value.messages) {
        messages.push(...change.value.messages)
      }
    }
  }

  return messages
}

/**
 * Витягує масив статус-оновлень з webhook payload.
 */
export function extractStatuses(
  payload: WhatsAppWebhookPayload
): WhatsAppStatusUpdate[] {
  const statuses: WhatsAppStatusUpdate[] = []

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.value.statuses) {
        statuses.push(...change.value.statuses)
      }
    }
  }

  return statuses
}

/**
 * Витягує phone_number_id з першого entry/changes/value/metadata.
 * Якщо не знайдено — повертає null.
 */
export function extractPhoneNumberId(
  payload: WhatsAppWebhookPayload
): string | null {
  const firstEntry = payload.entry[0]
  if (!firstEntry) return null

  const firstChange = firstEntry.changes[0]
  if (!firstChange) return null

  return firstChange.value.metadata?.phone_number_id ?? null
}

/**
 * Витягує номер телефону відправника з повідомлення.
 */
export function extractSenderPhone(message: WhatsAppMessage): string {
  return message.from
}

/**
 * Витягує ім'я відправника з payload (з contacts).
 * Пошук за номером телефону.
 */
export function extractSenderName(
  payload: WhatsAppWebhookPayload,
  phone: string
): string | null {
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const contact = change.value.contacts?.find(
        (c: WhatsAppContact) => c.wa_id === phone
      )
      if (contact?.profile?.name) {
        return contact.profile.name
      }
    }
  }
  return null
}

/**
 * Перевіряє, чи payload містить вхідні повідомлення (messages).
 * Якщо false — це скоріше за все status update.
 */
export function isInboundMessage(payload: WhatsAppWebhookPayload): boolean {
  return extractMessages(payload).length > 0
}
