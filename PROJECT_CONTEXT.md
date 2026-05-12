# PROJECT_CONTEXT.md
# couchHelp — Контекст проекту для AI-агентів

> Цей файл є обов'язковим до прочитання перед будь-якою роботою з репозиторієм.
> Останнє оновлення: травень 2026

---

## 1. Ідентифікація проекту

| Параметр | Значення |
|---|---|
| Назва | couchHelp |
| Домен | couchhelp.click |
| Репозиторій | github.com/schemchuk/couchHelp |
| Гілка | master |
| Деплой | Vercel |

---

## 2. Суть продукту

couchHelp — це **AI-orchestration layer** для коучів, які працюють з державними програмами фінансування бізнесу в Німеччині (AVGS, Gründungszuschuss, Einstiegsgeld, §16c).

**Це не CRM.** Продукт інтегрується з інструментами, які коуч вже використовує:
- WhatsApp (основний канал з клієнтами)
- Bitrix24 (корпоративний CRM)
- Obsidian (особиста база знань)
- Google Calendar

**Головна цінність:** AI бере на себе операційну рутину, коуч контролює через approval-чергу.

---

## 3. Цільова аудиторія

Практикуючі коучі по AVGS в DACH-регіоні. Працюють з клієнтами на трьох мовах: DE / RU / UA. Специфіка: AVGS-коучинг підлягає аудиту DEKRA, TÜV, Bundesagentur.

---

## 4. Технічний стек

```
Frontend:     Next.js 14 (App Router) — строго, не Pages Router
UI:           Tailwind CSS + shadcn/ui
Auth:         Clerk (multi-tenant)
БД:           Supabase (Postgres + Row Level Security)
AI:           Anthropic API (Claude)
WhatsApp:     WhatsApp Business API (Meta / 360dialog)
Хостинг:      Vercel → couchhelp.click
Мова коду:    TypeScript строго (no any)
```

---

## 5. Архітектура — модульна структура

```
/src
  /app                    # Next.js App Router
    /dashboard            # Головний екран коуча
    /inbox                # WhatsApp-Inbox (Фаза 1)
    /clients              # Картки клієнтів
    /knowledge            # База знаний
    /settings             # Налаштування коуча
    /api                  # API routes
      /webhooks
        /whatsapp         # Webhook від WhatsApp API
      /ai                 # AI endpoints
      /integrations       # Bitrix24, Obsidian, Calendar
  /modules
    /inbox                # Модуль 1: WhatsApp-Inbox (АКТИВНИЙ)
    /integrations         # Модуль 2: Bitrix24 + Obsidian (Фаза 2)
    /scheduling           # Модуль 3: авто-терминування (Фаза 3)
    /learning             # Модуль 4: self-learning (Фаза 4)
    /knowledge            # База знаний
  /components
    /ui                   # shadcn/ui компоненти
    /shared               # Спільні компоненти
  /lib
    /supabase             # Supabase client + types
    /anthropic            # Anthropic API client
    /whatsapp             # WhatsApp API client
    /utils                # Утиліти
  /types                  # TypeScript типи
  /hooks                  # React hooks
```

---

## 6. Модель даних — ключові таблиці

### tenants (коучі)
```sql
id uuid PRIMARY KEY
email text UNIQUE NOT NULL
name text
tier text DEFAULT 'starter'  -- starter | pro | scale
language_default text DEFAULT 'de'
created_at timestamptz DEFAULT now()
```

### clients (ліди/клієнти коуча)
```sql
id uuid PRIMARY KEY
tenant_id uuid REFERENCES tenants(id)
name text NOT NULL
phone text
email text
language_communication text  -- de | ru | ua
language_documents text      -- de | ru | ua
language_business text       -- de | ru | ua
status text                  -- new | classified | in_work | pause | closed
jc_or_aa text                -- jc | aa | unknown
has_avgs boolean DEFAULT false
business_idea text
federal_state text
has_gewerbe boolean          -- зареєстрований бізнес
next_step text
next_step_due timestamptz
notes text
linkedin_url text
website_url text
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

### messages (повідомлення)
```sql
id uuid PRIMARY KEY
tenant_id uuid REFERENCES tenants(id)
client_id uuid REFERENCES clients(id)
direction text NOT NULL       -- inbound | outbound
channel text NOT NULL         -- whatsapp | email | phone | zoom
content text NOT NULL
language text
ai_draft boolean DEFAULT false
ai_draft_content text
template_version text
sent_at timestamptz
created_at timestamptz DEFAULT now()
```

### audit_log (КРИТИЧНО — append-only)
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id uuid REFERENCES tenants(id)
actor text NOT NULL           -- human | ai
action text NOT NULL          -- message_sent | status_changed | approval_given | template_used | draft_rejected
entity_type text              -- client | message | template
entity_id uuid
template_version text
metadata jsonb
created_at timestamptz DEFAULT now()
-- ВАЖЛИВО: NO UPDATE, NO DELETE дозволені на цій таблиці
```

### promises (обіцянки коуча клієнту)
```sql
id uuid PRIMARY KEY
tenant_id uuid REFERENCES tenants(id)
client_id uuid REFERENCES clients(id)
message_id uuid REFERENCES messages(id)
description text NOT NULL
due_date timestamptz NOT NULL
status text DEFAULT 'pending'  -- pending | done | missed
alerted_at timestamptz
created_at timestamptz DEFAULT now()
```

### templates (шаблони повідомлень)
```sql
id uuid PRIMARY KEY
tenant_id uuid REFERENCES tenants(id)
name text NOT NULL
language text NOT NULL        -- de | ru | ua
scenario text                 -- first_contact | follow_up | qualification | rejection | pause
content text NOT NULL
version integer DEFAULT 1
is_active boolean DEFAULT true
created_at timestamptz DEFAULT now()
```

### knowledge_items (база знаний)
```sql
id uuid PRIMARY KEY
tenant_id uuid REFERENCES tenants(id)
category text                 -- stable | volatile
type text                     -- template | sop | legal | program | case
title text NOT NULL
content text NOT NULL
source text
valid_until timestamptz       -- для volatile: коли перевірити
last_verified_at timestamptz
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

---

## 7. Row Level Security — обов'язково

Кожна таблиця з `tenant_id` повинна мати RLS policy:

```sql
-- Приклад для clients:
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON clients
  USING (tenant_id = (
    SELECT id FROM tenants WHERE email = auth.email()
  ));
```

**audit_log** — тільки INSERT, ніяких UPDATE/DELETE:
```sql
CREATE POLICY "audit_insert_only" ON audit_log
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT id FROM tenants WHERE email = auth.email())
  );
-- Без SELECT policy для звичайних користувачів через app
```

---

## 8. Фази розробки

| Фаза | Назва | Статус |
|---|---|---|
| 1 | WhatsApp-Inbox з AI-чернетками | 🔴 В розробці |
| 2 | Інтеграція Bitrix24 + Obsidian | ⬜ Заплановано |
| 3 | Авто-кваліфікація + планування зустрічей | ⬜ Заплановано |
| 4 | Self-learning шар (AI-копія коуча) | ⬜ Майбутнє |

---

## 9. Фаза 1 — детальна специфікація

### Що будується
WhatsApp-Inbox: коуч бачить вхідні повідомлення від клієнтів, для кожного AI підготував чернетку відповіді. Коуч натискає "Відправити" / "Змінити" / "Відхилити". Ніякої автоматичної відправки.

### Головний екран (dashboard)
Три секції зверху:
1. **Горить** — clients де `promises.due_date < now() + 24h AND status = 'pending'`
2. **Зустрічі сьогодні** — з індикатором готовності досьє
3. **Нові за ніч** — `messages.created_at > now() - 8h AND direction = 'inbound'`

Нижче: лента розмов (список зліва + картка справа).

### Статуси клієнта — чотири, не три
- `new` — не класифіковано
- `classified` — класифіковано, не відповіли
- `in_work` — активна робота
- `pause` — чекає (документи, статус, прописка) — **критично, тут клієнти губляться**
- `closed` — завершено

### AI-логіка для вхідного повідомлення
1. Визначення мови:
   - Якщо < 50 знаків → НЕ вгадуємо, питаємо (три кнопки: DE / RU / UA)
   - Якщо ≥ 50 знаків → auto-detect + флаг при змішаній лексиці
2. Класифікація типу: `first_contact | follow_up | document_question | status_change`
3. Підтяжка контексту клієнта + попередня переписка
4. Генерація чернетки на мові клієнта за шаблонами коуча
5. Підсвітка незаповнених змінних `{назва_програми}`, `{дата}` — кнопка Відправити неактивна якщо є незаповнені змінні

### Захист від забутих обіцянок
- AI сканує вхідні/вихідні на патерни обіцянок: "підготую до", "надішлю в", "зроблю до"
- Пропонує створити запис в `promises`
- На головному екрані promises з `due_date < now() + 24h` завжди зверху
- Алерт за 24 години

### Досьє перед зустріччю (одна сторінка)
- Коротка біографія + публічний профіль
- Ідея бізнесу + відкриті питання (не "вердикт")
- Статус JC/AA + підходяща програма
- Резюме переписки
- Список кваліфікуючих питань для зустрічі

---

## 10. Що НЕ робимо (принципово)

```
❌ Автоматична оцінка перспективності лідів (алгоритмічний скоринг)
❌ AI відправляє повідомлення без approval коуча (Фаза 1)
❌ Бот-скринінг замість першого контакту коуча
❌ Автоматичні відмови клієнтам
❌ Scraping соціальних мереж за межами LinkedIn
❌ Генерація юридичних текстів — тільки retrieval з бази
❌ Дублювання Obsidian — тільки sync через інтеграцію (Фаза 2)
```

---

## 11. Мовна логіка — тришаровість

Кожен клієнт має три мовних поля:
- `language_communication` — мова листування з коучем
- `language_documents` — мова для ведомств
- `language_business` — мова бізнес-планування

Шаблони повідомлень — окремо для кожної мови.

---

## 12. Audit Trail — структура (КРИТИЧНО)

Кожна дія в системі пишеться в `audit_log`. Це вимога аудиту DEKRA/TÜV/Bundesagentur для AVGS-провайдерів.

Дії що логуються обов'язково:
- `message_sent` — будь-яке відправлене повідомлення
- `draft_created` — AI створив чернетку
- `approval_given` — коуч схвалив
- `draft_edited` — коуч змінив перед відправкою
- `draft_rejected` — коуч відхилив
- `status_changed` — зміна статусу клієнта
- `template_used` — який шаблон і яка версія
- `promise_created` — створено обіцянку
- `promise_missed` — обіцянку не виконано вчасно

---

## 13. Бізнес-модель (SaaS підписки)

> ⚠️ **Монетизація не реалізується в поточних фазах розробки.**
> Заплановано до реалізації після завершення Фази 1.
> Архітектура закладається з урахуванням майбутніх тарифів — поле `tier` в таблиці `tenants` присутнє, але логіка обмежень не активна.

**Планова модель (референс для архітектури):**
- `starter` — базові функції, ліміти по лідах
- `pro` — без лімітів, свої шаблони, інтеграції
- `scale` — все вище + white-label елементи

Multi-tenant: кожен коуч — окремий tenant, повна ізоляція даних через RLS.

---

## 14. Змінні середовища (структура, без значень)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Anthropic
ANTHROPIC_API_KEY=

# WhatsApp Business API
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://couchhelp.click
```

---

## 15. Git workflow

- Коміт після кожного завершеного блоку
- Формат: `feat(module): опис` / `fix(module): опис` / `chore: опис`
- Приклади:
  - `feat(inbox): add WhatsApp webhook handler`
  - `feat(db): add audit_log table with RLS`
  - `chore: init Next.js project structure`
- Гілка: `master`
- Перед початком роботи: прочитати `CLAUDE.md` та `AGENTS.md`

---

## 16. Правила для агентів

1. Перед роботою прочитати: `PROJECT_CONTEXT.md`, `CLAUDE.md` або `AGENTS.md`
2. TypeScript строго — `no any`, всі типи явні
3. Кожен новий модуль має `INSTRUCTIONS.md` у своїй папці
4. Не читати `.env` файли
5. Запитувати перед запуском додаткових агентів
6. Коміт після кожного завершеного блоку
7. RLS — обов'язково на кожній таблиці з `tenant_id`
8. audit_log — append-only, ніяких UPDATE/DELETE

---

*Цей файл оновлюється при кожному значущому архітектурному рішенні.*
