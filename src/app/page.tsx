'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Recipe } from '@/types'

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', servings: 1 })

  useEffect(() => {
    fetchRecipes()
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

  async function handleDeleteRecipe(id: number) {
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

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Recetas</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancelar' : 'Nueva Receta'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateRecipe} className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de la receta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción (opcional)"
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
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors w-fit"
            >
              Crear Receta
            </button>
          </div>
        </form>
      )}

      {recipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No hay recetas todavía</p>
          <p className="text-sm text-gray-400 mt-1">Crea tu primera receta para empezar</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link href={`/recipes/${recipe.id}`} className="block">
                    <h2 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                      {recipe.name}
                    </h2>
                    {recipe.description && (
                      <p className="text-gray-600 text-sm mt-1">{recipe.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>{recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'}</span>
                      <span>{recipe.ingredients?.length || 0} ingredientes</span>
                    </div>
                  </Link>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
