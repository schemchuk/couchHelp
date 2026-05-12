-- Ініціалізація схеми бази даних couchHelp
-- Блок 02 — Supabase міграції

-- Розширення для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблиця: tenants (коучі / тенанти)
CREATE TABLE IF NOT EXISTS tenants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id          TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  phone_number_id       TEXT,                    -- Meta phone_number_id
  waba_id               TEXT,                    -- WhatsApp Business Account ID
  access_token_enc      TEXT,                    -- зашифрований токен (заглушка, реалізація Блок 10)
  whatsapp_connected    BOOLEAN DEFAULT FALSE,
  phone_number_source   TEXT DEFAULT 'own',      -- 'own' | 'platform' (platform — майбутня функція, зараз завжди 'own')
  tier                  TEXT DEFAULT 'free',     -- 'free' | 'pro' | 'enterprise' (логіка обмежень не активна до після Фази 1)
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Таблиця: clients (клієнти / ліди)
CREATE TABLE IF NOT EXISTS clients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone                 TEXT NOT NULL,
  name                  TEXT,
  language              TEXT,                    -- 'de' | 'ru' | 'ua' | NULL (NULL = не визначено)
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, phone)
);

-- Таблиця: messages (повідомлення)
CREATE TABLE IF NOT EXISTS messages (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  wamid                 TEXT UNIQUE,             -- Meta message ID (для дедуплікації)
  direction             TEXT NOT NULL,           -- 'inbound' | 'outbound' | 'draft'
  status                TEXT DEFAULT 'received', -- 'received' | 'pending_approval' | 'sent' | 'failed'
  message_type          TEXT NOT NULL,           -- 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker'
  body                  TEXT,                    -- текст повідомлення
  media_id              TEXT,                    -- Meta media ID для не-текстових
  media_url             TEXT,                    -- тимчасовий URL (5 хв, тільки для кешу)
  media_filename        TEXT,
  ai_draft              TEXT,                    -- AI-чернетка відповіді
  ai_classification     TEXT,                    -- результат класифікації
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Таблиця: audit_log (аудит — append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID REFERENCES tenants(id),
  entity_type           TEXT NOT NULL,           -- 'message' | 'client' | 'promise' | 'tenant'
  entity_id             TEXT,
  action                TEXT NOT NULL,           -- 'webhook_received' | 'message_saved' | 'ai_draft_created' | 'message_sent' | ...
  actor                 TEXT NOT NULL,           -- 'system' | 'coach' | clerk_user_id
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Таблиця: promises (обіцянки коуча)
CREATE TABLE IF NOT EXISTS promises (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  message_id            UUID REFERENCES messages(id),
  text                  TEXT NOT NULL,
  due_date              DATE,
  status                TEXT DEFAULT 'open',     -- 'open' | 'done' | 'cancelled'
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Таблиця: templates (шаблони повідомлень)
CREATE TABLE IF NOT EXISTS templates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID REFERENCES tenants(id),  -- NULL = системний шаблон
  language              TEXT NOT NULL,           -- 'de' | 'ru' | 'ua'
  scenario              TEXT NOT NULL,           -- 'greeting' | 'follow_up' | 'appointment' | ...
  subject               TEXT,
  body                  TEXT NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Таблиця: knowledge_items (база знань)
CREATE TABLE IF NOT EXISTS knowledge_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID REFERENCES tenants(id),  -- NULL = глобальна база знань
  type                  TEXT NOT NULL,           -- 'stable' | 'volatile'
  title                 TEXT NOT NULL,
  content               TEXT NOT NULL,
  language              TEXT,                    -- 'de' | 'ru' | 'ua' | NULL (мультимовний)
  tags                  TEXT[] DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Індекси для продуктивності
CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_wamid ON messages(wamid);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_promises_tenant_id ON promises(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promises_client_id ON promises(client_id);
CREATE INDEX IF NOT EXISTS idx_promises_due_date ON promises(due_date);
