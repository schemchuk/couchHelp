import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import type { WhatsAppWebhookPayload } from './types'
import {
  extractMessages,
  extractPhoneNumberId,
  extractSenderName,
  extractSenderPhone,
  isInboundMessage,
} from './parser'
import { runAIPipeline } from '@/lib/ai/pipeline'

/**
 * Асинхронна обробка WhatsApp webhook payload.
 * Використовується як основним endpoint (/api/webhooks/whatsapp), так і тестовим (/api/webhooks/test).
 */
export async function handleWebhook(rawBody: string): Promise<void> {
  const payload: WhatsAppWebhookPayload = JSON.parse(rawBody)

  // 1. Витягти phone_number_id і знайти tenant
  const phoneNumberId = extractPhoneNumberId(payload)
  if (!phoneNumberId) {
    console.warn('[WhatsApp Webhook] No phone_number_id found')
    return
  }

  const supabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, access_token_enc')
    .eq('phone_number_id', phoneNumberId)
    .single()

  if (tenantError || !tenant) {
    console.warn('[WhatsApp Webhook] Tenant not found for phone_number_id:', phoneNumberId)
    await logAudit(null, 'webhook_received', {
      error: 'tenant_not_found',
      phone_number_id: phoneNumberId,
    })
    return
  }

  const tenantId = tenant.id

  // 2. Перевірити чи це inbound message (а не status update)
  const isInbound = isInboundMessage(payload)
  if (!isInbound) {
    console.log('[WhatsApp Webhook] Status update received, skipping')
    await logAudit(tenantId, 'webhook_received', {
      type: 'status_update',
    })
    return
  }

  // 3. Витягти перше повідомлення
  const messages = extractMessages(payload)
  const message = messages[0]
  if (!message) {
    console.warn('[WhatsApp Webhook] No message found in payload')
    return
  }

  const wamid = message.id
  const senderPhone = extractSenderPhone(message)
  const senderName = extractSenderName(payload, senderPhone)

  // 4. Знайти або створити client
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('phone', senderPhone)
    .single()

  let clientId: string

  if (existingClient) {
    clientId = existingClient.id
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        tenant_id: tenantId,
        phone: senderPhone,
        name: senderName,
      })
      .select('id')
      .single()

    if (clientError || !newClient) {
      console.error('[WhatsApp Webhook] Failed to create client:', clientError)
      await logAudit(tenantId, 'webhook_received', {
        error: 'client_creation_failed',
        wamid,
        phone: senderPhone,
      })
      return
    }

    clientId = newClient.id
  }

  // 5. Зберегти повідомлення (з дедуплікацією через ON CONFLICT DO NOTHING)
  const { data: savedMessages, error: msgError } = await supabase
    .from('messages')
    .upsert(
      {
        tenant_id: tenantId,
        client_id: clientId,
        wamid: wamid,
        direction: 'inbound',
        status: 'received',
        message_type: message.type ?? 'unknown',
        body: message.text?.body ?? null,
        media_id: message.image?.id ?? message.document?.id ?? message.audio?.id ?? message.video?.id ?? message.sticker?.id ?? null,
        media_filename: message.document?.filename ?? null,
      },
      { onConflict: 'wamid', ignoreDuplicates: true }
    )
    .select('id')

  if (msgError) {
    console.error('[WhatsApp Webhook] Failed to save message:', msgError)
    await logAudit(tenantId, 'webhook_received', {
      error: 'message_save_failed',
      wamid,
      client_id: clientId,
    })
    return
  }

  if (!savedMessages || savedMessages.length === 0) {
    console.log('[WhatsApp Webhook] Duplicate wamid, skipping:', wamid)
    return
  }

  const savedMessage = savedMessages[0]

  // 6. Записати в audit_log
  await logAudit(tenantId, 'webhook_received', {
    wamid,
    client_id: clientId,
    message_id: savedMessage.id,
    phone: senderPhone,
    message_type: message.type,
  })

  // 7. Викликати AI-обробку
  const { data: historyRows } = await supabase
    .from('messages')
    .select('body')
    .eq('client_id', clientId)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(3)

  const clientHistory = (historyRows ?? [])
    .map((row) => row.body)
    .filter((body): body is string => body !== null)
    .reverse()

  await runAIPipeline({
    messageId: savedMessage.id,
    tenantId,
    clientId,
    messageType: message.type ?? 'unknown',
    messageText: message.text?.body ?? null,
    mediaUrl: null,
    clientName: senderName,
    clientHistory,
  })
}

// ============================================================
// Допоміжна функція для audit_log
// ============================================================
async function logAudit(
  tenantId: string | null,
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
