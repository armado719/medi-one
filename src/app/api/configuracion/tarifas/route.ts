import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tarifaSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  price: z.coerce.number().positive('El precio debe ser positivo'),
  isActive: z.boolean().default(true),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const tarifas = await prisma.procedureRate.findMany({
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(tarifas)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = tarifaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const tarifa = await prisma.procedureRate.create({
    data: {
      name: parsed.data.name,
      price: parsed.data.price,
      isActive: parsed.data.isActive,
    },
  })

  return NextResponse.json(tarifa, { status: 201 })
}
