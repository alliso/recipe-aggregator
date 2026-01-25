'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Recipe, Ingredient } from '@/types'

export default function RecipeDetail() {
  const params = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', servings: 1 })
  const [showIngredientForm, setShowIngredientForm] = useState(false)
  const [ingredientForm, setIngredientForm] = useState({ name: '', quantity: '', unit: '', notes: '' })
  const [editingIngredient, setEditingIngredient] = useState<number | null>(null)

  useEffect(() => {
    fetchRecipe()
  }, [params.id])

  async function fetchRecipe() {
    try {
      const res = await fetch(`/api/recipes/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setRecipe(data)
        setFormData({ name: data.name, description: data.description || '', servings: data.servings })
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
    return <div className="text-center py-8">Cargando...</div>
  }

  if (!recipe) {
    return <div className="text-center py-8">Receta no encontrada</div>
  }

  return (
    <div>
      <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
        &larr; Volver a recetas
      </Link>

      {editing ? (
        <form onSubmit={handleUpdateRecipe} className="bg-white p-6 rounded-lg shadow mb-6">
          <h1 className="text-xl font-bold mb-4">Editar Receta</h1>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porciones</label>
              <input
                type="number"
                min="1"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
                className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{recipe.name}</h1>
              {recipe.description && (
                <p className="text-gray-600 mt-2">{recipe.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'}
              </p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Editar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Ingredientes</h2>
          <button
            onClick={() => {
              setShowIngredientForm(!showIngredientForm)
              setEditingIngredient(null)
              setIngredientForm({ name: '', quantity: '', unit: '', notes: '' })
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            {showIngredientForm ? 'Cancelar' : 'Agregar'}
          </button>
        </div>

        {showIngredientForm && (
          <form onSubmit={handleAddIngredient} className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                required
                placeholder="Nombre"
                value={ingredientForm.name}
                onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                required
                step="0.01"
                min="0"
                placeholder="Cantidad"
                value={ingredientForm.quantity}
                onChange={(e) => setIngredientForm({ ...ingredientForm, quantity: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                required
                placeholder="Unidad (g, ml, ud...)"
                value={ingredientForm.unit}
                onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Notas (opcional)"
                value={ingredientForm.notes}
                onChange={(e) => setIngredientForm({ ...ingredientForm, notes: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
            >
              Agregar Ingrediente
            </button>
          </form>
        )}

        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient.id} className="py-3">
                {editingIngredient === ingredient.id ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      required
                      value={ingredientForm.name}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={ingredientForm.quantity}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, quantity: e.target.value })}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      required
                      value={ingredientForm.unit}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateIngredient(ingredient.id)}
                        className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => {
                          setEditingIngredient(null)
                          setIngredientForm({ name: '', quantity: '', unit: '', notes: '' })
                        }}
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-900">{ingredient.name}</span>
                      <span className="text-gray-600 ml-2">
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                      {ingredient.notes && (
                        <span className="text-gray-400 text-sm ml-2">({ingredient.notes})</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditIngredient(ingredient)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteIngredient(ingredient.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
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
          <p className="text-gray-500 text-center py-4">No hay ingredientes todavía</p>
        )}
      </div>
    </div>
  )
}
