import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { markPaidSchema, cancelInvoiceSchema } from '@/validations/factura'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      patient: true,
      user: { select: { name: true } },
      items: true,
      accountEntry: true,
    },
  })

  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })

  return NextResponse.json(invoice)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, deletedAt: null },
    include: { patient: { select: { firstName: true, lastName: true } } },
  })
  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })

  const body = await request.json()
  const { action } = body

  if (action === 'marcar_pagado') {
    if (invoice.status !== 'PENDIENTE') {
      return NextResponse.json({ error: 'Solo se pueden pagar facturas pendientes' }, { status: 400 })
    }
    const parsed = markPaidSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const [updated] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id: params.id },
        data: {
          status: 'PAGADO',
          paymentMethod: parsed.data.paymentMethod,
          paidAt: new Date(),
        },
      }),
      prisma.accountEntry.create({
        data: {
          invoiceId: params.id,
          type: 'INGRESO',
          amount: invoice.total,
          description: `Pago factura ${invoice.number} - ${invoice.patient.firstName} ${invoice.patient.lastName}`,
          userId: session.user.id,
        },
      }),
    ])
    return NextResponse.json(updated)
  }

  if (action === 'anular') {
    if (session.user.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'Solo administradores pueden anular facturas' }, { status: 403 })
    }
    if (invoice.status === 'ANULADO') {
      return NextResponse.json({ error: 'La factura ya está anulada' }, { status: 400 })
    }
    const parsed = cancelInvoiceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: 'ANULADO',
        cancelReason: parsed.data.cancelReason,
      },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
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

  await prisma.invoice.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
