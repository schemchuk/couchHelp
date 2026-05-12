import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface DraftPreviewProps {
  draft: string
  onSend: () => void
  onEdit: () => void
  onReject: () => void
}

export function DraftPreview({ draft, onSend, onEdit, onReject }: DraftPreviewProps) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-amber-800">
          AI-чернетка
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-800 whitespace-pre-wrap">{draft}</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button size="sm" onClick={onSend} className="bg-teal-600 hover:bg-teal-700">
          Відправити
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          Змінити
        </Button>
        <Button size="sm" variant="ghost" onClick={onReject}>
          Відхилити
        </Button>
      </CardFooter>
    </Card>
  )
}
