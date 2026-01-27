export interface Recipe {
  id: number
  name: string
  description: string | null
  steps: string | null
  servings: number
  createdAt: Date
  updatedAt: Date
  ingredients?: Ingredient[]
}

export interface Ingredient {
  id: number
  name: string
  quantity: number
  unit: string
  notes: string | null
  recipeId: number
  createdAt: Date
  updatedAt: Date
}

export interface Settings {
  id: number
  postUrl: string
  apiKey: string
  createdAt: Date
  updatedAt: Date
}

export interface RecipeFormData {
  name: string
  description?: string
  steps?: string
  servings?: number
}

export interface IngredientFormData {
  name: string
  quantity: number
  unit: string
  notes?: string
  recipeId: number
}

export interface AggregatedIngredient {
  name: string
  totalQuantity: number
  unit: string
  fromRecipes: string[]
}
