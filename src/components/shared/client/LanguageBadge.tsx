import { Badge } from '@/components/ui/badge'
import type { SupportedLanguage } from '@/types'

const LANG_CONFIG: Record<SupportedLanguage, { label: string; flag: string }> = {
  de: { label: 'DE', flag: '🇩🇪' },
  ru: { label: 'RU', flag: '🇷🇺' },
  ua: { label: 'UA', flag: '🇺🇦' },
}

export function LanguageBadge({ language }: { language: SupportedLanguage }) {
  const config = LANG_CONFIG[language]
  return (
    <Badge variant="outline" className="font-mono text-xs">
      {config.flag} {config.label}
    </Badge>
  )
}
