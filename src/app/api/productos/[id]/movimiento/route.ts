import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { movimientoSchema } from '@/validations/inventario'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const product = await prisma.product.findFirst({ where: { id: params.id, deletedAt: null } })
  if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const body = await request.json()
  const parsed = movimientoSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { type, quantity, reason } = parsed.data
  const currentStock = Number(product.stockCurrent)
  let newStock: number

  if (type === 'ENTRADA') {
    newStock = currentStock + quantity
  } else if (type === 'SALIDA') {
    newStock = currentStock - quantity
  } else {
    // AJUSTE: quantity is the new absolute value
    newStock = quantity
  }

  const [movement] = await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: {
        productId: params.id,
        type,
        quantity: quantity,
        reason: reason || null,
        userId: session.user.id,
      },
    }),
    prisma.product.update({
      where: { id: params.id },
      data: { stockCurrent: newStock },
    }),
  ])

  const warn = newStock <= Number(product.stockMinimum)

  return NextResponse.json({ movement, newStock, warn }, { status: 201 })
}
