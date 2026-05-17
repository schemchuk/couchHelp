import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import type { WhatsAppMessageType } from '@/lib/whatsapp/types'
import { transcribeAudio } from './transcribe'
import { classifyMessage } from './classify'
import { generateDraft } from './draft'

interface RunAIPipelineParams {
  messageId: string
  tenantId: string
  clientId: string
  messageType: WhatsAppMessageType
  messageText: string | null
  mediaUrl: string | null
  clientName: string | null
  clientHistory: string[]
}

/**
 * Головний AI-pipeline для вхідного повідомлення.
 *
 * Логіка:
 * 1. Якщо messageType === 'audio' та є mediaUrl → transcribe() →
 *    зберегти транскрипцію в messages.transcription
 * 2. classify(text) → зберегти ClassificationResult в message.ai_classification
 * 3. draft(text, classification) → створити новий message з direction='draft'
 * 4. Всі дії логуються в audit_log
 *
 * Не кидає виключень вгору — webhook вже відповів 200.
 *
 * @param params — параметри pipeline
 */
export async function runAIPipeline(params: RunAIPipelineParams): Promise<void> {
  const {
    messageId,
    tenantId,
    clientId,
    messageType,
    messageText,
    mediaUrl,
    clientName,
    clientHistory,
  } = params

  const supabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let textForClassification = messageText ?? ''
  let transcriptionText: string | null = null

  try {
    // 1. Транскрипція аудіо
    if (messageType === 'audio' && mediaUrl) {
      const transcription = await transcribeAudio(mediaUrl)
      transcriptionText = transcription.text
      textForClassification = transcription.text

      const { error: transError } = await supabase
        .from('messages')
        .update({ transcription: transcriptionText })
        .eq('id', messageId)

      if (transError) {
        console.error('[AI Pipeline] Помилка збереження транскрипції:', transError)
        await logAudit(tenantId, 'ai_processing_failed', {
          message_id: messageId,
          stage: 'save_transcription',
          error: transError.message,
        })
      } else {
        await logAudit(tenantId, 'ai_transcription', {
          message_id: messageId,
          transcription_length: transcriptionText.length,
          language: transcription.language,
          duration_seconds: transcription.durationSeconds,
        })
      }
    } else if (messageType === 'audio' && !mediaUrl) {
      await logAudit(tenantId, 'audio_transcribe_skipped', {
        message_id: messageId,
        reason: 'no_media_url',
      })
    }

    if (!textForClassification.trim()) {
      await logAudit(tenantId, 'ai_processing_skipped', {
        message_id: messageId,
        reason: 'empty_text',
      })
      return
    }

    // 2. Класифікація
    const classification = await classifyMessage(textForClassification, clientHistory)
    console.log('[DIAG] classification result:', JSON.stringify(classification))

    if (!classification) {
      await logAudit(tenantId, 'ai_processing_failed', {
        message_id: messageId,
        stage: 'classification',
        error: 'classifyMessage повернув null',
      })
      return
    }

    const { error: clsError } = await supabase
      .from('messages')
      .update({ ai_classification: JSON.stringify(classification) })
      .eq('id', messageId)

    if (clsError) {
      console.error('[AI Pipeline] Помилка збереження класифікації:', clsError)
      await logAudit(tenantId, 'ai_processing_failed', {
        message_id: messageId,
        stage: 'save_classification',
        error: clsError.message,
      })
      return
    }

    await logAudit(tenantId, 'ai_classification', {
      message_id: messageId,
      type: classification.type,
      tone: classification.tone,
      language: classification.language,
      has_promise: classification.hasPromise,
      confidence: classification.confidence,
    })

    // Якщо впевненість < 0.6 — не генеруємо чернетку
    if (classification.confidence < 0.6) {
      await supabase
        .from('messages')
        .update({ ai_classification: JSON.stringify({ ...classification, type: 'unclear' }) })
        .eq('id', messageId)
      return
    }

    // 3. Генерація чернетки
    const draft = await generateDraft(
      textForClassification,
      classification,
      clientName,
      clientHistory
    )

    if (!draft) {
      console.log('[DIAG] draft generation returned null')
      await logAudit(tenantId, 'ai_processing_failed', {
        message_id: messageId,
        stage: 'draft_generation',
        error: 'generateDraft повернув null',
      })
      return
    }

    console.log('[DIAG] before draft insert')

    // Чернетка — окремий запис з прив'язкою до вхідного повідомлення
    let draftError: Error | null = null
    try {
      const result = await supabase.from('messages').insert({
        tenant_id: tenantId,
        client_id: clientId,
        direction: 'draft',
        status: 'draft',
        message_type: 'text',
        body: draft.text,
        ai_generated: true,
        parent_message_id: messageId,
        ai_classification: JSON.stringify(classification),
      })
      draftError = result.error
    } catch (error) {
      console.error('[DIAG] draft insert error:', error)
      await logAudit(tenantId, 'ai_processing_failed', {
        message_id: messageId,
        stage: 'save_draft',
        error: error instanceof Error ? error.message : String(error),
      })
      return
    }

    if (draftError) {
      console.error('[DIAG] draft insert error:', draftError)
      console.error('[AI Pipeline] Помилка збереження чернетки:', draftError)
      await logAudit(tenantId, 'ai_processing_failed', {
        message_id: messageId,
        stage: 'save_draft',
        error: draftError.message,
      })
      return
    }

    await logAudit(tenantId, 'ai_draft_created', {
      original_message_id: messageId,
      client_id: clientId,
      draft_language: draft.language,
      model: draft.model,
      prompt_tokens: draft.promptTokens,
      completion_tokens: draft.completionTokens,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Невідома помилка'
    console.error('[AI Pipeline] Неочікувана помилка:', errorMessage)

    await logAudit(tenantId, 'ai_processing_failed', {
      message_id: messageId,
      client_id: clientId,
      error: errorMessage,
    })
  }
}

// ============================================================
// Допоміжна функція для запису в audit_log
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
