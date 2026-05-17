import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * API route для інбоксу.
 * Використовує service role key для обходу RLS —
 * повертає повідомлення поточного tenant на основі Clerk org_id.
 */
export async function GET() {
  const { orgId, userId } = await auth()
  console.log('[API Inbox] auth check — userId:', userId, 'orgId:', orgId)

  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized: no orgId' }, { status: 401 })
  }

  const supabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Знайти tenant за clerk_org_id
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('clerk_org_id', orgId)
    .single()

  if (tenantError || !tenant) {
    console.error('[API Inbox] Tenant not found for orgId:', orgId)
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  // 2. Отримати inbound повідомлення з приєднаними клієнтами
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*, clients(id, name, phone)')
    .eq('tenant_id', tenant.id)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(200)

  if (msgError) {
    console.error('[API Inbox] Fetch error:', msgError)
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  return NextResponse.json({ messages: messages ?? [] })
}
