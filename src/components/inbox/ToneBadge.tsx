import { Badge } from '@/components/ui/badge'
import { de } from '@/lib/i18n/de'
import type { MessageTone } from '@/lib/ai/types'

interface ToneBadgeProps {
  tone: MessageTone
}

const toneClassMap: Record<MessageTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  urgent: 'bg-red-100 text-red-700 hover:bg-red-100',
  positive: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  negative: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
}

/**
 * Бейдж емоційного тону повідомлення.
 */
export function ToneBadge({ tone }: ToneBadgeProps) {
  const label = de.tone[tone] ?? tone
  const className = toneClassMap[tone] ?? toneClassMap.neutral

  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  )
}
