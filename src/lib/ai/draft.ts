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
 * @param forcedLanguage — примусова мова (для ручного вибору коуча)
 * @returns DraftResult або null у разі помилки
 */
export async function generateDraft(
  incomingMessage: string,
  classification: ClassificationResult,
  clientName: string | null,
  clientHistory: string[],
  forcedLanguage?: SupportedLanguage
): Promise<DraftResult | null> {
  const draftLanguage = forcedLanguage ?? classification.language

  const systemPrompt = buildDraftSystemPrompt({ ...classification, language: draftLanguage })

  const historyContext = clientHistory.length
    ? `Контекст попередньої переписки:\n${clientHistory.join('\n---\n')}\n\n`
    : ''

  const nameHint = clientName ? `Ім'я клієнта: ${clientName}. ` : ''

  // Якщо мова не визначена і немає примусової — чернетку не генеруємо автоматично
  if (!draftLanguage) {
    return null
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
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

    const language: SupportedLanguage = draftLanguage

    const model = response.model
    const promptTokens = response.usage?.input_tokens ?? 0
    const completionTokens = response.usage?.output_tokens ?? 0

    return { text, language, model, promptTokens, completionTokens }
  } catch (error) {
    console.error('[AI Draft] Помилка генерації чернетки:', error)
    return null
  }
}
