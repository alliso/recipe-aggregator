'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Recipe, Settings } from '@/types'

const RECIPE_ICONS = ['🍝', '🥗', '🍲', '🍜', '🥘', '🍛', '🌮', '🍕', '🥪', '🍱']
const ICON_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899', '#14b8a6']

function getRecipeIcon(id: number) {
  return RECIPE_ICONS[id % RECIPE_ICONS.length]
}

function getIconColor(id: number) {
  return ICON_COLORS[id % ICON_COLORS.length]
}

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', servings: 1 })
  const [settings, setSettings] = useState<Settings | null>(null)
  const [sendingId, setSendingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; recipeId?: number } | null>(null)

  useEffect(() => {
    fetchRecipes()
    fetchSettings()
  }, [])

  async function fetchRecipes() {
    try {
      const res = await fetch('/api/recipes')
      const data = await res.json()
      setRecipes(data)
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setLoading(false)
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

  async function handleCreateRecipe(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ name: '', description: '', servings: 1 })
        setShowForm(false)
        fetchRecipes()
      }
    } catch (error) {
      console.error('Error creating recipe:', error)
    }
  }

  async function handleDeleteRecipe(e: React.MouseEvent, id: number) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('¿Estás seguro de que quieres eliminar esta receta?')) return
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchRecipes()
      }
    } catch (error) {
      console.error('Error deleting recipe:', error)
    }
  }

  async function handleSendRecipe(e: React.MouseEvent, recipe: Recipe) {
    e.preventDefault()
    e.stopPropagation()

    if (!settings?.postUrl) {
      setMessage({ type: 'error', text: 'Configura una URL en Ajustes', recipeId: recipe.id })
      return
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      setMessage({ type: 'error', text: 'Sin ingredientes', recipeId: recipe.id })
      return
    }

    setSendingId(recipe.id)
    setMessage(null)

    const ingredients = recipe.ingredients.map(ing => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit
    }))

    try {
      const res = await fetch(settings.postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe: recipe.name,
          ingredients,
          timestamp: new Date().toISOString()
        })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Enviado', recipeId: recipe.id })
        setTimeout(() => setMessage(null), 2000)
      } else {
        setMessage({ type: 'error', text: `Error: ${res.status}`, recipeId: recipe.id })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión', recipeId: recipe.id })
    } finally {
      setSendingId(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
        Cargando...
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
          Recetas
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: showForm ? 'var(--card-border)' : 'var(--accent-green)',
            color: showForm ? 'var(--text-muted)' : '#fff'
          }}
        >
          {showForm ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateRecipe}
          className="p-4 rounded-xl mb-4"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}
        >
          <div className="grid gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                Nombre
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--foreground)'
                }}
                placeholder="Nombre de la receta"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--foreground)'
                }}
                placeholder="Descripción breve"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all w-fit"
              style={{ background: 'var(--accent-green)', color: '#fff' }}
            >
              Crear Receta
            </button>
          </div>
        </form>
      )}

      {recipes.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}
        >
          <p style={{ color: 'var(--text-muted)' }}>No hay recetas todavía</p>
          <p className="text-sm mt-1" style={{ color: 'var(--card-border)' }}>
            Crea tu primera receta para empezar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {recipes.map((recipe) => {
            const isSending = sendingId === recipe.id
            const recipeMessage = message?.recipeId === recipe.id ? message : null

            return (
              <div
                key={recipe.id}
                className="p-4 rounded-xl transition-all relative group"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}
              >
                <button
                  onClick={(e) => handleDeleteRecipe(e, recipe.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  style={{ background: 'var(--background)', color: 'var(--text-muted)' }}
                  title="Eliminar"
                >
                  ×
                </button>

                <Link href={`/recipes/${recipe.id}`} className="block mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ background: getIconColor(recipe.id) + '20', color: getIconColor(recipe.id) }}
                    >
                      {getRecipeIcon(recipe.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>
                        {recipe.name}
                      </h2>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {recipe.ingredients?.length || 0} ingredientes
                      </p>
                    </div>
                  </div>
                </Link>

                {recipeMessage && (
                  <div
                    className="mb-2 px-2 py-1 rounded text-xs text-center"
                    style={{
                      background: recipeMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: recipeMessage.type === 'success' ? '#22c55e' : '#ef4444'
                    }}
                  >
                    {recipeMessage.text}
                  </div>
                )}

                <button
                  onClick={(e) => handleSendRecipe(e, recipe)}
                  disabled={isSending}
                  className="w-full py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                  style={{ background: 'var(--accent-blue)', color: '#fff' }}
                >
                  {isSending ? 'Añadiendo...' : 'Añadir'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
