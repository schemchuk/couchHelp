import { NextRequest, NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-hub-signature-256',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// GET — верифікація webhook від Meta (для WABA)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('[WABA Webhook] GET verify attempt:', {
    mode,
    tokenPresent: !!token,
    challengePresent: !!challenge,
    url: request.url,
  })

  if (mode !== 'subscribe') {
    console.log('[WABA Webhook] Rejected: hub.mode !== subscribe')
    return new NextResponse('Forbidden', { status: 403, headers: CORS_HEADERS })
  }

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  if (!expectedToken) {
    console.error('[WABA Webhook] Rejected: WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set')
    return new NextResponse('Server misconfigured', { status: 500, headers: CORS_HEADERS })
  }

  if (token !== expectedToken) {
    console.log('[WABA Webhook] Rejected: verify_token mismatch')
    return new NextResponse('Forbidden', { status: 403, headers: CORS_HEADERS })
  }

  if (!challenge) {
    console.log('[WABA Webhook] Rejected: hub.challenge missing')
    return new NextResponse('Bad Request: challenge missing', { status: 400, headers: CORS_HEADERS })
  }

  console.log('[WABA Webhook] Verified successfully, returning challenge')
  return new NextResponse(challenge, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/plain',
    },
  })
}

// POST — прийом повідомлень від WhatsApp Business API
// Поки що проксидаємо на основний обробник
export async function POST(request: NextRequest) {
  // Редірект на основний webhook-обробник, щоб не дублювати логіку
  const url = new URL('/api/webhooks/whatsapp', request.url)
  const proxyRequest = new NextRequest(url, {
    method: 'POST',
    headers: request.headers,
    body: await request.text(),
  })

  // Імпортуємо POST з основного маршруту
  const { POST: originalPost } = await import('../whatsapp/route')
  return originalPost(proxyRequest)
}
