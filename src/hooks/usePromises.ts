'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types'

type Promise = Database['public']['Tables']['promises']['Row']

export function usePromises() {
  const [promises, setPromises] = useState<Promise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchPromises = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('promises')
        .select('*')
        .eq('status', 'open')
        .order('due_date', { ascending: true })

      if (error) throw error
      setPromises(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPromises()
  }, [fetchPromises])

  return { promises, loading, error, refetch: fetchPromises }
}
