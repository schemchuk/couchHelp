import { Card } from '@/components/ui/card'
import { Mic } from 'lucide-react'
import { de } from '@/lib/i18n/de'

interface AudioTranscriptionProps {
  text: string
}

/**
 * Блок із транскрипцією голосового повідомлення.
 */
export function AudioTranscription({ text }: AudioTranscriptionProps) {
  return (
    <Card className="mt-1 border-dashed border-teal-200 bg-teal-50/50 p-3">
      <div className="flex items-start gap-2">
        <Mic className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-teal-700">
            {de.messageThread.audioTranscription}
          </p>
          <p className="text-sm text-slate-700">{text}</p>
        </div>
      </div>
    </Card>
  )
}
