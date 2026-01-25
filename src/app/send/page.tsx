'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Recipe, AggregatedIngredient, Settings } from '@/types'

export default function SendPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set())
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    Promise.all([fetchRecipes(), fetchSettings()]).finally(() => setLoading(false))
  }, [])

  async function fetchRecipes() {
    try {
      const res = await fetch('/api/recipes')
      if (res.ok) {
        const data = await res.json()
        setRecipes(data)
      }
    } catch (error) {
      console.error('Error fetching recipes:', error)
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  function toggleRecipe(id: number) {
    const newSelected = new Set(selectedRecipes)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRecipes(newSelected)
  }

  function selectAll() {
    if (selectedRecipes.size === recipes.length) {
      setSelectedRecipes(new Set())
    } else {
      setSelectedRecipes(new Set(recipes.map(r => r.id)))
    }
  }

  function getAggregatedIngredients(): AggregatedIngredient[] {
    const ingredientMap = new Map<string, AggregatedIngredient>()

    recipes
      .filter(r => selectedRecipes.has(r.id))
      .forEach(recipe => {
        recipe.ingredients?.forEach(ing => {
          const key = `${ing.name.toLowerCase()}_${ing.unit.toLowerCase()}`
          const existing = ingredientMap.get(key)

          if (existing) {
            existing.totalQuantity += ing.quantity
            if (!existing.fromRecipes.includes(recipe.name)) {
              existing.fromRecipes.push(recipe.name)
            }
          } else {
            ingredientMap.set(key, {
              name: ing.name,
              totalQuantity: ing.quantity,
              unit: ing.unit,
              fromRecipes: [recipe.name]
            })
          }
        })
      })

    return Array.from(ingredientMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  async function handleSend() {
    if (!settings?.postUrl) {
      setMessage({ type: 'error', text: 'Configura una URL primero' })
      return
    }

    if (selectedRecipes.size === 0) {
      setMessage({ type: 'error', text: 'Selecciona al menos una receta' })
      return
    }

    setSending(true)
    setMessage(null)

    const ingredients = getAggregatedIngredients()

    try {
      const res = await fetch(settings.postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          timestamp: new Date().toISOString()
        })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Enviado correctamente' })
      } else {
        setMessage({ type: 'error', text: `Error: ${res.status}` })
      }
    } catch {
      setMessage({ type: 'error', text: 'No se pudo conectar' })
    } finally {
      setSending(false)
    }
  }

  const aggregatedIngredients = getAggregatedIngredients()

  if (loading) {
    return <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Cargando...</div>
  }

  return (
    <div>
      <h1 className="text-lg font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
        Enviar Ingredientes
      </h1>

      {!settings?.postUrl && (
        <div
          className="p-3 rounded-lg mb-4 text-sm"
          style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            color: '#fbbf24'
          }}
        >
          No hay URL configurada.{' '}
          <Link href="/settings" className="underline font-medium">
            Configurar
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div
          className="p-4 rounded-xl"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Seleccionar Recetas
            </h2>
            <button
              onClick={selectAll}
              className="text-xs font-medium"
              style={{ color: 'var(--accent-blue)' }}
            >
              {selectedRecipes.size === recipes.length ? 'Ninguna' : 'Todas'}
            </button>
          </div>

          {recipes.length === 0 ? (
            <p className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay recetas.{' '}
              <Link href="/" style={{ color: 'var(--accent-blue)' }}>
                Crear una
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {recipes.map(recipe => (
                <li
                  key={recipe.id}
                  className="p-3 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: selectedRecipes.has(recipe.id)
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'var(--background)',
                    border: selectedRecipes.has(recipe.id)
                      ? '1px solid rgba(59, 130, 246, 0.3)'
                      : '1px solid transparent'
                  }}
                  onClick={() => toggleRecipe(recipe.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-xs"
                      style={{
                        background: selectedRecipes.has(recipe.id) ? 'var(--accent-blue)' : 'var(--card-border)',
                        color: selectedRecipes.has(recipe.id) ? '#fff' : 'transparent'
                      }}
                    >
                      ✓
                    </div>
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                        {recipe.name}
                      </span>
                      <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                        {recipe.ingredients?.length || 0} ing.
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="p-4 rounded-xl"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>
            Vista Previa
          </h2>

          {selectedRecipes.size === 0 ? (
            <p className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              Selecciona recetas
            </p>
          ) : aggregatedIngredients.length === 0 ? (
            <p className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              Sin ingredientes
            </p>
          ) : (
            <ul className="space-y-2 mb-4">
              {aggregatedIngredients.map((ing, idx) => (
                <li
                  key={idx}
                  className="p-2 rounded-lg"
                  style={{ background: 'var(--background)' }}
                >
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--foreground)' }}>{ing.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {ing.totalQuantity} {ing.unit}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--card-border)' }}>
                    {ing.fromRecipes.join(', ')}
                  </div>
                </li>
              ))}
            </ul>
          )}

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

          <div
            className="pt-3"
            style={{ borderTop: '1px solid var(--card-border)' }}
          >
            <p className="text-xs mb-3 truncate" style={{ color: 'var(--card-border)' }}>
              {settings?.postUrl || 'URL no configurada'}
            </p>
            <button
              onClick={handleSend}
              disabled={sending || selectedRecipes.size === 0 || !settings?.postUrl}
              className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--accent-green)', color: '#fff' }}
            >
              {sending ? 'Enviando...' : 'Enviar Ingredientes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
