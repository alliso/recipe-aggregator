'use client'

import { useEffect, useState } from 'react'

const inputStyle = {
  background: 'var(--background)',
  border: '1px solid var(--card-border)',
  color: 'var(--foreground)'
}

export default function SettingsPage() {
  const [postUrl, setPostUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setPostUrl(data.postUrl || '')
        setApiKey(data.apiKey || '')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postUrl, apiKey })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada' })
      } else {
        setMessage({ type: 'error', text: 'Error al guardar' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  async function testConnection() {
    if (!postUrl) {
      setMessage({ type: 'error', text: 'Introduce una URL primero' })
      return
    }

    setMessage(null)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['x-api-key'] = apiKey

      const res = await fetch(postUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Conexión exitosa' })
      } else {
        setMessage({ type: 'error', text: `Error: ${res.status}` })
      }
    } catch {
      setMessage({ type: 'error', text: 'No se pudo conectar' })
    }
  }

  if (loading) {
    return <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Cargando...</div>
  }

  return (
    <div>
      <h1 className="text-lg font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
        Ajustes
      </h1>

      <div
        className="p-4 rounded-xl"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              URL para envío de ingredientes (POST)
            </label>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://ejemplo.com/api/ingredientes"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={inputStyle}
            />
            <p className="text-xs mt-2" style={{ color: 'var(--card-border)' }}>
              La lista de ingredientes se enviará a esta URL mediante POST en formato JSON.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              API Key (header x-api-key)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Tu API key (opcional)"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={inputStyle}
            />
            <p className="text-xs mt-2" style={{ color: 'var(--card-border)' }}>
              Se enviará como header <code>x-api-key</code> en cada petición POST.
            </p>
          </div>

          {message && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{
                background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: message.type === 'success' ? '#22c55e' : '#ef4444',
                border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--accent-blue)', color: '#fff' }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={testConnection}
              disabled={!postUrl}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--card-border)', color: 'var(--text-muted)' }}
            >
              Probar
            </button>
          </div>
        </form>
      </div>

      <div
        className="mt-4 p-4 rounded-xl"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>
          Formato del envío
        </h2>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          El POST enviará un JSON con este formato:
        </p>
        <pre
          className="p-3 rounded-lg text-xs overflow-x-auto"
          style={{ background: 'var(--background)', color: 'var(--text-muted)' }}
        >
{`{
  "ingredients": [
    {
      "name": "Tomate",
      "totalQuantity": 500,
      "unit": "g",
      "fromRecipes": ["Ensalada", "Pasta"]
    }
  ],
  "timestamp": "2024-01-25T12:00:00Z"
}`}
        </pre>
      </div>
    </div>
  )
}
