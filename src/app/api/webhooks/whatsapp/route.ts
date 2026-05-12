import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/whatsapp/signature'
import {
  extractMessages,
  extractPhoneNumberId,
  extractSenderName,
  extractSenderPhone,
  isInboundMessage,
} from '@/lib/whatsapp/parser'
import type { WhatsAppWebhookPayload } from '@/lib/whatsapp/types'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { processWithAI } from '@/lib/ai/processor'

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

// POST — прийом повідомлень від WhatsApp
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256') ?? ''

  // 1. Верифікація підпису
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (appSecret && !verifyWebhookSignature(rawBody, signature, appSecret)) {
    return new NextResponse('Invalid signature', { status: 403 })
  }

  // 2. Швидка відповідь 200 OK — не блокуємо Meta
  // Обробка запускається у фоні через Promise
  Promise.resolve().then(async () => {
    try {
      await handleWebhook(rawBody)
    } catch (error) {
      console.error('[WhatsApp Webhook] Background processing error:', error)
    }
  })

  return NextResponse.json({ status: 'ok' })
}

// ============================================================
// Асинхронна обробка webhook (після відповіді 200)
// ============================================================
async function handleWebhook(rawBody: string): Promise<void> {
  const payload: WhatsAppWebhookPayload = JSON.parse(rawBody)

  // 3. Витягти phone_number_id і знайти tenant
  const phoneNumberId = extractPhoneNumberId(payload)
  if (!phoneNumberId) {
    console.warn('[WhatsApp Webhook] No phone_number_id found')
    return
  }

  const supabase = createServiceClient(
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

  // 4. Перевірити чи це inbound message (а не status update)
  if (!isInboundMessage(payload)) {
    console.log('[WhatsApp Webhook] Status update received, skipping')
    await logAudit(tenantId, 'webhook_received', {
      type: 'status_update',
    })
    return
  }

  // 5. Витягти перше повідомлення
  const messages = extractMessages(payload)
  const message = messages[0]
  if (!message) {
    console.warn('[WhatsApp Webhook] No message found in payload')
    return
  }

  const wamid = message.id
  const senderPhone = extractSenderPhone(message)
  const senderName = extractSenderName(payload, senderPhone)

  // 6. Дедуплікація по wamid
  const { data: existingMessage } = await supabase
    .from('messages')
    .select('id')
    .eq('wamid', wamid)
    .single()

  if (existingMessage) {
    console.log('[WhatsApp Webhook] Duplicate wamid, skipping:', wamid)
    return
  }

  // 7. Знайти або створити client
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id, language')
    .eq('tenant_id', tenantId)
    .eq('phone', senderPhone)
    .single()

  let clientId: string
  let clientLanguage: string | null = null

  if (existingClient) {
    clientId = existingClient.id
    clientLanguage = existingClient.language
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

  // 8. Зберегти повідомлення
  const { data: savedMessage, error: msgError } = await supabase
    .from('messages')
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      wamid: wamid,
      direction: 'inbound',
      status: 'received',
      message_type: message.type ?? 'unknown',
      body: message.text?.body ?? null,
      media_id: message.image?.id ?? message.document?.id ?? message.audio?.id ?? message.video?.id ?? message.sticker?.id ?? null,
      media_filename: message.document?.filename ?? null,
    })
    .select('id')
    .single()

  if (msgError || !savedMessage) {
    console.error('[WhatsApp Webhook] Failed to save message:', msgError)
    await logAudit(tenantId, 'webhook_received', {
      error: 'message_save_failed',
      wamid,
      client_id: clientId,
    })
    return
  }

  // 9. Записати в audit_log
  await logAudit(tenantId, 'webhook_received', {
    wamid,
    client_id: clientId,
    message_id: savedMessage.id,
    phone: senderPhone,
    message_type: message.type,
  })

  // 10. Викликати AI-обробку
  // Витягаємо історію останніх 3 повідомлень для контексту
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

  await processWithAI({
    messageId: savedMessage.id,
    tenantId,
    clientId,
    messageText: message.text?.body ?? '',
    clientLanguage,
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
  metadata: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient(
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
