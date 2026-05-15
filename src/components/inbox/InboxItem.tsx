import { cn } from '@/lib/utils'
import { de } from '@/lib/i18n/de'
import type { MessageType, MessageTone } from '@/lib/ai/types'
import { ClassificationBadge } from './ClassificationBadge'
import { ToneBadge } from './ToneBadge'

interface InboxItemProps {
  clientId: string
  clientName: string | null
  clientPhone: string
  lastMessageBody: string | null
  lastMessageAt: string
  unreadCount: number
  classificationType: MessageType | null
  tone: MessageTone | null
  isSelected: boolean
  onClick: () => void
}

/**
 * Елемент списку inbox — останнє повідомлення від клієнта.
 */
export function InboxItem({
  clientName,
  clientPhone,
  lastMessageBody,
  lastMessageAt,
  unreadCount,
  classificationType,
  tone,
  isSelected,
  onClick,
}: InboxItemProps) {
  const displayName = clientName || de.client.unknown
  const time = new Date(lastMessageAt).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50',
        isSelected && 'bg-teal-50 hover:bg-teal-50'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn('truncate font-medium', unreadCount > 0 ? 'text-slate-900' : 'text-slate-600')}>
          {displayName}
        </span>
        <span className="shrink-0 text-xs text-slate-400">{time}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {classificationType && <ClassificationBadge type={classificationType} />}
        {tone && <ToneBadge tone={tone} />}
      </div>

      <p className={cn('line-clamp-2 text-sm', unreadCount > 0 ? 'text-slate-800' : 'text-slate-500')}>
        {lastMessageBody || '—'}
      </p>

      {unreadCount > 0 && (
        <div className="flex justify-end">
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1.5 text-xs font-medium text-white">
            {unreadCount}
          </span>
        </div>
      )}
    </button>
  )
}
