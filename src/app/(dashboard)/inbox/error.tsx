'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { de } from '@/lib/i18n/de'

export default function InboxError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[InboxError]', error)
  }, [error])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-lg font-semibold text-slate-800">{de.inbox.error}</h2>
      <p className="text-sm text-slate-500">{error.message}</p>
      <Button onClick={reset} variant="outline">
        {de.inbox.retry}
      </Button>
    </div>
  )
}
