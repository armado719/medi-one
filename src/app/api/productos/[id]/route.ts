import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createProductSchema } from '@/validations/inventario'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const product = await prisma.product.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      movements: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      },
    },
  })

  if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  return NextResponse.json(product)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const product = await prisma.product.findFirst({ where: { id: params.id, deletedAt: null } })
  if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const body = await request.json()
  const parsed = createProductSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data
  const updated = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: d.name,
      description: d.description || null,
      unit: d.unit,
      stockMinimum: new Decimal(d.stockMinimum.toFixed(2)),
      unitPrice: new Decimal(d.unitPrice.toFixed(2)),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  await prisma.product.update({
    where: { id: params.id },
    data: { deletedAt: new Date(), isActive: false },
  })

  return NextResponse.json({ success: true })
}
