#!/usr/bin/env node
/**
 * Servidor MCP (stdio) sobre la API REST de Recipe Aggregator.
 *
 * Apunta por defecto al despliegue de producción; se puede cambiar con
 * RECIPES_BASE_URL (p.ej. http://localhost:3000 para desarrollo).
 * Si algún día la API pasa a requerir autenticación, RECIPES_API_KEY se
 * envía como cabecera x-api-key.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js'

const BASE_URL = (process.env.RECIPES_BASE_URL || 'https://recipes.alliso.es').replace(/\/+$/, '')
const API_KEY = process.env.RECIPES_API_KEY || ''
const TIMEOUT_MS = 15000

async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (API_KEY) headers['x-api-key'] = API_KEY

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    })
  } catch (error) {
    throw new Error(`No se pudo contactar con ${BASE_URL}${path}: ${error.message}`)
  }

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(`${method} ${path} devolvió una respuesta no-JSON (HTTP ${res.status})`)
    }
  }

  if (!res.ok) {
    throw new Error(`${method} ${path} falló (HTTP ${res.status}): ${data?.error ?? text ?? 'sin detalle'}`)
  }

  return data
}

const summarize = (recipe) => ({
  id: recipe.id,
  name: recipe.name,
  description: recipe.description,
  servings: recipe.servings,
  ingredientCount: recipe.ingredients?.length ?? 0,
  hasSteps: Boolean(recipe.steps)
})

const round = (n) => Math.round(n * 1000) / 1000

const TOOLS = [
  {
    name: 'list_recipes',
    description:
      'Lista las recetas con un resumen (id, nombre, descripción, raciones, nº de ingredientes). ' +
      'No incluye los pasos ni el detalle de ingredientes: usa get_recipe para eso.',
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Filtro opcional; busca el texto en el nombre y la descripción (sin distinguir mayúsculas).'
        }
      }
    },
    async run({ search }) {
      const recipes = await api('/api/recipes')
      const needle = search?.trim().toLowerCase()
      const filtered = needle
        ? recipes.filter((r) =>
            `${r.name} ${r.description ?? ''}`.toLowerCase().includes(needle)
          )
        : recipes
      return { count: filtered.length, recipes: filtered.map(summarize) }
    }
  },
  {
    name: 'get_recipe',
    description: 'Devuelve una receta completa: pasos en Markdown e ingredientes con cantidades.',
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer', description: 'ID de la receta.' } },
      required: ['id']
    },
    run: ({ id }) => api(`/api/recipes/${id}`)
  },
  {
    name: 'create_recipe',
    description:
      'Crea una receta. Los ingredientes se añaden después con add_ingredient. ' +
      'Los pasos van en Markdown.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre de la receta.' },
        description: { type: 'string' },
        steps: { type: 'string', description: 'Pasos de preparación en Markdown.' },
        servings: { type: 'integer', minimum: 1, description: 'Raciones (por defecto 1).' }
      },
      required: ['name']
    },
    async run({ name, description, steps, servings }) {
      const recipe = await api('/api/recipes', {
        method: 'POST',
        body: { name, description, servings }
      })
      // POST /api/recipes ignora `steps`; hay que fijarlos con un PUT posterior.
      if (steps) return api(`/api/recipes/${recipe.id}`, { method: 'PUT', body: { steps } })
      return recipe
    }
  },
  {
    name: 'update_recipe',
    description: 'Actualiza los campos indicados de una receta. Los omitidos se dejan intactos.',
    annotations: { idempotentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        description: { type: 'string' },
        steps: { type: 'string', description: 'Pasos de preparación en Markdown (reemplaza los actuales).' },
        servings: { type: 'integer', minimum: 1 }
      },
      required: ['id']
    },
    run: ({ id, ...fields }) => api(`/api/recipes/${id}`, { method: 'PUT', body: fields })
  },
  {
    name: 'delete_recipe',
    description: 'Borra una receta y todos sus ingredientes. Irreversible.',
    annotations: { destructiveHint: true, idempotentHint: true },
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer' } },
      required: ['id']
    },
    run: ({ id }) => api(`/api/recipes/${id}`, { method: 'DELETE' })
  },
  {
    name: 'add_ingredient',
    description: 'Añade un ingrediente a una receta existente.',
    inputSchema: {
      type: 'object',
      properties: {
        recipeId: { type: 'integer' },
        name: { type: 'string' },
        quantity: { type: 'number' },
        unit: { type: 'string', description: 'Unidad, p.ej. "g", "ml", "ud", "cucharada".' },
        notes: { type: 'string' }
      },
      required: ['recipeId', 'name', 'quantity', 'unit']
    },
    run: (args) => api('/api/ingredients', { method: 'POST', body: args })
  },
  {
    name: 'update_ingredient',
    description: 'Actualiza los campos indicados de un ingrediente. Los omitidos se dejan intactos.',
    annotations: { idempotentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        quantity: { type: 'number' },
        unit: { type: 'string' },
        notes: { type: 'string' }
      },
      required: ['id']
    },
    run: ({ id, ...fields }) => api(`/api/ingredients/${id}`, { method: 'PUT', body: fields })
  },
  {
    name: 'delete_ingredient',
    description: 'Borra un ingrediente de una receta. Irreversible.',
    annotations: { destructiveHint: true, idempotentHint: true },
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer' } },
      required: ['id']
    },
    run: ({ id }) => api(`/api/ingredients/${id}`, { method: 'DELETE' })
  },
  {
    name: 'shopping_list',
    description:
      'Agrega los ingredientes de varias recetas en una lista de la compra, sumando las cantidades ' +
      'que compartan nombre y unidad. Se puede pedir un número de raciones distinto por receta y ' +
      'las cantidades se escalan proporcionalmente.',
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        recipes: {
          type: 'array',
          minItems: 1,
          description: 'Recetas a incluir.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              servings: {
                type: 'integer',
                minimum: 1,
                description: 'Raciones deseadas; por defecto, las de la receta (sin escalar).'
              }
            },
            required: ['id']
          }
        }
      },
      required: ['recipes']
    },
    async run({ recipes }) {
      const fetched = await Promise.all(recipes.map((r) => api(`/api/recipes/${r.id}`)))
      const items = new Map()

      fetched.forEach((recipe, i) => {
        const wanted = recipes[i].servings
        const base = recipe.servings || 1
        const scale = wanted ? wanted / base : 1

        for (const ing of recipe.ingredients ?? []) {
          const unit = ing.unit.trim()
          const key = `${ing.name.trim().toLowerCase()}|${unit.toLowerCase()}`
          const entry = items.get(key) ?? {
            name: ing.name.trim(),
            unit,
            totalQuantity: 0,
            fromRecipes: []
          }
          entry.totalQuantity += ing.quantity * scale
          if (!entry.fromRecipes.includes(recipe.name)) entry.fromRecipes.push(recipe.name)
          items.set(key, entry)
        }
      })

      const list = [...items.values()]
        .map((i) => ({ ...i, totalQuantity: round(i.totalQuantity) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'))

      return {
        recipes: fetched.map((r, i) => ({
          id: r.id,
          name: r.name,
          servings: recipes[i].servings ?? r.servings
        })),
        items: list
      }
    }
  }
]

const server = new Server(
  { name: 'recipe-aggregator', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(({ name, description, inputSchema, annotations }) => ({
    name,
    description,
    inputSchema,
    ...(annotations && { annotations })
  }))
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = TOOLS.find((t) => t.name === request.params.name)
  if (!tool) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Herramienta desconocida: ${request.params.name}` }]
    }
  }

  try {
    const result = await tool.run(request.params.arguments ?? {})
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: error.message }] }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`[recipe-aggregator-mcp] conectado a ${BASE_URL}`)
