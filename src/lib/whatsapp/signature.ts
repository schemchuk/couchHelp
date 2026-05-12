import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Верифікує підпис webhook від Meta (X-Hub-Signature-256).
 *
 * @param rawBody — сирий body запиту (рядок)
 * @param signature — значення заголовку x-hub-signature-256, формат: "sha256=<hex>"
 * @param appSecret — App Secret з Meta Developer Console
 * @returns true якщо підпис валідний
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  appSecret: string
): boolean {
  if (!signature.startsWith('sha256=')) {
    return false
  }

  const expectedSignature = signature.slice(7) // видаляємо "sha256="

  const hmac = createHmac('sha256', appSecret)
  hmac.update(rawBody, 'utf8')
  const computedSignature = hmac.digest('hex')

  // Constant-time comparison (timingSafeEqual)
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')
  const computedBuffer = Buffer.from(computedSignature, 'hex')

  if (expectedBuffer.length !== computedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, computedBuffer)
}
