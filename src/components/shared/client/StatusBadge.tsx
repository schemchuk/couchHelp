import { Badge } from '@/components/ui/badge'
import type { ClientStatus } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<ClientStatus, { label: string; className: string }> = {
  new:        { label: 'Новий',           className: 'bg-slate-100 text-slate-700' },
  classified: { label: 'Класифіковано',   className: 'bg-blue-100 text-blue-700' },
  in_work:    { label: 'В роботі',        className: 'bg-green-100 text-green-700' },
  pause:      { label: 'Пауза',           className: 'bg-amber-100 text-amber-700' },
  closed:     { label: 'Закрито',         className: 'bg-slate-100 text-slate-400' },
}

export function StatusBadge({ status }: { status: ClientStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
