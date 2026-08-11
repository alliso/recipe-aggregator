'use client'

import { useWakeLock } from '@/hooks/useWakeLock'

export default function WakeLockToggle() {
  const { supported, enabled, toggle } = useWakeLock()

  if (!supported) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Pantalla activa
      </span>
      <button
        onClick={toggle}
        role="switch"
        aria-checked={enabled}
        className="relative w-12 h-6 rounded-full transition-colors"
        style={{ background: enabled ? 'var(--accent-green)' : 'var(--card-border)' }}
        aria-label="Mantener la pantalla activa"
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full transition-all flex items-center justify-center text-xs"
          style={{
            left: enabled ? '28px' : '4px',
            background: 'var(--card-bg)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          {enabled ? '👁️' : '💤'}
        </span>
      </button>
    </div>
  )
}
