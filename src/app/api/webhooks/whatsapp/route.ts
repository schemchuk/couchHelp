import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { verifyWebhookSignature } from '@/lib/whatsapp/signature'
import { handleWebhook } from '@/lib/whatsapp/handle-webhook'

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

  // 1. Верифікація підпису
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) {
    console.error('[WhatsApp Webhook] WHATSAPP_APP_SECRET missing!')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const signatureValid = verifyWebhookSignature(rawBody, signature, appSecret)
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
