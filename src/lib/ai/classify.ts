import { anthropic } from '@/lib/anthropic/client'
import type { ClassificationResult, MessageType, MessageTone, SupportedLanguage } from './types'
import { CLASSIFY_SYSTEM_PROMPT } from './prompts/classify'

/**
 * Класифікує вхідне повідомлення клієнта.
 *
 * Визначає тип запиту, тон, мову, наявність обіцянки коуча
 * та впевненість класифікації.
 *
 * @param text — текст повідомлення (або транскрипція аудіо)
 * @param clientHistory — останні повідомлення для контексту
 * @returns ClassificationResult або null у разі помилки
 */
export async function classifyMessage(
  text: string,
  clientHistory: string[]
): Promise<ClassificationResult | null> {
  const historyContext = clientHistory.length
    ? `Попередня переписка:\n${clientHistory.join('\n---\n')}\n\n`
    : ''

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      temperature: 0,
      system: CLASSIFY_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${historyContext}Нове повідомлення:\n${text.slice(0, 1500)}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return null
    }

    const raw = content.text.trim()
    const jsonText = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()

    const parsed = JSON.parse(jsonText) as {
      type: string
      tone: string
      language: string | null
      hasPromise: boolean
      confidence: number
    }

    const validTypes: MessageType[] = ['new_lead', 'existing_client', 'spam', 'unclear']
    const validTones: MessageTone[] = ['neutral', 'urgent', 'positive', 'negative']
    const validLanguages: SupportedLanguage[] = ['de', 'ru', 'ua', 'en']

    const type = validTypes.includes(parsed.type as MessageType)
      ? (parsed.type as MessageType)
      : 'unclear'

    const tone = validTones.includes(parsed.tone as MessageTone)
      ? (parsed.tone as MessageTone)
      : 'neutral'

    const detectedLang =
      parsed.language && validLanguages.includes(parsed.language as SupportedLanguage)
        ? (parsed.language as SupportedLanguage)
        : null

    // Якщо текст коротший за 50 символів — мову не вгадуємо
    const language = text.trim().length < 50 ? null : detectedLang

    const hasPromise = typeof parsed.hasPromise === 'boolean' ? parsed.hasPromise : false
    const confidence = Math.min(Math.max(parsed.confidence ?? 0, 0), 1)

    return { type, tone, language, hasPromise, confidence }
  } catch (error) {
    console.error('[AI Classify] Помилка класифікації:', error)
    return null
  }
}
