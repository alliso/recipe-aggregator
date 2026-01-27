'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import type { Recipe, Ingredient, Settings } from '@/types'

const inputStyle = {
  background: 'var(--background)',
  border: '1px solid var(--card-border)',
  color: 'var(--foreground)'
}

export default function RecipeDetail() {
  const params = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', servings: 1, steps: '' })
  const [showIngredientForm, setShowIngredientForm] = useState(false)
  const [ingredientForm, setIngredientForm] = useState({ name: '', quantity: '', unit: '', notes: '' })
  const [editingIngredient, setEditingIngredient] = useState<number | null>(null)
  const [editingSteps, setEditingSteps] = useState(false)
  const [stepsInput, setStepsInput] = useState('')
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(new Set())
  const [settings, setSettings] = useState<Settings | null>(null)
  const [sending, setSending] = useState(false)
  const [sendMessage, setSendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchRecipe()
    fetchSettings()
  }, [params.id])

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

  function toggleIngredient(id: number) {
    setSelectedIngredients(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAllIngredients() {
    if (!recipe?.ingredients) return
    if (selectedIngredients.size === recipe.ingredients.length) {
      setSelectedIngredients(new Set())
    } else {
      setSelectedIngredients(new Set(recipe.ingredients.map(i => i.id)))
    }
  }

  async function handleSendIngredients() {
    if (!settings?.postUrl) {
      setSendMessage({ type: 'error', text: 'Configura una URL en Ajustes' })
      return
    }

    if (selectedIngredients.size === 0) {
      setSendMessage({ type: 'error', text: 'Selecciona al menos un ingrediente' })
      return
    }

    setSending(true)
    setSendMessage(null)

    const ingredientsToSend = recipe?.ingredients
      ?.filter(ing => selectedIngredients.has(ing.id))
      .map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit
      }))

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (settings.apiKey) headers['x-api-key'] = settings.apiKey

      const res = await fetch(settings.postUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipe: recipe?.name,
          ingredients: ingredientsToSend,
          timestamp: new Date().toISOString()
        })
      })

      if (res.ok) {
        setSendMessage({ type: 'success', text: 'Ingredientes enviados' })
        setSelectedIngredients(new Set())
        setTimeout(() => setSendMessage(null), 2000)
      } else {
        setSendMessage({ type: 'error', text: `Error: ${res.status}` })
      }
    } catch {
      setSendMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setSending(false)
    }
  }

  async function fetchRecipe() {
    try {
      const res = await fetch(`/api/recipes/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setRecipe(data)
        setFormData({ name: data.name, description: data.description || '', servings: data.servings, steps: data.steps || '' })
        setStepsInput(data.steps || '')
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching recipe:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateRecipe(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch(`/api/recipes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setEditing(false)
        fetchRecipe()
      }
    } catch (error) {
      console.error('Error updating recipe:', error)
    }
  }

  async function handleDeleteRecipe() {
    if (!confirm('¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/recipes/${params.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/')
      }
    } catch (error) {
      console.error('Error deleting recipe:', error)
    }
  }

  async function handleSaveSteps() {
    try {
      const res = await fetch(`/api/recipes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: stepsInput })
      })
      if (res.ok) {
        setEditingSteps(false)
        fetchRecipe()
      }
    } catch (error) {
      console.error('Error saving steps:', error)
    }
  }

  async function handleAddIngredient(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ingredientForm,
          quantity: parseFloat(ingredientForm.quantity),
          recipeId: parseInt(params.id as string)
        })
      })
      if (res.ok) {
        setIngredientForm({ name: '', quantity: '', unit: '', notes: '' })
        setShowIngredientForm(false)
        fetchRecipe()
      }
    } catch (error) {
      console.error('Error adding ingredient:', error)
    }
  }

  async function handleUpdateIngredient(id: number) {
    try {
      const res = await fetch(`/api/ingredients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ingredientForm,
          quantity: parseFloat(ingredientForm.quantity)
        })
      })
      if (res.ok) {
        setEditingIngredient(null)
        setIngredientForm({ name: '', quantity: '', unit: '', notes: '' })
        fetchRecipe()
      }
    } catch (error) {
      console.error('Error updating ingredient:', error)
    }
  }

  async function handleDeleteIngredient(id: number) {
    if (!confirm('¿Eliminar este ingrediente?')) return
    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchRecipe()
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error)
    }
  }

  function startEditIngredient(ingredient: Ingredient) {
    setEditingIngredient(ingredient.id)
    setIngredientForm({
      name: ingredient.name,
      quantity: ingredient.quantity.toString(),
      unit: ingredient.unit,
      notes: ingredient.notes || ''
    })
  }

  if (loading) {
    return <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Cargando...</div>
  }

  if (!recipe) {
    return <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Receta no encontrada</div>
  }

  return (
    <div>
      <Link
        href="/"
        className="text-sm mb-4 inline-block"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Volver a recetas
      </Link>

      {editing ? (
        <form
          onSubmit={handleUpdateRecipe}
          className="p-4 rounded-xl mb-4"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <h1 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Editar Receta
          </h1>
          <div className="grid gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Nombre</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Descripción</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Porciones</label>
              <input
                type="number"
                min="1"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
                className="w-24 rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--accent-green)', color: '#fff' }}
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--card-border)', color: 'var(--text-muted)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div
          className="p-4 rounded-xl mb-4"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                {recipe.name}
              </h1>
              {recipe.description && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{recipe.description}</p>
              )}
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                {recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(true)}
                className="text-sm font-medium"
                style={{ color: 'var(--accent-blue)' }}
              >
                Editar
              </button>
              <button
                onClick={handleDeleteRecipe}
                className="text-sm font-medium"
                style={{ color: '#ef4444' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="p-4 rounded-xl mb-4"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>Ingredientes</h2>
          <div className="flex gap-2">
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <button
                onClick={toggleAllIngredients}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: 'var(--background)', border: '1px solid var(--card-border)', color: 'var(--text-muted)' }}
              >
                {selectedIngredients.size === recipe.ingredients.length ? 'Ninguno' : 'Todos'}
              </button>
            )}
            <button
              onClick={() => {
                setShowIngredientForm(!showIngredientForm)
                setEditingIngredient(null)
                setIngredientForm({ name: '', quantity: '', unit: '', notes: '' })
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{
                background: showIngredientForm ? 'var(--card-border)' : 'var(--accent-blue)',
                color: showIngredientForm ? 'var(--text-muted)' : '#fff'
              }}
            >
              {showIngredientForm ? 'Cancelar' : '+ Agregar'}
            </button>
          </div>
        </div>

        {showIngredientForm && (
          <form
            onSubmit={handleAddIngredient}
            className="p-3 rounded-lg mb-4"
            style={{ background: 'var(--background)' }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input
                type="text"
                required
                placeholder="Nombre"
                value={ingredientForm.name}
                onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
              <input
                type="number"
                required
                step="0.01"
                min="0"
                placeholder="Cantidad"
                value={ingredientForm.quantity}
                onChange={(e) => setIngredientForm({ ...ingredientForm, quantity: e.target.value })}
                className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                required
                placeholder="Unidad"
                value={ingredientForm.unit}
                onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Notas"
                value={ingredientForm.notes}
                onChange={(e) => setIngredientForm({ ...ingredientForm, notes: e.target.value })}
                className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--accent-green)', color: '#fff' }}
            >
              Agregar
            </button>
          </form>
        )}

        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient) => (
              <li
                key={ingredient.id}
                className="p-3 rounded-lg"
                style={{ background: 'var(--background)' }}
              >
                {editingIngredient === ingredient.id ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      required
                      value={ingredientForm.name}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                      className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={ingredientForm.quantity}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, quantity: e.target.value })}
                      className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      required
                      value={ingredientForm.unit}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                      className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={inputStyle}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateIngredient(ingredient.id)}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{ background: 'var(--accent-green)', color: '#fff' }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingIngredient(null)
                          setIngredientForm({ name: '', quantity: '', unit: '', notes: '' })
                        }}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{ background: 'var(--card-border)', color: 'var(--text-muted)' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIngredients.has(ingredient.id)}
                        onChange={() => toggleIngredient(ingredient.id)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'var(--accent-blue)' }}
                      />
                      <div>
                        <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                          {ingredient.name}
                        </span>
                        <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                        {ingredient.notes && (
                          <span className="text-xs ml-2" style={{ color: 'var(--card-border)' }}>
                            ({ingredient.notes})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => startEditIngredient(ingredient)}
                        className="text-xs"
                        style={{ color: 'var(--accent-blue)' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteIngredient(ingredient.id)}
                        className="text-xs"
                        style={{ color: '#ef4444' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            No hay ingredientes todavía
          </p>
        )}

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
            {sendMessage && (
              <div
                className="mb-3 px-3 py-2 rounded-lg text-sm text-center"
                style={{
                  background: sendMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: sendMessage.type === 'success' ? '#22c55e' : '#ef4444'
                }}
              >
                {sendMessage.text}
              </div>
            )}
            <button
              onClick={handleSendIngredients}
              disabled={sending || selectedIngredients.size === 0}
              className="w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{ background: 'var(--accent-blue)', color: '#fff' }}
            >
              {sending ? 'Enviando...' : `Enviar ${selectedIngredients.size > 0 ? `(${selectedIngredients.size})` : ''}`}
            </button>
          </div>
        )}
      </div>

      <div
        className="p-4 rounded-xl"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>Pasos</h2>
          <button
            onClick={() => {
              if (editingSteps) {
                setStepsInput(recipe.steps || '')
              }
              setEditingSteps(!editingSteps)
            }}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              background: editingSteps ? 'var(--card-border)' : 'var(--accent-blue)',
              color: editingSteps ? 'var(--text-muted)' : '#fff'
            }}
          >
            {editingSteps ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {editingSteps ? (
          <div>
            <textarea
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              placeholder="Escribe los pasos de la receta usando Markdown...

Ejemplo:
## Preparación
1. Precalentar el horno a 180°C
2. Mezclar los ingredientes secos

## Cocción
1. Hornear durante 25 minutos
2. Dejar enfriar"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none min-h-[200px] font-mono"
              style={inputStyle}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSaveSteps}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--accent-green)', color: '#fff' }}
              >
                Guardar
              </button>
            </div>
          </div>
        ) : recipe.steps ? (
          <div
            className="prose prose-sm max-w-none"
            style={{ color: 'var(--foreground)' }}
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4" style={{ color: 'var(--foreground)' }}>{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-4" style={{ color: 'var(--foreground)' }}>{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-medium mb-2 mt-3" style={{ color: 'var(--foreground)' }}>{children}</h3>,
                p: ({ children }) => <p className="mb-2" style={{ color: 'var(--foreground)' }}>{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-2" style={{ color: 'var(--foreground)' }}>{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2" style={{ color: 'var(--foreground)' }}>{children}</ol>,
                li: ({ children }) => <li className="mb-1" style={{ color: 'var(--foreground)' }}>{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--background)', color: 'var(--accent-blue)' }}>{children}</code>,
                blockquote: ({ children }) => <blockquote className="border-l-4 pl-3 italic my-2" style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}>{children}</blockquote>,
              }}
            >
              {recipe.steps}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            No hay pasos todavía. Haz clic en &quot;Editar&quot; para añadirlos.
          </p>
        )}
      </div>
    </div>
  )
}
