import { anthropic } from '@/lib/anthropic/client'
import type { ClassificationResult, DraftResult, SupportedLanguage } from './types'
import { buildDraftSystemPrompt } from './prompts/draft'

/**
 * Генерує AI-чернетку відповіді на вхідне повідомлення.
 *
 * @param incomingMessage — текст вхідного повідомлення
 * @param classification — результат класифікації
 * @param clientName — ім'я клієнта (опціонально)
 * @param clientHistory — історія переписки
 * @returns DraftResult або null у разі помилки
 */
export async function generateDraft(
  incomingMessage: string,
  classification: ClassificationResult,
  clientName: string | null,
  clientHistory: string[]
): Promise<DraftResult | null> {
  const systemPrompt = buildDraftSystemPrompt(classification)

  const historyContext = clientHistory.length
    ? `Контекст попередньої переписки:\n${clientHistory.join('\n---\n')}\n\n`
    : ''

  const nameHint = clientName ? `Ім'я клієнта: ${clientName}. ` : ''

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 600,
      temperature: 0.6,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `${historyContext}${nameHint}Повідомлення клієнта:\n${incomingMessage.slice(0, 1500)}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return null
    }

    const text = content.text.trim()

    // Якщо мова не визначена — використовуємо 'de' як дефолт для чернетки,
    // хоча prompt уже вказує запитати мову клієнта
    const language: SupportedLanguage = classification.language ?? 'de'

    const model = response.model
    const promptTokens = response.usage?.input_tokens ?? 0
    const completionTokens = response.usage?.output_tokens ?? 0

    return { text, language, model, promptTokens, completionTokens }
  } catch (error) {
    console.error('[AI Draft] Помилка генерації чернетки:', error)
    return null
  }
}
