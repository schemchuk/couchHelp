# Модуль: AI обробка

## Що робить

Оркестрація викликів Anthropic API (Claude) для обробки вхідних повідомлень коуча.
Відповідає за:
- Визначення мови повідомлення (detectLanguage)
- Класифікацію запиту клієнта (classifyMessage)
- Генерацію AI-чернетки відповіді (generateDraft)
- Оркестрацію всього pipeline (processWithAI)

## Файли

| Файл | Призначення |
|---|---|
| `language.ts` | Визначення мови тексту через Anthropic API. Правило: < 50 знаків → null (не вгадуємо) |
| `classifier.ts` | Класифікація повідомлення в категорії: new_lead, document_request, appointment, follow_up, other |
| `draft.ts` | Генерація чернетки відповіді мовою клієнта. Тон: професійний але теплий. Не вигадує деталі — залишає [...] |
| `processor.ts` | Оркестратор: detectLanguage → classifyMessage → generateDraft → UPDATE messages → INSERT audit_log. Не кидає виключень (webhook вже відповів 200) |

## Залежності

- `@/lib/anthropic/client` — ініціалізований клієнт Anthropic
- `@/types/database` — типи БД для Supabase запитів
- `@supabase/supabase-js` — service_role клієнт для запису ai_draft / ai_classification

## Правила

1. **AI не відправляє без approval** (Фаза 1) — тільки генерація чернетки, відправка через UI коуча
2. **Мова < 50 знаків → null** — detectLanguage повертає null для коротких повідомлень
3. **Не змінювати промпти без узгодження** — classifier, draft, language system prompts затверджені
4. **Не додавати retry/timeout** — окремий блок, не цей модуль
5. **Всі помилки логуються в audit_log** — action: 'ai_processing_failed', не кидається вище
6. **Supabase через service_role** — AI-обробка відбувається в фоні, поза сесією користувача
