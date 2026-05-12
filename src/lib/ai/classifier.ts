import { anthropic } from '@/lib/anthropic/client'

export type MessageCategory =
  | 'new_lead'
  | 'document_request'
  | 'appointment'
  | 'follow_up'
  | 'other'

/**
 * Класифікує вхідне повідомлення клієнта.
 *
 * @param text — текст повідомлення
 * @param language — мова клієнта ('de' | 'ru' | 'ua' | null)
 * @param clientHistory — останні 3 повідомлення для контексту
 */
export async function classifyMessage(
  text: string,
  language: 'de' | 'ru' | 'ua' | null,
  clientHistory: string[]
): Promise<{ category: MessageCategory; confidence: number }> {
  const historyContext = clientHistory.length
    ? `Попередня переписка:\n${clientHistory.join('\n---\n')}\n\n`
    : ''

  const langHint = language
    ? `Мова клієнта: ${language.toUpperCase()}. `
    : ''

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      temperature: 0,
      system: `Ти — класифікатор запитів AVGS-коуча. ${langHint}

Категорії:
- new_lead: перший контакт, цікавиться AVGS
- document_request: просить документ або інформацію
- appointment: питання про зустріч
- follow_up: продовження попередньої розмови
- other: інше

Відповідай ТІЛЬКИ JSON у форматі:
{"category": "<категорія>", "confidence": <0.0-1.0>}
Ніякого іншого тексту.`,
      messages: [
        {
          role: 'user',
          content: `${historyContext}Нове повідомлення:\n${text.slice(0, 1000)}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return { category: 'other', confidence: 0 }
    }

    const raw = content.text.trim()
    // Видаляємо markdown code blocks якщо є
    const jsonText = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()

    const parsed = JSON.parse(jsonText) as {
      category: string
      confidence: number
    }

    const validCategories: MessageCategory[] = [
      'new_lead',
      'document_request',
      'appointment',
      'follow_up',
      'other',
    ]

    const category = validCategories.includes(parsed.category as MessageCategory)
      ? (parsed.category as MessageCategory)
      : 'other'

    const confidence = Math.min(Math.max(parsed.confidence ?? 0, 0), 1)

    return { category, confidence }
  } catch (error) {
    console.error('[AI Classifier] Classification failed:', error)
    return { category: 'other', confidence: 0 }
  }
}
