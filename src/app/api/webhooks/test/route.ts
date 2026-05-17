import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { handleWebhook } from '@/lib/whatsapp/handle-webhook'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// POST — тестовий webhook без перевірки підпису
// УВАГА: працює тільки якщо ENABLE_TEST_WEBHOOK=true
export async function POST(request: NextRequest) {
  if (process.env.ENABLE_TEST_WEBHOOK !== 'true') {
    return new NextResponse('Not Found', { status: 404, headers: CORS_HEADERS })
  }

  const rawBody = await request.text()

  console.log('[TEST] raw body length:', rawBody.length)
  try {
    const parsed = JSON.parse(rawBody)
    console.log('[TEST] parsed payload:', JSON.stringify(parsed))
  } catch (e) {
    console.error('[TEST] JSON parse error:', e)
  }

  // Виклик той самий обробник що і основний webhook, але без перевірки підпису
  waitUntil(
    handleWebhook(rawBody).catch((error) => {
      console.error('[Test Webhook] Background processing error:', error)
    })
  )

  return NextResponse.json({ status: 'ok' }, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}
