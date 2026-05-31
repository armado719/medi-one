import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createInvoiceSchema } from '@/validations/factura'
import { Decimal } from '@prisma/client/runtime/library'

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `FAC-${year}-`

  const last = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
  })

  let next = 1
  if (last) {
    const parts = last.number.split('-')
    next = parseInt(parts[parts.length - 1]) + 1
  }

  return `${prefix}${String(next).padStart(4, '0')}`
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = { deletedAt: null }

  if (search) {
    where.OR = [
      { number: { contains: search } },
      { patient: { firstName: { contains: search } } },
      { patient: { lastName: { contains: search } } },
    ]
  }
  if (status) where.status = status
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }
    where.createdAt = dateFilter
  }

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true, documentNumber: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ])

  // Stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const [pendingCount, paidToday, monthTotal] = await Promise.all([
    prisma.invoice.count({ where: { deletedAt: null, status: 'PENDIENTE' } }),
    prisma.invoice.aggregate({
      where: { deletedAt: null, status: 'PAGADO', paidAt: { gte: today, lt: tomorrow } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { deletedAt: null, status: 'PAGADO', paidAt: { gte: monthStart } },
      _sum: { total: true },
    }),
  ])

  return NextResponse.json({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: {
      pendingCount,
      paidToday: Number(paidToday._sum.total ?? 0),
      monthTotal: Number(monthTotal._sum.total ?? 0),
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = createInvoiceSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data

  // Calculate totals
  const subtotal = d.items.reduce((acc, item) => acc + item.subtotal, 0)
  let discountAmount = 0
  if (d.discountType === 'PORCENTAJE') {
    discountAmount = subtotal * (d.discount / 100)
  } else {
    discountAmount = d.discount
  }
  const afterDiscount = subtotal - discountAmount
  const taxAmount = d.items.reduce((acc, item) => {
    const itemAfterDiscount = item.subtotal * (1 - discountAmount / subtotal || 0)
    return acc + itemAfterDiscount * (item.taxRate / 100)
  }, 0)
  const total = afterDiscount + taxAmount

  const invoiceNumber = await generateInvoiceNumber()

  const invoice = await prisma.invoice.create({
    data: {
      number: invoiceNumber,
      patientId: d.patientId,
      userId: session.user.id,
      appointmentId: d.appointmentId || null,
      status: 'PENDIENTE',
      paymentMethod: d.paymentMethod || null,
      subtotal: new Decimal(subtotal.toFixed(2)),
      discount: new Decimal(discountAmount.toFixed(2)),
      discountType: d.discountType,
      taxAmount: new Decimal(taxAmount.toFixed(2)),
      total: new Decimal(total.toFixed(2)),
      notes: d.notes || null,
      items: {
        create: d.items.map((item) => ({
          description: item.description,
          quantity: new Decimal(item.quantity.toFixed(2)),
          unitPrice: new Decimal(item.unitPrice.toFixed(2)),
          taxRate: new Decimal(item.taxRate.toFixed(2)),
          subtotal: new Decimal(item.subtotal.toFixed(2)),
        })),
      },
    },
    include: {
      items: true,
      patient: { select: { firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(invoice, { status: 201 })
}
