import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * API route для thread повідомлень з клієнтом.
 * Використовує service role key для обходу RLS.
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = request.nextUrl.searchParams.get('clientId')
  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 })
  }

  const supabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Sandbox: беремо перший tenant (для production — lookup по org_id)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('client_id', clientId)
    .in('direction', ['inbound', 'outbound', 'draft'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[API Thread] Fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { messages: messages ?? [] },
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  )
}
