-- Додавання колонки transcription для зберігання AI-транскрипції аудіо
-- Блок 04 — AI pipeline

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS transcription TEXT;

COMMENT ON COLUMN messages.transcription IS 'AI-транскрипція аудіо повідомлення (Whisper)';
