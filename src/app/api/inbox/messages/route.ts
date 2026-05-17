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

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized: no userId' }, { status: 401 })
  }

  const supabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Знайти tenant: спочатку за orgId (якщо є), інакше беремо перший
  let tenantId: string | null = null

  if (orgId) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('clerk_org_id', orgId)
      .single()
    if (tenant) tenantId = tenant.id
  }

  if (!tenantId) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .single()
    if (tenant) tenantId = tenant.id
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  // 2. Отримати inbound повідомлення з приєднаними клієнтами
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*, clients(id, name, phone)')
    .eq('tenant_id', tenantId)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(200)

  if (msgError) {
    console.error('[API Inbox] Fetch error:', msgError)
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  return NextResponse.json({ messages: messages ?? [] })
}
