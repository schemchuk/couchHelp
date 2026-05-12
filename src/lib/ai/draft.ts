import { anthropic } from '@/lib/anthropic/client'

/**
 * Генерує AI-чернетку відповіді на вхідне повідомлення.
 *
 * Тон: професійний але теплий.
 * Довжина: коротко, як у WhatsApp (не email).
 * Не вигадувати деталі яких немає — залишати [...] для заповнення коучем.
 */
export async function generateDraft(
  incomingMessage: string,
  classification: string,
  language: 'de' | 'ru' | 'ua' | null,
  clientName: string | null,
  clientHistory: string[]
): Promise<string> {
  const langMap: Record<string, string> = {
    de: 'Deutsch',
    ru: 'Русский',
    ua: 'Українська',
  }

  const langInstruction = language
    ? `Відповідай СТРОГО мовою: ${langMap[language] ?? language}.`
    : 'Відповідай мовою оригінального повідомлення клієнта.'

  const historyContext = clientHistory.length
    ? `Контекст попередньої переписки:\n${clientHistory.join('\n---\n')}\n\n`
    : ''

  const nameHint = clientName ? `Ім'я клієнта: ${clientName}. ` : ''

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0.7,
      system: `Ти — асистент AVGS-коуча. ${langInstruction}

Правила:
- Тон: професійний але теплий.
- Довжина: коротко, як у WhatsApp (не email).
- Не вигадуй деталі яких немає — залишай [...] для заповнення коучем.
- Не давай юридичних консультацій — тільки загальну інформацію.
- Не обіцяй конкретних результатів.

Категорія запиту: ${classification}.`,
      messages: [
        {
          role: 'user',
          content: `${historyContext}${nameHint}Повідомлення клієнта:\n${incomingMessage.slice(0, 1500)}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return ''
    }

    return content.text.trim()
  } catch (error) {
    console.error('[AI Draft] Generation failed:', error)
    return ''
  }
}
