import type { Database, SupportedLanguage } from '@/types'
import { LanguageBadge } from './LanguageBadge'

type Client = Database['public']['Tables']['clients']['Row']

export function ClientCard({ client }: { client: Client }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{client.name}</h3>
      </div>
      <div className="mt-2 flex items-center gap-2">
        {client.language && (
          <LanguageBadge language={client.language as SupportedLanguage} />
        )}
        <span className="text-sm text-slate-500">{client.phone}</span>
      </div>
      {client.notes && (
        <p className="mt-2 text-sm text-slate-600">{client.notes}</p>
      )}
    </div>
  )
}
