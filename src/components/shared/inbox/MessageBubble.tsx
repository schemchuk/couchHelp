import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  content: string
  direction: 'inbound' | 'outbound'
  timestamp: string
}

export function MessageBubble({ content, direction, timestamp }: MessageBubbleProps) {
  const isInbound = direction === 'inbound'

  return (
    <div className={cn('flex', isInbound ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isInbound
            ? 'bg-slate-100 text-slate-900'
            : 'bg-teal-600 text-white'
        )}
      >
        <p className="text-sm">{content}</p>
        <span className="mt-1 block text-xs opacity-70">{timestamp}</span>
      </div>
    </div>
  )
}
