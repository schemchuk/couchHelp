import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
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
import type { Database, Json } from '@/types/database'
import { runAIPipeline } from '@/lib/ai/pipeline'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-hub-signature-256',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
}

// OPTIONS — CORS preflight (на випадок якщо Meta Dashboard ходить через браузер)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// GET — верифікація webhook від Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('[WhatsApp Webhook] GET verify attempt:', {
    mode,
    tokenPresent: !!token,
    challengePresent: !!challenge,
    url: request.url,
    origin: request.headers.get('origin'),
    userAgent: request.headers.get('user-agent'),
  })

  if (mode !== 'subscribe') {
    console.log('[WhatsApp Webhook] Rejected: hub.mode !== subscribe')
    return new NextResponse('Forbidden', { status: 403, headers: CORS_HEADERS })
  }

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  if (!expectedToken) {
    console.error('[WhatsApp Webhook] Rejected: WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set')
    return new NextResponse('Server misconfigured', { status: 500, headers: CORS_HEADERS })
  }

  if (token !== expectedToken) {
    console.log('[WhatsApp Webhook] Rejected: verify_token mismatch')
    return new NextResponse('Forbidden', { status: 403, headers: CORS_HEADERS })
  }

  if (!challenge) {
    console.log('[WhatsApp Webhook] Rejected: hub.challenge missing')
    return new NextResponse('Bad Request: challenge missing', { status: 400, headers: CORS_HEADERS })
  }

  console.log('[WhatsApp Webhook] Verified successfully, returning challenge')
  return new NextResponse(challenge, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/plain',
    },
  })
}

// POST — прийом повідомлень від WhatsApp
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256') ?? ''

  console.log('[DIAG] POST received, signature present:', !!signature, 'body length:', rawBody.length)

  // 1. Верифікація підпису
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) {
    console.error('[DIAG] WHATSAPP_APP_SECRET missing!')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const signatureValid = verifyWebhookSignature(rawBody, signature, appSecret)
  console.log('[DIAG] signature valid:', signatureValid)
  if (!signatureValid) {
    return new NextResponse('Invalid signature', { status: 403 })
  }

  // 2. Швидка відповідь 200 OK — не блокуємо Meta
  // waitUntil повідомляє Vercel тримати функцію активною до завершення pipeline
  waitUntil(
    handleWebhook(rawBody).catch((error) => {
      console.error('[WhatsApp Webhook] Background processing error:', error)
    })
  )

  return NextResponse.json({ status: 'ok' })
}

// ============================================================
// Асинхронна обробка webhook (після відповіді 200)
// ============================================================
async function handleWebhook(rawBody: string): Promise<void> {
  const payload: WhatsAppWebhookPayload = JSON.parse(rawBody)

  // 3. Витягти phone_number_id і знайти tenant
  const phoneNumberId = extractPhoneNumberId(payload)
  console.log('[DIAG] phoneNumberId extracted:', phoneNumberId)
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

  console.log('[DIAG] tenant lookup — found:', !!tenant, '| error:', tenantError?.message ?? null)
  if (tenantError || !tenant) {
    console.warn('[WhatsApp Webhook] Tenant not found for phone_number_id:', phoneNumberId)
    await logAudit(null, 'webhook_received', {
      error: 'tenant_not_found',
      phone_number_id: phoneNumberId,
    })
    return
  }

  const tenantId = tenant.id
  console.log('[DIAG] tenant found:', tenantId)
  console.log('[DIAG] tenantId:', tenantId)

  // 4. Перевірити чи це inbound message (а не status update)
  const isInbound = isInboundMessage(payload)
  console.log('[DIAG] isInboundMessage:', isInbound)
  if (!isInbound) {
    console.log('[WhatsApp Webhook] Status update received, skipping')
    await logAudit(tenantId, 'webhook_received', {
      type: 'status_update',
    })
    return
  }

  // 5. Витягти перше повідомлення
  const messages = extractMessages(payload)
  const message = messages[0]
  console.log('[DIAG] messages extracted:', messages.length, '| type:', message?.type ?? null)
  if (!message) {
    console.warn('[WhatsApp Webhook] No message found in payload')
    return
  }

  const wamid = message.id
  const senderPhone = extractSenderPhone(message)
  const senderName = extractSenderName(payload, senderPhone)
  console.log('[DIAG] wamid:', wamid, '| senderPhone:', senderPhone, '| senderName:', senderName)

  // 6. Знайти або створити client
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('phone', senderPhone)
    .single()

  let clientId: string

  if (existingClient) {
    clientId = existingClient.id
    console.log('[DIAG] existing client found:', clientId)
  } else {
    console.log('[DIAG] client not found, creating for phone:', senderPhone)
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
    console.log('[DIAG] new client created:', clientId)
  }

  // 7. Зберегти повідомлення (з дедуплікацією через ON CONFLICT DO NOTHING)
  console.log('[DIAG] before message insert')
  console.log('[DIAG] saving message, wamid:', wamid, '| client_id:', clientId)

  let savedMessages: { id: string }[] | null = null
  let msgError: Error | null = null

  try {
    const result = await supabase
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

    savedMessages = result.data
    msgError = result.error
  } catch (error) {
    console.error('[DIAG] insert error:', error)
    await logAudit(tenantId, 'webhook_received', {
      error: 'message_insert_exception',
      wamid,
      client_id: clientId,
      exception: error instanceof Error ? error.message : String(error),
    })
    return
  }

  if (msgError) {
    console.error('[DIAG] insert error:', msgError)
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
  console.log('[DIAG] message saved, id:', savedMessage.id)

  // 8. Записати в audit_log
  await logAudit(tenantId, 'webhook_received', {
    wamid,
    client_id: clientId,
    message_id: savedMessage.id,
    phone: senderPhone,
    message_type: message.type,
  })

  // 9. Викликати AI-обробку
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

  console.log('[DIAG] calling runAIPipeline, messageId:', savedMessage.id)
  await runAIPipeline({
    messageId: savedMessage.id,
    tenantId,
    clientId,
    messageType: message.type ?? 'unknown',
    messageText: message.text?.body ?? null,
    // mediaUrl отримується через WhatsApp Media API (потрібен розшифрований access token — Блок 10)
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
