import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import { detectLanguage } from './language'
import { classifyMessage } from './classifier'
import { generateDraft } from './draft'

interface ProcessWithAIParams {
  messageId: string
  tenantId: string
  clientId: string
  messageText: string
  clientLanguage: string | null
  clientName: string | null
  clientHistory: string[]
}

/**
 * Оркестратор AI-обробки вхідного повідомлення.
 *
 * Послідовність:
 * 1. detectLanguage → якщо нова мова → оновити clients.language
 * 2. classifyMessage
 * 3. generateDraft
 * 4. UPDATE messages SET ai_draft, ai_classification
 * 5. INSERT audit_log (action: 'ai_draft_created')
 * 6. При будь-якій помилці → INSERT audit_log (action: 'ai_processing_failed')
 *    Не кидати виключення вище — webhook вже відповів 200.
 */
export async function processWithAI(
  params: ProcessWithAIParams
): Promise<void> {
  const {
    messageId,
    tenantId,
    clientId,
    messageText,
    clientLanguage,
    clientName,
    clientHistory,
  } = params

  const supabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Визначення мови
    const detectedLang = await detectLanguage(messageText, clientLanguage)

    // Якщо мова нова — оновити клієнта
    if (detectedLang && !clientLanguage) {
      await supabase
        .from('clients')
        .update({ language: detectedLang })
        .eq('id', clientId)
    }

    const effectiveLanguage = detectedLang ?? clientLanguage

    // 2. Класифікація
    const classification = await classifyMessage(
      messageText,
      effectiveLanguage as 'de' | 'ru' | 'ua' | null,
      clientHistory
    )

    // 3. Генерація чернетки
    const draft = await generateDraft(
      messageText,
      classification.category,
      effectiveLanguage as 'de' | 'ru' | 'ua' | null,
      clientName,
      clientHistory
    )

    // 4. Зберегти результати AI в messages
    const { error: updateError } = await supabase
      .from('messages')
      .update({
        ai_draft: draft || null,
        ai_classification: JSON.stringify(classification),
      })
      .eq('id', messageId)

    if (updateError) {
      console.error('[AI Processor] Failed to update message:', updateError)
      await logAudit(tenantId, 'ai_processing_failed', {
        message_id: messageId,
        stage: 'update_message',
        error: updateError.message,
      })
      return
    }

    // 5. Записати успіх в audit_log
    await logAudit(tenantId, 'ai_draft_created', {
      message_id: messageId,
      client_id: clientId,
      classification: classification.category,
      confidence: classification.confidence,
      language: effectiveLanguage,
      draft_length: draft.length,
    })
  } catch (error) {
    // 6. При будь-якій помилці — логуємо і виходимо мовчки
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[AI Processor] Processing failed:', errorMessage)

    await logAudit(tenantId, 'ai_processing_failed', {
      message_id: messageId,
      client_id: clientId,
      error: errorMessage,
    })
  }
}

// ============================================================
// Допоміжна функція для audit_log
// ============================================================
async function logAudit(
  tenantId: string,
  action: string,
  metadata: Record<string, Json>
): Promise<void> {
  const supabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    entity_type: 'message',
    action,
    actor: 'system',
    metadata,
  })
}
