import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const ingredient = await prisma.ingredient.create({
      data: {
        name: body.name,
        quantity: body.quantity,
        unit: body.unit,
        notes: body.notes || null,
        recipeId: body.recipeId
      }
    })

    return NextResponse.json(ingredient, { status: 201 })
  } catch (error) {
    console.error('Error creating ingredient:', error)
    return NextResponse.json({ error: 'Error creating ingredient' }, { status: 500 })
  }
}
