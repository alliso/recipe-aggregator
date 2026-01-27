import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 1 }
    })

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 1, postUrl: '', apiKey: '' }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { postUrl: body.postUrl, apiKey: body.apiKey ?? '' },
      create: { id: 1, postUrl: body.postUrl, apiKey: body.apiKey ?? '' }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Error updating settings' }, { status: 500 })
  }
}
