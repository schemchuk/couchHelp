-- Додавання колонки is_read для маркування непрочитаних повідомлень
-- Блок 05 — Inbox UI

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN messages.is_read IS 'Чи прочитане inbound повідомлення коучем';
