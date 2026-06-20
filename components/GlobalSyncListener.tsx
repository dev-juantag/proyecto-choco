'use client'

import { useEffect } from 'react'

export function GlobalSyncListener() {
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Conexión recuperada. Intentando sincronizar cola offline...')
      const { SyncManager } = await import('@/lib/sync-manager')
      SyncManager.processQueue()
    }

    // Attempt to sync on mount if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      handleOnline()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return null // This is a logic-only component
}
