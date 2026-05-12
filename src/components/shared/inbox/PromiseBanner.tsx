import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/date'

interface PromiseBannerProps {
  description: string
  dueDate: string
  clientName: string
}

export function PromiseBanner({ description, dueDate, clientName }: PromiseBannerProps) {
  return (
    <Alert className="border-amber-300 bg-amber-50">
      <Clock className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">
        Обіцянка — {clientName}
      </AlertTitle>
      <AlertDescription className="text-amber-700">
        {description} (до {formatDateTime(dueDate)})
      </AlertDescription>
    </Alert>
  )
}
