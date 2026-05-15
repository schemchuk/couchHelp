/**
 * AI-модуль — спільні типи для класифікації, чернеток та транскрипції.
 *
 * Блок 04 — AI pipeline
 */

/** Тип повідомлення за наміром клієнта */
export type MessageType = 'new_lead' | 'existing_client' | 'spam' | 'unclear'

/** Емоційний тон повідомлення */
export type MessageTone = 'neutral' | 'urgent' | 'positive' | 'negative'

/** Підтримувані мови спілкування */
export type SupportedLanguage = 'de' | 'ru' | 'ua' | 'en'

/**
 * Результат класифікації вхідного повідомлення.
 */
export interface ClassificationResult {
  /** Тип запиту */
  type: MessageType
  /** Емоційний тон */
  tone: MessageTone
  /** Визначена мова (null якщо текст < 50 символів) */
  language: SupportedLanguage | null
  /** Чи містить текст обіцянку коуча */
  hasPromise: boolean
  /** Впевненість класифікатора, 0–1 */
  confidence: number
}

/**
 * Результат генерації AI-чернетки.
 */
export interface DraftResult {
  /** Текст чернетки */
  text: string
  /** Мова чернетки */
  language: SupportedLanguage
  /** Модель, що згенерувала відповідь */
  model: string
  /** Кількість токенів prompt */
  promptTokens: number
  /** Кількість токенів completion */
  completionTokens: number
}

/**
 * Результат транскрипції аудіо через Whisper.
 */
export interface TranscriptionResult {
  /** Розпізнаний текст */
  text: string
  /** Визначена мова (якщо доступна) */
  language: SupportedLanguage | null
  /** Тривалість аудіо в секундах */
  durationSeconds: number
}
