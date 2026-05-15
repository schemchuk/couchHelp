import { InboxSkeleton } from '@/components/inbox/InboxSkeleton'

export default function InboxLoading() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <InboxSkeleton />
    </div>
  )
}
