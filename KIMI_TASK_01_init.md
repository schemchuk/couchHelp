# ЗАВДАННЯ ДЛЯ KIMI — Блок 01: Ініціалізація проекту couchHelp

## Обов'язково прочитати перед роботою
- `PROJECT_CONTEXT.md` — повний контекст проекту
- `CLAUDE.md` — git workflow і правила
- `AGENTS.md` — правила для агентів

---

## Контекст

Проект: **couchHelp** — AI-orchestration layer для коучів по AVGS (державне фінансування бізнесу в Німеччині).
Репозиторій: `github.com/schemchuk/couchHelp`, гілка `master`.
Локальний шлях: `C:\Users\shemc\myVSCodeProjects\couchHelp`
Домен: `couchhelp.click`
Стек: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase, Clerk.

---

## Що потрібно зробити

### 1. Ініціалізація Next.js проекту

Виконай в корені репозиторію:

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

### 2. Встановити залежності

```bash
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  @clerk/nextjs \
  @anthropic-ai/sdk \
  zod \
  date-fns \
  clsx \
  tailwind-merge

npm install -D \
  @types/node \
  supabase
```

### 3. Встановити shadcn/ui

```bash
npx shadcn@latest init
```

При ініціалізації вибрати:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Встановити компоненти:

```bash
npx shadcn@latest add button card badge input textarea label tabs separator scroll-area avatar dropdown-menu toast sonner
```

### 4. Створити структуру папок

Створи наступну структуру (порожні папки — додай `.gitkeep`):

```
src/
  app/
    (auth)/
      sign-in/
        [[...sign-in]]/
          page.tsx
      sign-up/
        [[...sign-up]]/
          page.tsx
    (dashboard)/
      layout.tsx
      dashboard/
        page.tsx
      inbox/
        page.tsx
        [clientId]/
          page.tsx
      clients/
        page.tsx
        [clientId]/
          page.tsx
      knowledge/
        page.tsx
      settings/
        page.tsx
    api/
      webhooks/
        whatsapp/
          route.ts
      ai/
        draft/
          route.ts
        classify/
          route.ts
      integrations/
        .gitkeep
    globals.css
    layout.tsx
    page.tsx

  modules/
    inbox/
      INSTRUCTIONS.md
      components/
        .gitkeep
      services/
        .gitkeep
      types/
        index.ts
      hooks/
        .gitkeep
    integrations/
      INSTRUCTIONS.md
      .gitkeep
    scheduling/
      INSTRUCTIONS.md
      .gitkeep
    learning/
      INSTRUCTIONS.md
      .gitkeep
    knowledge/
      INSTRUCTIONS.md
      components/
        .gitkeep
      services/
        .gitkeep
      types/
        index.ts

  components/
    ui/
      .gitkeep        # shadcn/ui — генерується автоматично
    shared/
      layout/
        Sidebar.tsx
        Header.tsx
        MobileNav.tsx
      client/
        ClientCard.tsx
        StatusBadge.tsx
        LanguageBadge.tsx
      inbox/
        MessageBubble.tsx
        DraftPreview.tsx
        PromiseBanner.tsx

  lib/
    supabase/
      client.ts
      server.ts
      middleware.ts
    anthropic/
      client.ts
    whatsapp/
      client.ts
    utils/
      cn.ts
      language.ts
      date.ts

  types/
    database.ts
    index.ts

  hooks/
    useClient.ts
    useInbox.ts
    usePromises.ts

  middleware.ts
```

### 5. Наповнити файли базовим кодом

#### `src/lib/utils/cn.ts`
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

#### `src/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### `src/lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

#### `src/lib/anthropic/client.ts`
```typescript
import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set')
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})
```

#### `src/lib/whatsapp/client.ts`
```typescript
// WhatsApp Business API client
// Фаза 1 — базова структура, повна реалізація в наступному блоці

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'

export const whatsappConfig = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  apiToken: process.env.WHATSAPP_API_TOKEN!,
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!,
  apiUrl: WHATSAPP_API_URL,
}

export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // TODO: реалізувати в Блоці 02
  throw new Error('Not implemented yet — Block 02')
}
```

#### `src/lib/utils/language.ts`
```typescript
// Визначення мови повідомлення
// Правило: повідомлення < 50 знаків — НЕ вгадуємо, повертаємо null

export type SupportedLanguage = 'de' | 'ru' | 'ua'

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
```

#### `src/lib/utils/date.ts`
```typescript
import { formatDistanceToNow, format, isAfter, addHours } from 'date-fns'
import { de } from 'date-fns/locale'

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: de,
  })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd.MM.yyyy HH:mm')
}

export function isPromiseDueSoon(dueDate: string | Date): boolean {
  return isAfter(addHours(new Date(), 24), new Date(dueDate))
}

export function isPromiseOverdue(dueDate: string | Date): boolean {
  return isAfter(new Date(), new Date(dueDate))
}
```

#### `src/types/database.ts`
```typescript
// Типи БД — відповідають схемі в PROJECT_CONTEXT.md
// Повна версія генерується через: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ClientStatus = 'new' | 'classified' | 'in_work' | 'pause' | 'closed'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageChannel = 'whatsapp' | 'email' | 'phone' | 'zoom'
export type SupportedLanguage = 'de' | 'ru' | 'ua'
export type TenantTier = 'starter' | 'pro' | 'scale'
export type JcOrAa = 'jc' | 'aa' | 'unknown'
export type AuditAction =
  | 'message_sent'
  | 'draft_created'
  | 'approval_given'
  | 'draft_edited'
  | 'draft_rejected'
  | 'status_changed'
  | 'template_used'
  | 'promise_created'
  | 'promise_missed'

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          email: string
          name: string | null
          tier: TenantTier
          language_default: SupportedLanguage
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string | null
          email: string | null
          language_communication: SupportedLanguage | null
          language_documents: SupportedLanguage | null
          language_business: SupportedLanguage | null
          status: ClientStatus
          jc_or_aa: JcOrAa | null
          has_avgs: boolean
          business_idea: string | null
          federal_state: string | null
          has_gewerbe: boolean | null
          next_step: string | null
          next_step_due: string | null
          notes: string | null
          linkedin_url: string | null
          website_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      messages: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          direction: MessageDirection
          channel: MessageChannel
          content: string
          language: SupportedLanguage | null
          ai_draft: boolean
          ai_draft_content: string | null
          template_version: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      audit_log: {
        Row: {
          id: string
          tenant_id: string
          actor: 'human' | 'ai'
          action: AuditAction
          entity_type: string | null
          entity_id: string | null
          template_version: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>
        // Update і Delete навмисно відсутні — audit_log є append-only
      }
      promises: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          message_id: string | null
          description: string
          due_date: string
          status: 'pending' | 'done' | 'missed'
          alerted_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['promises']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['promises']['Insert']>
      }
      templates: {
        Row: {
          id: string
          tenant_id: string
          name: string
          language: SupportedLanguage
          scenario: 'first_contact' | 'follow_up' | 'qualification' | 'rejection' | 'pause'
          content: string
          version: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['templates']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['templates']['Insert']>
      }
      knowledge_items: {
        Row: {
          id: string
          tenant_id: string
          category: 'stable' | 'volatile'
          type: 'template' | 'sop' | 'legal' | 'program' | 'case'
          title: string
          content: string
          source: string | null
          valid_until: string | null
          last_verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['knowledge_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['knowledge_items']['Insert']>
      }
    }
  }
}
```

#### `src/types/index.ts`
```typescript
export type { Database, ClientStatus, MessageDirection, MessageChannel, SupportedLanguage, TenantTier, JcOrAa, AuditAction } from './database'
```

#### `src/middleware.ts`
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/whatsapp(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

#### `src/app/layout.tsx`
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'couchHelp',
  description: 'AI-помічник для коучів по AVGS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="de">
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
```

#### `src/app/page.tsx`
```typescript
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  } else {
    redirect('/sign-in')
  }
}
```

#### `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <SignIn />
    </div>
  )
}
```

#### `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
```typescript
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <SignUp />
    </div>
  )
}
```

#### `src/app/(dashboard)/layout.tsx`
```typescript
import { Sidebar } from '@/components/shared/layout/Sidebar'
import { Header } from '@/components/shared/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

#### `src/app/(dashboard)/dashboard/page.tsx`
```typescript
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      {/* Блок 03: секції Горить / Зустрічі / Нові */}
      <p className="text-slate-500">Coming in Block 03</p>
    </div>
  )
}
```

#### `src/app/(dashboard)/inbox/page.tsx`
```typescript
export default function InboxPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Inbox</h1>
      {/* Блок 03: WhatsApp-Inbox з AI-чернетками */}
      <p className="text-slate-500">Coming in Block 03</p>
    </div>
  )
}
```

#### `src/app/api/webhooks/whatsapp/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'

// GET — верифікація webhook від Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (
    mode === 'subscribe' &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// POST — вхідні повідомлення від WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // TODO: Блок 02 — обробка вхідних повідомлень
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2))

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
```

#### `src/app/api/ai/draft/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // TODO: Блок 02 — генерація AI-чернетки
  return NextResponse.json({ draft: null, message: 'Coming in Block 02' })
}
```

#### `src/components/shared/layout/Sidebar.tsx`
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  BookOpen,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inbox', href: '/inbox', icon: MessageSquare },
  { name: 'Клієнти', href: '/clients', icon: Users },
  { name: 'База знань', href: '/knowledge', icon: BookOpen },
  { name: 'Налаштування', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <span className="text-xl font-bold text-teal-700">couchHelp</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
```

#### `src/components/shared/layout/Header.tsx`
```typescript
import { UserButton } from '@clerk/nextjs'

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div />
      <UserButton afterSignOutUrl="/sign-in" />
    </header>
  )
}
```

#### `src/components/shared/client/StatusBadge.tsx`
```typescript
import { Badge } from '@/components/ui/badge'
import type { ClientStatus } from '@/types'
import { cn } from '@/lib/utils/cn'

const STATUS_CONFIG: Record<ClientStatus, { label: string; className: string }> = {
  new:        { label: 'Новий',           className: 'bg-slate-100 text-slate-700' },
  classified: { label: 'Класифіковано',   className: 'bg-blue-100 text-blue-700' },
  in_work:    { label: 'В роботі',        className: 'bg-green-100 text-green-700' },
  pause:      { label: 'Пауза',           className: 'bg-amber-100 text-amber-700' },
  closed:     { label: 'Закрито',         className: 'bg-slate-100 text-slate-400' },
}

export function StatusBadge({ status }: { status: ClientStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
```

#### `src/components/shared/client/LanguageBadge.tsx`
```typescript
import { Badge } from '@/components/ui/badge'
import type { SupportedLanguage } from '@/types'

const LANG_CONFIG: Record<SupportedLanguage, { label: string; flag: string }> = {
  de: { label: 'DE', flag: '🇩🇪' },
  ru: { label: 'RU', flag: '🇷🇺' },
  ua: { label: 'UA', flag: '🇺🇦' },
}

export function LanguageBadge({ language }: { language: SupportedLanguage }) {
  const config = LANG_CONFIG[language]
  return (
    <Badge variant="outline" className="font-mono text-xs">
      {config.flag} {config.label}
    </Badge>
  )
}
```

#### `src/modules/inbox/INSTRUCTIONS.md`
```markdown
# Модуль: inbox

## Призначення
WhatsApp-Inbox з AI-чернетками. Фаза 1 продукту couchHelp.

## Що робить цей модуль
- Отримує вхідні повідомлення через WhatsApp Business API webhook
- Зберігає в таблицю `messages`
- Генерує AI-чернетку відповіді через Anthropic API
- Показує чергу на approval коуча
- Відправляє повідомлення тільки після явного approval

## Що цей модуль НЕ робить
- Не відправляє повідомлення автоматично
- Не оцінює перспективність лідів алгоритмічно
- Не проводить бот-скринінг

## Файли
- `components/` — React-компоненти модуля
- `services/` — бізнес-логіка, виклики API
- `types/index.ts` — типи модуля
- `hooks/` — React-хуки

## Залежності
- `src/lib/supabase/` — доступ до БД
- `src/lib/anthropic/` — AI-чернетки
- `src/lib/whatsapp/` — відправка повідомлень
- `src/types/database.ts` — типи БД

## Audit log
Кожна дія обов'язково пишеться в таблицю `audit_log`.
Дивись `PROJECT_CONTEXT.md` розділ 12 для переліку дій.
```

#### `.env.local` (створи файл, не комітити)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# WhatsApp Business API
WHATSAPP_API_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_random_verify_token

# App
NEXT_PUBLIC_APP_URL=https://couchhelp.click
```

#### `.env.local` додати в `.gitignore`
Переконайся що в `.gitignore` є рядок:
```
.env.local
.env*.local
```

### 6. Перевірити що проект запускається

```bash
npm run dev
```

Має відкритись на `http://localhost:3000` і редіректити на `/sign-in`.

---

## Результат блоку

Після виконання має бути:

- [ ] Next.js 14 з App Router запускається без помилок
- [ ] Структура папок відповідає схемі вище
- [ ] TypeScript компілюється без помилок (`npm run build`)
- [ ] shadcn/ui компоненти встановлені
- [ ] Sidebar з навігацією відображається
- [ ] Auth через Clerk підключений (редірект на `/sign-in`)
- [ ] WhatsApp webhook endpoint відповідає на GET верифікацію
- [ ] `.env.local` НЕ в репозиторії

---

## Git коміти після блоку

```bash
git add .
git commit -m "chore: init Next.js 14 project with App Router and TypeScript"

git add src/lib/ src/types/ src/middleware.ts
git commit -m "feat(core): add Supabase, Anthropic, WhatsApp clients and DB types"

git add src/components/
git commit -m "feat(ui): add Sidebar, Header, StatusBadge, LanguageBadge components"

git add src/app/
git commit -m "feat(app): add auth pages, dashboard layout, API route stubs"

git add src/modules/
git commit -m "chore(modules): add module structure with INSTRUCTIONS.md files"
```

---

## Наступний блок (Блок 02)

Буде: підключення Supabase (міграції, RLS), повна WhatsApp webhook обробка, AI-класифікація повідомлень, генерація чернеток.

Чекай завдання `KIMI_TASK_02_supabase_whatsapp.md`.
