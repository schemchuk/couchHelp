import { anthropic } from '@/lib/anthropic/client'

/**
 * Визначити мову повідомлення.
 *
 * Правила:
 * - Якщо client.language вже встановлено — повертаємо його, не визначаємо повторно.
 * - Якщо NULL і довжина тексту < 50 символів — повертаємо null (не вгадуємо).
 * - Якщо NULL і довжина >= 50 — визначаємо через Anthropic API.
 *
 * Повертає: 'de' | 'ru' | 'ua' | null
 */
export async function detectLanguage(
  text: string,
  existingLanguage: string | null
): Promise<'de' | 'ru' | 'ua' | null> {
  if (existingLanguage) {
    const lang = existingLanguage as 'de' | 'ru' | 'ua'
    if (['de', 'ru', 'ua'].includes(lang)) {
      return lang
    }
  }

  if (text.trim().length < 50) {
    return null // Занадто коротке — не вгадуємо
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 50,
      temperature: 0,
      system:
        'Ти — детектор мови. Визнач мову тексту. Відповідай ТІЛЬКИ одним зі слів: german, russian, ukrainian. Ніякого іншого тексту.',
      messages: [
        {
          role: 'user',
          content: `Визнач мову цього тексту:\n\n${text.slice(0, 500)}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') return null

    const answer = content.text.toLowerCase().trim()

    if (answer.includes('german') || answer.includes('deutsch')) return 'de'
    if (answer.includes('ukrainian') || answer.includes('українськ')) return 'ua'
    if (answer.includes('russian') || answer.includes('русск')) return 'ru'

    return null
  } catch (error) {
    console.error('[AI Language] Detection failed:', error)
    return null
  }
}
