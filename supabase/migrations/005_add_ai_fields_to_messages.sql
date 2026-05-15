-- Додавання полів для AI-чернеток та зв'язку між повідомленнями
-- Блок 04 — code review: окремий запис чернетки

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES messages(id);

COMMENT ON COLUMN messages.ai_generated IS 'TRUE якщо повідомлення згенеровано AI (чернетка)';
COMMENT ON COLUMN messages.parent_message_id IS 'ID вхідного повідомлення, до якого створено чернетку';
