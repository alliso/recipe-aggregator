'use client'

import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [postUrl, setPostUrl] = useState('')
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
        body: JSON.stringify({ postUrl })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
      } else {
        setMessage({ type: 'error', text: 'Error al guardar la configuración' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Error al guardar la configuración' })
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
      const res = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Conexión exitosa' })
      } else {
        setMessage({ type: 'error', text: `Error: ${res.status} ${res.statusText}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'No se pudo conectar con la URL' })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL para envío de ingredientes (POST)
            </label>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://ejemplo.com/api/ingredientes"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              La lista de ingredientes se enviará a esta URL mediante POST en formato JSON.
            </p>
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={testConnection}
              disabled={!postUrl}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Probar conexión
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Formato del envío</h2>
        <p className="text-sm text-gray-600 mb-3">
          Cuando envíes la lista de ingredientes, se hará un POST con el siguiente formato JSON:
        </p>
        <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`{
  "ingredients": [
    {
      "name": "Tomate",
      "totalQuantity": 500,
      "unit": "g",
      "fromRecipes": ["Ensalada", "Pasta"]
    },
    ...
  ],
  "timestamp": "2024-01-25T12:00:00.000Z"
}`}
        </pre>
      </div>
    </div>
  )
}
