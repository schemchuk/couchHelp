// WhatsApp Business API client
// Блок 02 — інтерфейс для відправки повідомлень
// Повна реалізація в Блоці 04 (після approval UI)

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'

export const whatsappConfig = {
  apiUrl: WHATSAPP_API_URL,
}

/**
 * Відправити WhatsApp повідомлення.
 * Зараз — заглушка. Реалізація в Блоці 04.
 */
export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<{ success: boolean; wamid?: string; error?: string }> {
  // TODO: реалізувати в Блоці 04
  throw new Error('Not implemented: sendWhatsAppMessage')
}
