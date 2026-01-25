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
      setMessage({ type: 'error', text: 'Configura una URL de destino primero' })
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
        setMessage({ type: 'success', text: 'Ingredientes enviados correctamente' })
      } else {
        setMessage({ type: 'error', text: `Error: ${res.status} ${res.statusText}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'No se pudo conectar con la URL de destino' })
    } finally {
      setSending(false)
    }
  }

  const aggregatedIngredients = getAggregatedIngredients()

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Enviar Ingredientes</h1>

      {!settings?.postUrl && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <p className="text-yellow-800">
            No hay URL configurada.{' '}
            <Link href="/settings" className="font-medium underline">
              Configura una URL
            </Link>{' '}
            para poder enviar ingredientes.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Seleccionar Recetas</h2>
            <button
              onClick={selectAll}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {selectedRecipes.size === recipes.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
          </div>

          {recipes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No hay recetas.{' '}
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                Crea una receta
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recipes.map(recipe => (
                <li key={recipe.id} className="py-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRecipes.has(recipe.id)}
                      onChange={() => toggleRecipe(recipe.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">{recipe.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({recipe.ingredients?.length || 0} ingredientes)
                      </span>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h2>

          {selectedRecipes.size === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Selecciona recetas para ver los ingredientes
            </p>
          ) : aggregatedIngredients.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Las recetas seleccionadas no tienen ingredientes
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 mb-4">
              {aggregatedIngredients.map((ing, idx) => (
                <li key={idx} className="py-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">{ing.name}</span>
                    <span className="text-gray-600">
                      {ing.totalQuantity} {ing.unit}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    De: {ing.fromRecipes.join(', ')}
                  </div>
                </li>
              ))}
            </ul>
          )}

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

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 mb-3">
              URL destino: {settings?.postUrl || 'No configurada'}
            </p>
            <button
              onClick={handleSend}
              disabled={sending || selectedRecipes.size === 0 || !settings?.postUrl}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Enviando...' : 'Enviar Ingredientes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
