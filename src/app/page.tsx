'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Recipe, AggregatedIngredient, Settings } from '@/types'

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
  const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
        selectedRecipes.delete(id)
        setSelectedRecipes(new Set(selectedRecipes))
      }
    } catch (error) {
      console.error('Error deleting recipe:', error)
    }
  }

  function toggleRecipe(e: React.MouseEvent, id: number) {
    if (!selectMode) return
    e.preventDefault()
    const newSelected = new Set(selectedRecipes)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRecipes(newSelected)
  }

  function toggleSelectMode() {
    if (selectMode) {
      setSelectedRecipes(new Set())
      setMessage(null)
    }
    setSelectMode(!selectMode)
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
      setMessage({ type: 'error', text: 'Configura una URL en Ajustes' })
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
        setSelectedRecipes(new Set())
        setSelectMode(false)
      } else {
        setMessage({ type: 'error', text: `Error: ${res.status}` })
      }
    } catch {
      setMessage({ type: 'error', text: 'No se pudo conectar' })
    } finally {
      setSending(false)
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
        <div className="flex gap-2">
          {recipes.length > 0 && (
            <button
              onClick={toggleSelectMode}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: selectMode ? 'var(--accent-blue)' : 'var(--card-border)',
                color: selectMode ? '#fff' : 'var(--text-muted)'
              }}
            >
              {selectMode ? 'Cancelar' : 'Seleccionar'}
            </button>
          )}
          {!selectMode && (
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
          )}
        </div>
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

      {showForm && (
        <form
          onSubmit={handleCreateRecipe}
          className="p-4 rounded-xl mb-4"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
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
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <p style={{ color: 'var(--text-muted)' }}>No hay recetas todavía</p>
          <p className="text-sm mt-1" style={{ color: 'var(--card-border)' }}>
            Crea tu primera receta para empezar
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {recipes.map((recipe) => {
              const isSelected = selectedRecipes.has(recipe.id)
              const cardStyle = {
                background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--card-bg)',
                border: isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--card-border)'
              }
              const cardClass = `p-4 rounded-xl transition-all relative group ${selectMode ? 'cursor-pointer' : 'hover:scale-[1.02]'}`

              const cardContent = (
                <>
                  {!selectMode && (
                    <button
                      onClick={(e) => handleDeleteRecipe(e, recipe.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      style={{ background: 'var(--background)', color: 'var(--text-muted)' }}
                      title="Eliminar"
                    >
                      ×
                    </button>
                  )}
                  {selectMode && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center text-xs"
                      style={{
                        background: isSelected ? 'var(--accent-blue)' : 'var(--card-border)',
                        color: isSelected ? '#fff' : 'transparent'
                      }}
                    >
                      ✓
                    </div>
                  )}
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
                </>
              )

              return selectMode ? (
                <div
                  key={recipe.id}
                  onClick={(e) => toggleRecipe(e, recipe.id)}
                  className={cardClass}
                  style={cardStyle}
                >
                  {cardContent}
                </div>
              ) : (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className={cardClass}
                  style={cardStyle}
                >
                  {cardContent}
                </Link>
              )
            })}
          </div>

          {selectMode && selectedRecipes.size > 0 && (
            <div
              className="mt-4 p-4 rounded-xl"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {selectedRecipes.size} receta{selectedRecipes.size > 1 ? 's' : ''} · {getAggregatedIngredients().length} ingredientes
                </span>
                {!settings?.postUrl && (
                  <Link
                    href="/settings"
                    className="text-xs underline"
                    style={{ color: 'var(--accent-blue)' }}
                  >
                    Configurar URL
                  </Link>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={sending || !settings?.postUrl}
                className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--accent-green)', color: '#fff' }}
              >
                {sending ? 'Enviando...' : 'Enviar Ingredientes'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
