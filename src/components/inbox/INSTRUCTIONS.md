# Модуль: Inbox UI (Блок 05)

## Призначення

Інтерфейс WhatsApp-Inbox для коуча: список вхідних повідомлень, переписка з клієнтом, управління AI-чернетками.

## Стек

- Next.js App Router (Server + Client Components)
- Tailwind CSS + shadcn/ui
- Supabase (real-time підписки)
- TypeScript strict

## Файлова структура

| Файл | Тип | Призначення |
|---|---|---|
| `ClassificationBadge.tsx` | Server | Бейдж типу повідомлення |
| `ToneBadge.tsx` | Server | Бейдж тону повідомлення |
| `AudioTranscription.tsx` | Server | Блок транскрипції аудіо |
| `InboxItem.tsx` | Server | Елемент списку inbox |
| `InboxSkeleton.tsx` | Server | Skeleton-завантажувач |
| `InboxList.tsx` | Client | Список із групуванням по клієнту + real-time |
| `MessageThread.tsx` | Client | Стрічка діалогу + DraftCard |
| `DraftCard.tsx` | Client | Керування AI-чернеткою (Approve/Edit/Discard) |
| `InboxLayout.tsx` | Client | Desktop split-view / mobile navigation |

## Правила

1. **Server Components** для чистої презентації, **Client Components** тільки для інтерактивності.
2. **Real-time** — `InboxList` і `MessageThread` підписані на `postgres_changes` для таблиці `messages`.
3. **i18n** — всі рядки через `src/lib/i18n/de.ts`.
4. **Mobile-first** — кліки достатньо великі, на мобільному список → перехід на `[clientId]`.
5. **Audit** — кожна дія з draft (approve/edit/discard) пишеться в `audit_log`.

## Залежності

- `@/lib/supabase/client` — browser client для real-time та mutations
- `@/lib/i18n/de` — німецька локалізація
- `@/lib/ai/types` — типи класифікації
- shadcn/ui: Badge, Button, Card, ScrollArea, Skeleton, Textarea
