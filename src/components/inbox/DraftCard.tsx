'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import type { ClassificationResult } from '@/lib/ai/types'
import { de } from '@/lib/i18n/de'
import { ClassificationBadge } from './ClassificationBadge'
import { ToneBadge } from './ToneBadge'

type MessageRow = Database['public']['Tables']['messages']['Row']

interface DraftCardProps {
  message: MessageRow
  tenantId: string
  onUpdated: () => void
}

/**
 * Картка AI-чернетки з кнопками Approve / Edit / Discard.
 */
export function DraftCard({ message, tenantId, onUpdated }: DraftCardProps) {
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.body || '')
  const [isLoading, setIsLoading] = useState(false)

  const classification: ClassificationResult | null = (() => {
    try {
      return message.ai_classification
        ? (JSON.parse(message.ai_classification) as ClassificationResult)
        : null
    } catch {
      return null
    }
  })()

  const confidencePercent = classification
    ? Math.round(classification.confidence * 100)
    : 0

  const showWarning =
    !classification ||
    classification.confidence < 0.6 ||
    classification.type === 'unclear'

  async function logAudit(action: string, metadata: Record<string, string | number | boolean | null>) {
    await supabase.from('audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'message',
      entity_id: message.id,
      action,
      actor: 'coach',
      metadata,
    })
  }

  async function handleApprove() {
    setIsLoading(true)
    const { error } = await supabase
      .from('messages')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', message.id)

    if (error) {
      console.error('[DraftCard] Approve failed:', error)
      setIsLoading(false)
      return
    }

    await logAudit('draft_approved', {
      draft_id: message.id,
      original_text: message.body,
    })

    setIsLoading(false)
    onUpdated()
  }

  async function handleDiscard() {
    setIsLoading(true)
    const { error } = await supabase
      .from('messages')
      .update({ status: 'discarded', updated_at: new Date().toISOString() })
      .eq('id', message.id)

    if (error) {
      console.error('[DraftCard] Discard failed:', error)
      setIsLoading(false)
      return
    }

    await logAudit('draft_discarded', {
      draft_id: message.id,
      original_text: message.body,
    })

    setIsLoading(false)
    onUpdated()
  }

  async function handleSaveEdit() {
    if (!editText.trim()) return
    setIsLoading(true)
    const { error } = await supabase
      .from('messages')
      .update({ body: editText.trim(), updated_at: new Date().toISOString() })
      .eq('id', message.id)

    if (error) {
      console.error('[DraftCard] Edit save failed:', error)
      setIsLoading(false)
      return
    }

    await logAudit('draft_edited', {
      draft_id: message.id,
      new_text: editText.trim(),
    })

    setIsLoading(false)
    setIsEditing(false)
    onUpdated()
  }

  return (
    <Card className="border-amber-200 bg-amber-50/60 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          {de.draftCard.title}
        </span>
        {showWarning && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            <AlertTriangle className="h-3 w-3" />
            {classification?.type === 'unclear'
              ? de.draftCard.warningUnclear
              : de.draftCard.warningLowConfidence}
          </span>
        )}
      </div>

      {classification && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <ClassificationBadge type={classification.type} />
          <ToneBadge tone={classification.tone} />
          <span className="text-xs text-slate-500">
            {de.draftCard.confidence}: {confidencePercent}%
          </span>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            className="bg-white"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={isLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Check className="mr-1 h-4 w-4" />
              {de.draftCard.save}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setEditText(message.body || '')
              }}
              disabled={isLoading}
            >
              <X className="mr-1 h-4 w-4" />
              {de.draftCard.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-3 whitespace-pre-wrap text-sm text-slate-800">
            {message.body}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Check className="mr-1 h-4 w-4" />
              {de.draftCard.approve}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              <Pencil className="mr-1 h-4 w-4" />
              {de.draftCard.edit}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDiscard}
              disabled={isLoading}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {de.draftCard.discard}
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
