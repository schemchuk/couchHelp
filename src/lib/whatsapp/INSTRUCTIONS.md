# Модуль: WhatsApp інтеграція

## Що робить

Інтеграційний шар для WhatsApp Business API (Meta).
Відповідає за:
- Верифікацію webhook підписів (X-Hub-Signature-256)
- Парсинг вхідних повідомлень і статусів з webhook payload
- Відправку повідомлень (заглушка до Блоку 04)

## Файли

| Файл | Призначення |
|---|---|
| `types.ts` | TypeScript типи для WhatsApp webhook payload (Message, StatusUpdate, Contact, тощо) |
| `parser.ts` | Функції для витягування даних з payload: extractMessages, extractPhoneNumberId, extractSenderPhone, extractSenderName, isInboundMessage |
| `signature.ts` | Верифікація підпису webhook через HMAC-SHA256 з timing-safe comparison |
| `client.ts` | Клієнт для WhatsApp Business API (зараз — заглушка sendWhatsAppMessage) |

## Залежності

- `crypto` (Node.js built-in) — для HMAC
- `next/server` — webhook route handler
- Без зовнішніх HTTP-клієнтів (реалізація в Блоці 04)

## Правила

1. **Підпис завжди перевіряється** — якщо WHATSAPP_APP_SECRET не встановлено, повертається 500 (не bypass)
2. **Не блокуємо Meta** — відповідь 200 OK йде одразу, фонова обробка через `after()` з `next/server`
3. **Дедуплікація по wamid** — через `ON CONFLICT (wamid) DO NOTHING`, не SELECT+INSERT
4. **Не змінювати GET handler** — він обробляє верифікацію webhook від Meta
5. **timingSafeEqual** — обов'язково для порівняння підписів (захист від timing attacks)
