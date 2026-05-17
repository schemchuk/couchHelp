import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { generateDraft } from '@/lib/ai/draft'
import type { ClassificationResult, SupportedLanguage } from '@/lib/ai/types'

/**
 * API route для ручної генерації чернетки з вказаною мовою.
 * Викликається коучем через кнопки DE/RU/UA у DraftCard.
 */
export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { messageId?: string; language?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { messageId, language } = body
  if (!messageId || !language) {
    return NextResponse.json(
      { error: 'messageId and language are required' },
      { status: 400 }
    )
  }

  const supportedLangs: SupportedLanguage[] = ['de', 'ru', 'ua', 'en']
  if (!supportedLangs.includes(language as SupportedLanguage)) {
    return NextResponse.json(
      { error: 'Unsupported language' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Знайти draft-запис
  const { data: draftRow, error: draftError } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .eq('direction', 'draft')
    .single()

  if (draftError || !draftRow) {
    console.error('[API GenerateDraft] Draft not found:', draftError)
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }

  // 2. Знайти оригінальне повідомлення
  if (!draftRow.parent_message_id) {
    return NextResponse.json(
      { error: 'Draft has no parent message' },
      { status: 400 }
    )
  }

  const { data: originalMsg, error: origError } = await supabase
    .from('messages')
    .select('*')
    .eq('id', draftRow.parent_message_id)
    .single()

  if (origError || !originalMsg) {
    console.error('[API GenerateDraft] Original message not found:', origError)
    return NextResponse.json(
      { error: 'Original message not found' },
      { status: 404 }
    )
  }

  // 3. Знайти tenant (sandbox fallback)
  let tenantId: string | null = null
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .single()
  if (tenant) tenantId = tenant.id

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  // 4. Історія переписки (до 10 останніх inbound/outbound)
  const { data: historyRows } = await supabase
    .from('messages')
    .select('direction, body')
    .eq('client_id', draftRow.client_id)
    .in('direction', ['inbound', 'outbound'])
    .order('created_at', { ascending: false })
    .limit(10)

  const clientHistory = (historyRows || [])
    .reverse()
    .map((m) => `${m.direction === 'inbound' ? 'Клієнт' : 'Коуч'}: ${m.body}`)

  // 5. Клієнт
  const { data: clientRow } = await supabase
    .from('clients')
    .select('name')
    .eq('id', draftRow.client_id)
    .single()

  // 6. Парсинг classification
  let classification: ClassificationResult | null = null
  try {
    classification = draftRow.ai_classification
      ? (JSON.parse(draftRow.ai_classification) as ClassificationResult)
      : null
  } catch {
    classification = null
  }

  if (!classification) {
    return NextResponse.json(
      { error: 'Classification not found' },
      { status: 400 }
    )
  }

  // 7. Генерація чернетки з примусовою мовою
  const draftResult = await generateDraft(
    originalMsg.body || '',
    classification,
    clientRow?.name ?? null,
    clientHistory,
    language as SupportedLanguage
  )

  if (!draftResult) {
    return NextResponse.json(
      { error: 'Draft generation failed' },
      { status: 500 }
    )
  }

  // 8. Оновити draft-запис
  const { error: updateError } = await supabase
    .from('messages')
    .update({
      body: draftResult.text,
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)

  if (updateError) {
    console.error('[API GenerateDraft] Update failed:', updateError)
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    )
  }

  // 9. Audit log
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    entity_type: 'message',
    entity_id: messageId,
    action: 'ai_draft_generated_manual',
    actor: 'coach',
    metadata: {
      original_message_id: originalMsg.id,
      language: draftResult.language,
      model: draftResult.model,
    },
  })

  return NextResponse.json(
    { success: true, draft: draftResult },
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  )
}
