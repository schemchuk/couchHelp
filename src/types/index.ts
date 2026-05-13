export type { Database } from './database'

// UI типи (не БД — в SQL немає відповідних полів/constraint)
export type ClientStatus = 'new' | 'classified' | 'in_work' | 'pause' | 'closed'
export type SupportedLanguage = 'de' | 'ru' | 'ua'
