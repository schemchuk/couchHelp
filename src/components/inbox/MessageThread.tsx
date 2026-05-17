'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { de } from '@/lib/i18n/de'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AudioTranscription } from './AudioTranscription'
import { DraftCard } from './DraftCard'

type MessageRow = Database['public']['Tables']['messages']['Row']

interface MessageThreadProps {
  clientId: string
  tenantId?: string
}

/**
 * Повна стрічка діалогу з клієнтом.
 * Вхідні — зліва, вихідні — справа, draft окремо внизу.
 */
export function MessageThread({ clientId, tenantId }: MessageThreadProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    setFetchError(null)
    try {
      const res = await fetch(`/api/inbox/thread?clientId=${encodeURIComponent(clientId)}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const { messages } = (await res.json()) as { messages: MessageRow[] }
      setMessages(messages || [])

      // Позначити inbound як прочитані через API
      const unreadInbound = (messages || []).filter(
        (m) => m.direction === 'inbound' && m.is_read === false
      )
      if (unreadInbound.length > 0) {
        const ids = unreadInbound.map((m) => m.id)
        await supabase.from('messages').update({ is_read: true }).in('id', ids)
      }
    } catch (err) {
      console.error('[MessageThread] Fetch error:', err)
      setFetchError(de.inbox.error)
    } finally {
      setIsLoading(false)
    }
  }, [clientId, supabase])

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel(`thread-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          fetchMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId, supabase, fetchMessages])

  const regularMessages = messages.filter((m) => m.direction !== 'draft')
  const draftMessages = messages.filter(
    (m) => m.direction === 'draft' && m.status !== 'discarded'
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">{de.inbox.loading}</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-medium text-red-600">{fetchError}</p>
        <button
          onClick={fetchMessages}
          className="text-xs text-slate-500 underline hover:text-slate-700"
        >
          {de.inbox.retry}
        </button>
      </div>
    )
  }

  if (regularMessages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6">
        <p className="text-sm text-slate-500">{de.messageThread.noSelection}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {regularMessages.map((msg) => {
            const isInbound = msg.direction === 'inbound'
            return (
              <div key={msg.id} className="space-y-1">
                <div
                  className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      isInbound
                        ? 'rounded-tl-none bg-white text-slate-800 shadow-sm'
                        : 'rounded-tr-none bg-teal-600 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                    <span
                      className={`mt-1 block text-xs ${
                        isInbound ? 'text-slate-400' : 'text-teal-100'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                {msg.transcription && (
                  <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                    <div className="max-w-[80%]">
                      <AudioTranscription text={msg.transcription} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {draftMessages.length > 0 && (
        <div className="border-t border-slate-100 bg-white p-4">
          <div className="space-y-3">
            {draftMessages.map((draft) => (
              <DraftCard
                key={draft.id}
                message={draft}
                tenantId={tenantId || draft.tenant_id}
                onUpdated={fetchMessages}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
