import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton-завантажувач для списку inbox.
 */
export function InboxSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 p-4">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-slate-100 p-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
