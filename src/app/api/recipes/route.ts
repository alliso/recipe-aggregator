import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      include: { ingredients: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(recipes)
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json({ error: 'Error fetching recipes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const recipe = await prisma.recipe.create({
      data: {
        name: body.name,
        description: body.description || null,
        servings: body.servings || 1
      }
    })
    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json({ error: 'Error creating recipe' }, { status: 500 })
  }
}
