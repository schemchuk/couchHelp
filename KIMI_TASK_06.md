# KIMI_TASK_06 — Блок 06: Захист від забутих обіцянок

## Мета
Реалізувати систему "обіцянок коуча" (promises) — коли коуч каже клієнту "надішлю до п'ятниці" або "підготую до зустрічі", AI виявляє це, створює запис у `promises`, і система нагадує коучу про дедлайн.

## Що вже є
- Таблиця `promises` в Supabase (створена в Блоці 02)
- AI pipeline (`runAIPipeline`) класифікує повідомлення і зберігає `ai_classification`
- Inbox UI показує список клієнтів і thread

## Завдання

### 1. Schema — додати поля в `promises`
Перевірити і доповнити таблицю `promises`:
```sql
id uuid PRIMARY KEY
tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE
message_id uuid REFERENCES messages(id)
description TEXT NOT NULL
due_date TIMESTAMPTZ NOT NULL
status TEXT DEFAULT 'pending' -- pending | done | missed
alerted_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()
```

### 2. AI виявлення обіцянок
Розширити `classifyMessage` або додати окремий етап в `runAIPipeline`:
- Після класифікації проаналізувати текст на патерни обіцянок: "підготую до", "надішлю в", "зроблю до", "перевірю до" тощо.
- Якщо знайдено обіцянку — витягнути:
  - Що обіцяють (`description`)
  - До якого терміну (`due_date`) — парсинг дати з тексту (relative: "до п'ятниці" → date; absolute: "до 20.05" → date)
- Створити запис в `promises`.

### 3. Dashboard секція "Горить" 🔥
На головній `/dashboard` додати секцію зверху:
- Показувати promises де `due_date < NOW() + 24h AND status = 'pending'`
- Сортувати за `due_date` ASC
- Кожен пункт — клієнт, опис обіцянки, дедлайн, кнопка "Виконано"

### 4. Inbox індикатор
В `InboxList` для клієнта показувати badge якщо є відкриті promises з `due_date < NOW() + 24h`.

### 5. Alert/нагадування
- При вході на `/dashboard` — якщо є `pending` promises з `due_date < NOW() + 24h` і `alerted_at IS NULL` — показати toast (sonner).
- Оновити `alerted_at = NOW()` щоб не спамити.

### 6. API routes
- `GET /api/promises` — список promises поточного tenant (sandbox: перший tenant)
- `POST /api/promises/:id/done` — позначити як виконане

### 7. RLS
- Policy `promises_tenant_isolation` — як і для messages (sandbox: service role обходить).

## Технічні нюанси
- Парсинг дати з німецького/російського/українського тексту — спрощено: якщо не вдалося визначити точну дату, використати `NOW() + 48h` як default.
- Не блокувати pipeline якщо promise creation fails — логувати в audit_log і продовжити.
- Коментарі в коді — українською.

## Критерії приймання
- [ ] Тестове повідомлення з обіцянкою створює запис в `promises`
- [ ] Секція "Горить" показує наближені дедлайни
- [ ] Кнопка "Виконано" працює
- [ ] Toast з'являється при вході на dashboard
- [ ] TypeScript build PASS
- [ ] Коміт: `feat(promises): додано захист від забутих обіцянок`
