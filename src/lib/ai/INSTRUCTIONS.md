# Модуль: AI обробка (Блок 04)

## Призначення

AI-pipeline для вхідних повідомлень коуча:
- Транскрипція голосових повідомлень (Whisper API)
- Класифікація запиту клієнта (тип, тон, мова, обіцянки)
- Генерація чернетки відповіді (draft) з урахуванням контексту
- Логування всіх операцій в audit_log

## Стек

- Anthropic API (Claude 3 Haiku) — класифікація та чернетки
- OpenAI Whisper API — транскрипція аудіо
- Supabase (service_role) — збереження результатів

## Файлова структура

| Файл | Призначення |
|---|---|
| `types.ts` | Спільні TypeScript-типи: ClassificationResult, DraftResult, TranscriptionResult |
| `classify.ts` | Класифікація повідомлення через Claude |
| `draft.ts` | Генерація чернетки відповіді через Claude |
| `transcribe.ts` | Транскрипція аудіо через Whisper (або заглушка без OPENAI_API_KEY) |
| `pipeline.ts` | Оркестратор: transcribe → classify → draft → INSERT/UPDATE messages + audit_log |
| `prompts/classify.ts` | System prompt для класифікації |
| `prompts/draft.ts` | System prompt для генерації чернетки (динамічний, залежить від класифікації) |

## Правила поведінки

1. **AI не відправляє без approval** (Фаза 1) — чернетка створюється як окремий запис `messages` з `direction='draft'`.
2. **Мова < 50 знаків → null** — не вгадуємо мову для коротких повідомлень.
3. **Транскрипція аудіо** — якщо `OPENAI_API_KEY` відсутній, повертається заглушка.
4. **Whisper потребує прямого URL** — для аудіо від Meta потрібен розшифрований `access_token` (реалізація в Блоці 10).
5. **Всі помилки логуються в audit_log** — action: `ai_processing_failed`, не кидається вище.
6. **Supabase через service_role** — AI-обробка відбувається в фоні, поза сесією користувача.

## Змінні середовища

```env
# Anthropic
ANTHROPIC_API_KEY=

# OpenAI (Whisper)
OPENAI_API_KEY=
```

## Приклади

### Класифікація

```typescript
import { classifyMessage } from '@/lib/ai/classify'

const result = await classifyMessage('Hallo, ich interessiere mich für AVGS...', [])
// result: { type: 'new_lead', tone: 'neutral', language: 'de', hasPromise: false, confidence: 0.95 }
```

### Генерація чернетки

```typescript
import { generateDraft } from '@/lib/ai/draft'

const draft = await generateDraft(incomingText, classification, 'Anna', history)
// draft: { text: '...', language: 'de', model: 'claude-3-haiku...', promptTokens: 120, completionTokens: 80 }
```

### Pipeline

```typescript
import { runAIPipeline } from '@/lib/ai/pipeline'

await runAIPipeline({
  messageId: 'uuid',
  tenantId: 'uuid',
  clientId: 'uuid',
  messageType: 'text',
  messageText: '...',
  mediaUrl: null,
  clientName: 'Anna',
  clientHistory: ['...'],
})
```
