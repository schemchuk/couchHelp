'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { de } from '@/lib/i18n/de'
import { ScrollArea } from '@/components/ui/scroll-area'
import { InboxItem } from './InboxItem'
import { InboxSkeleton } from './InboxSkeleton'
import type { MessageType, MessageTone } from '@/lib/ai/types'

interface InboxListProps {
  onSelect: (clientId: string) => void
  selectedClientId: string | null
}

interface GroupedClient {
  clientId: string
  clientName: string | null
  clientPhone: string
  lastMessageBody: string | null
  lastMessageAt: string
  unreadCount: number
  classificationType: MessageType | null
  tone: MessageTone | null
}

interface RawMessage {
  id: string
  client_id: string
  direction: string
  status: string
  body: string | null
  ai_classification: string | null
  created_at: string
  is_read: boolean | null
  clients: { id: string; name: string | null; phone: string } | null
}

/**
 * Список inbox з групуванням по клієнту та real-time оновленням.
 */
export function InboxList({ onSelect, selectedClientId }: InboxListProps) {
  const supabase = createClient()
  const [items, setItems] = useState<GroupedClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const groupMessages = useCallback((data: RawMessage[]): GroupedClient[] => {
    const map = new Map<string, GroupedClient>()

    for (const msg of data) {
      if (!msg.clients) continue

      const existing = map.get(msg.client_id)
      const msgDate = new Date(msg.created_at).getTime()

      if (
        !existing ||
        msgDate > new Date(existing.lastMessageAt).getTime()
      ) {
        let classificationType: MessageType | null = null
        let tone: MessageTone | null = null
        try {
          const parsed = msg.ai_classification
            ? (JSON.parse(msg.ai_classification) as {
                type: MessageType
                tone: MessageTone
              })
            : null
          if (parsed) {
            classificationType = parsed.type
            tone = parsed.tone
          }
        } catch {
          // ignore
        }

        map.set(msg.client_id, {
          clientId: msg.client_id,
          clientName: msg.clients.name,
          clientPhone: msg.clients.phone,
          lastMessageBody: msg.body,
          lastMessageAt: msg.created_at,
          unreadCount: 0,
          classificationType,
          tone,
        })
      }
    }

    // Підрахунок непрочитаних
    for (const msg of data) {
      if (msg.direction === 'inbound' && msg.is_read === false) {
        const entry = map.get(msg.client_id)
        if (entry) {
          entry.unreadCount++
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    )
  }, [])

  const fetchMessages = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    const { data, error } = await supabase
      .from('messages')
      .select('*, clients(id, name, phone)')
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(200)
      .returns<RawMessage[]>()

    if (error) {
      console.error('[InboxList] Fetch error:', error)
      setFetchError(de.inbox.error)
      setIsLoading(false)
      return
    }

    setItems(groupMessages(data || []))
    setIsLoading(false)
  }, [supabase, groupMessages])

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel('inbox-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchMessages])

  if (isLoading) {
    return <InboxSkeleton />
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

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-medium text-slate-600">{de.inbox.empty}</p>
        <p className="text-xs text-slate-400">{de.inbox.emptyHint}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 p-3">
        <h2 className="text-sm font-semibold text-slate-700">{de.inbox.title}</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-slate-50">
          {items.map((item) => (
            <InboxItem
              key={item.clientId}
              clientId={item.clientId}
              clientName={item.clientName}
              clientPhone={item.clientPhone}
              lastMessageBody={item.lastMessageBody}
              lastMessageAt={item.lastMessageAt}
              unreadCount={item.unreadCount}
              classificationType={item.classificationType}
              tone={item.tone}
              isSelected={item.clientId === selectedClientId}
              onClick={() => onSelect(item.clientId)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
