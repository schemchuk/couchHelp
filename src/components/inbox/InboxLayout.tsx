'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { InboxList } from './InboxList'
import { MessageThread } from './MessageThread'
import { de } from '@/lib/i18n/de'

/**
 * Desktop split-view layout для inbox.
 * На мобільному — лише список з переходом на /inbox/[clientId].
 */
export function InboxLayout() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const router = useRouter()

  const handleSelect = (clientId: string) => {
    console.log('[InboxLayout] handleSelect:', clientId)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      router.push(`/inbox/${clientId}`)
      return
    }
    setSelectedClientId(clientId)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="w-full md:w-80 lg:w-96 md:border-r md:border-slate-200">
        <InboxList onSelect={handleSelect} selectedClientId={selectedClientId} />
      </div>

      <div className="hidden md:flex md:flex-1 md:flex-col md:bg-slate-50/50">
        {selectedClientId ? (
          <MessageThread clientId={selectedClientId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm text-slate-500">{de.messageThread.noSelection}</p>
          </div>
        )}
      </div>
    </div>
  )
}
