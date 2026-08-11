'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/**
 * Mantiene la pantalla encendida usando la Screen Wake Lock API.
 * El bloqueo se libera solo al minimizar la pestaña, por lo que se
 * vuelve a pedir cuando el documento se hace visible de nuevo.
 */
export function useWakeLock() {
  // El servidor no tiene `navigator`: se resuelve tras la hidratación.
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => 'wakeLock' in navigator,
    () => false
  )
  const [enabled, setEnabled] = useState(false)
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    async function acquire() {
      if (document.visibilityState !== 'visible' || sentinelRef.current) return
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          sentinel.release()
          return
        }
        sentinelRef.current = sentinel
        sentinel.addEventListener('release', () => {
          if (sentinelRef.current === sentinel) sentinelRef.current = null
        })
      } catch (error) {
        console.error('Error activando el bloqueo de pantalla:', error)
        if (!cancelled) setEnabled(false)
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      sentinelRef.current?.release().catch(() => {})
      sentinelRef.current = null
    }
  }, [enabled])

  const toggle = useCallback(() => setEnabled(prev => !prev), [])

  return { supported, enabled, toggle }
}
