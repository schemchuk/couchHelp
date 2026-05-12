// WhatsApp Business API client
// Фаза 1 — базова структура, повна реалізація в наступному блоці

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'

export const whatsappConfig = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  apiToken: process.env.WHATSAPP_API_TOKEN!,
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!,
  apiUrl: WHATSAPP_API_URL,
}

export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // TODO: реалізувати в Блоці 02
  throw new Error('Not implemented yet — Block 02')
}
