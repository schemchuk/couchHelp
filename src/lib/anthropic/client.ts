import Anthropic from '@anthropic-ai/sdk'

/**
 * Lazy-ініціалізація клієнта Anthropic.
 * Не кидає помилку на етапі білду — тільки при реальному використанні.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
})
