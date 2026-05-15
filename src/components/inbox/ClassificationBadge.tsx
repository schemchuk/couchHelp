import { Badge } from '@/components/ui/badge'
import { de } from '@/lib/i18n/de'
import type { MessageType } from '@/lib/ai/types'

interface ClassificationBadgeProps {
  type: MessageType
}

const variantMap: Record<MessageType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new_lead: 'default',
  existing_client: 'secondary',
  spam: 'destructive',
  unclear: 'outline',
}

/**
 * Бейдж типу повідомлення (new_lead / existing_client / spam / unclear).
 */
export function ClassificationBadge({ type }: ClassificationBadgeProps) {
  const label = de.classification[type] ?? type
  const variant = variantMap[type] ?? 'outline'

  return (
    <Badge variant={variant} className="text-xs font-medium">
      {label}
    </Badge>
  )
}
