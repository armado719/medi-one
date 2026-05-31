import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTemplateSchema } from '@/validations/consentimiento'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'RECEPCIONISTA') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') !== 'false'

  const templates = await prisma.consentTemplate.findMany({
    where: { deletedAt: null, ...(activeOnly ? { isActive: true } : {}) },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(templates)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Solo administradores pueden crear plantillas' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createTemplateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const template = await prisma.consentTemplate.create({
    data: {
      name: parsed.data.name,
      procedure: parsed.data.procedure,
      content: parsed.data.content,
    },
  })

  return NextResponse.json(template, { status: 201 })
}
