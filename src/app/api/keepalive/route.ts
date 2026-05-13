import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Keep-alive endpoint для запобігання "засинанню" Supabase БД
 * на безкоштовному тарифі (пауза після 7 днів неактивності).
 *
 * Викликається з GitHub Actions 1-2 рази на день у випадковий час.
 */
export async function POST(request: NextRequest) {
  // 1. Перевірка секрету — endpoint не має бути публічно доступним
  const authHeader = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${process.env.KEEPALIVE_SECRET}`

  if (!process.env.KEEPALIVE_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Простий запит до БД — head: true не повертає рядки, лише рахує
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { count, error } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('[KeepAlive] DB error:', error)
    return NextResponse.json(
      { error: 'Database query failed', details: error.message },
      { status: 500 }
    )
  }

  console.log(`[KeepAlive] OK, tenants count = ${count}`)
  return NextResponse.json({ status: 'ok', count })
}
