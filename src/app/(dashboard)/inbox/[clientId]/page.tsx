import { MessageThread } from '@/components/inbox/MessageThread'

interface InboxClientPageProps {
  params: Promise<{ clientId: string }>
}

export default async function InboxClientPage({ params }: InboxClientPageProps) {
  const { clientId } = await params

  return (
    <div className="h-[calc(100vh-4rem)]">
      <MessageThread clientId={clientId} />
    </div>
  )
}
