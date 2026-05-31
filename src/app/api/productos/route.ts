import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createProductSchema } from '@/validations/inventario'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const lowStockOnly = searchParams.get('lowStock') === 'true'

  const where: Record<string, unknown> = { deletedAt: null, isActive: true }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ]
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  const filtered = lowStockOnly
    ? products.filter((p) => Number(p.stockCurrent) <= Number(p.stockMinimum))
    : products

  // Stats
  const all = await prisma.product.findMany({ where: { deletedAt: null, isActive: true } })
  const lowStockCount = all.filter((p) => Number(p.stockCurrent) <= Number(p.stockMinimum)).length
  const totalValue = all.reduce((acc, p) => acc + Number(p.stockCurrent) * Number(p.unitPrice), 0)

  return NextResponse.json({
    data: filtered,
    stats: {
      total: all.length,
      lowStockCount,
      totalValue,
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = createProductSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data
  const product = await prisma.product.create({
    data: {
      name: d.name,
      description: d.description || null,
      unit: d.unit,
      stockCurrent: d.stockCurrent,
      stockMinimum: d.stockMinimum,
      unitPrice: d.unitPrice,
    },
  })

  // Create initial entry movement if stock > 0
  if (d.stockCurrent > 0) {
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        type: 'ENTRADA',
        quantity: d.stockCurrent,
        reason: 'Stock inicial',
        userId: session.user.id,
      },
    })
  }

  return NextResponse.json(product, { status: 201 })
}
