import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const egresoSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser positivo'),
  fecha: z.string().optional(),
  notas: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const type = searchParams.get('type') // INGRESO | EGRESO | null

  const where: Record<string, unknown> = { deletedAt: null }

  if (type && (type === 'INGRESO' || type === 'EGRESO')) {
    where.type = type
  }

  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }
    where.date = dateFilter
  }

  const entries = await prisma.accountEntry.findMany({
    where,
    include: {
      invoice: {
        select: {
          number: true,
          patient: { select: { firstName: true, lastName: true } },
        },
      },
      user: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
  })

  // Summary
  const ingresos = entries
    .filter((e) => e.type === 'INGRESO')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const egresos = entries
    .filter((e) => e.type === 'EGRESO')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      type: e.type,
      amount: Number(e.amount),
      description: e.description,
      date: e.date,
      invoiceNumber: e.invoice?.number ?? null,
      patientName: e.invoice?.patient
        ? `${e.invoice.patient.firstName} ${e.invoice.patient.lastName}`
        : null,
      createdBy: e.user.name,
    })),
    summary: {
      totalIngresos: ingresos,
      totalEgresos: egresos,
      utilidadNeta: ingresos - egresos,
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = egresoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { descripcion, monto, fecha, notas } = parsed.data

  const entry = await prisma.accountEntry.create({
    data: {
      type: 'EGRESO',
      amount: monto,
      description: notas ? `${descripcion} — ${notas}` : descripcion,
      date: fecha ? new Date(fecha) : new Date(),
      userId: session.user.id,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'AccountEntry',
    entityId: entry.id,
    changes: { type: 'EGRESO', monto, descripcion },
    ip: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json(entry, { status: 201 })
}
