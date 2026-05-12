import { NextRequest, NextResponse } from 'next/server'

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

// POST — вхідні повідомлення від WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // TODO: Блок 02 — обробка вхідних повідомлень
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2))

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
