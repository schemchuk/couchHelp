// Визначення мови повідомлення
// Правило: повідомлення < 50 знаків — НЕ вгадуємо, повертаємо null

import type { SupportedLanguage } from '@/types'

export type { SupportedLanguage }

export function detectLanguage(text: string): SupportedLanguage | null {
  if (text.trim().length < 50) {
    return null // Занадто коротке — питаємо у коуча
  }

  // Базова евристика — буде замінена на AI-класифікацію в Блоці 02
  const uaMarkers = ['що', 'як', 'для', 'але', 'також', 'тому', 'якщо', 'через', 'після']
  const ruMarkers = ['что', 'как', 'для', 'но', 'также', 'потому', 'если', 'через', 'после']
  const deMarkers = ['ich', 'sie', 'und', 'der', 'die', 'das', 'für', 'mit', 'auf']

  const lower = text.toLowerCase()

  const uaScore = uaMarkers.filter(m => lower.includes(m)).length
  const ruScore = ruMarkers.filter(m => lower.includes(m)).length
  const deScore = deMarkers.filter(m => lower.includes(m)).length

  if (deScore > ruScore && deScore > uaScore) return 'de'
  if (uaScore > ruScore) return 'ua'
  if (ruScore > 0) return 'ru'

  return null // Незрозуміло — питаємо
}

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  de: 'Deutsch',
  ru: 'Русский',
  ua: 'Українська',
}
