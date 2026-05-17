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

interface LanguageSelectorProps {
  onSelect: (lang: string) => void
  isLoading: boolean
}

const LANG_LABELS: Record<string, string> = {
  de: 'Deutsch',
  ru: 'Русский',
  ua: 'Українська',
}

function LanguageSelector({ onSelect, isLoading }: LanguageSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-700">
        {de.draftCard.selectLanguage}
      </p>
      <div className="flex gap-2">
        {['de', 'ru', 'ua'].map((lang) => (
          <Button
            key={lang}
            size="sm"
            variant="outline"
            onClick={() => onSelect(lang)}
            disabled={isLoading}
            className="border-slate-300 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700"
          >
            {isLoading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-300 border-t-teal-600" />
            ) : (
              LANG_LABELS[lang]
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

/**
 * Картка AI-чернетки з кнопками Approve / Edit / Discard.
 */
export function DraftCard({ message, tenantId, onUpdated }: DraftCardProps) {
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.body || '')
  const [isLoading, setIsLoading] = useState(false)
  const [generatingLang, setGeneratingLang] = useState<string | null>(null)

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
      .update({ direction: 'outbound', status: 'approved', updated_at: new Date().toISOString() })
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
      ) : message.body === null ? (
        <LanguageSelector
          onSelect={async (lang) => {
            setGeneratingLang(lang)
            try {
              const res = await fetch('/api/inbox/generatedraft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId: message.id, language: lang }),
              })
              if (!res.ok) throw new Error(`HTTP ${res.status}`)
              onUpdated()
            } catch (err) {
              console.error('[DraftCard] generate-draft failed:', err)
            } finally {
              setGeneratingLang(null)
            }
          }}
          isLoading={generatingLang !== null}
        />
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
