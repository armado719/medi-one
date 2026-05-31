import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Citas hoy (all statuses)
  const citasHoy = await prisma.appointment.count({
    where: {
      date: { gte: todayStart, lte: todayEnd },
      deletedAt: null,
    },
  })

  // Pacientes atendidos hoy (CONFIRMADA)
  const pacientesAtendidos = await prisma.appointment.count({
    where: {
      date: { gte: todayStart, lte: todayEnd },
      status: 'CONFIRMADA',
      deletedAt: null,
    },
  })

  // Today's appointments detail
  const citasHoyDetalle = await prisma.appointment.findMany({
    where: {
      date: { gte: todayStart, lte: todayEnd },
      deletedAt: null,
    },
    include: {
      patient: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: 'asc' },
  })

  // Role-restricted data for ADMINISTRADOR
  let ingresosMes = 0
  let facturasPendientes = 0
  let ingresosUltimos6Meses: { mes: string; total: number }[] = []
  let procedimientosTop: { nombre: string; total: number }[] = []
  let alertas: {
    stockBajo: { id: string; name: string; stockCurrent: number; stockMinimum: number }[]
    facturasPendientes: { id: string; number: string; total: number; createdAt: Date }[]
  } = { stockBajo: [], facturasPendientes: [] }
  let pacientesNuevosVsRecurrentes: { mes: string; nuevos: number; recurrentes: number }[] = []
  let ultimasHistorias: {
    id: string
    patientName: string
    type: string
    createdAt: Date
    doctorName: string
  }[] = []

  if (session.user.role === 'ADMINISTRADOR') {
    // Ingresos del mes
    const ingresosResult = await prisma.accountEntry.aggregate({
      where: {
        type: 'INGRESO',
        date: { gte: monthStart, lte: monthEnd },
        deletedAt: null,
      },
      _sum: { amount: true },
    })
    ingresosMes = Number(ingresosResult._sum.amount ?? 0)

    // Facturas pendientes
    facturasPendientes = await prisma.invoice.count({
      where: { status: 'PENDIENTE', deletedAt: null },
    })

    // Ingresos últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const mStart = startOfMonth(monthDate)
      const mEnd = endOfMonth(monthDate)
      const result = await prisma.accountEntry.aggregate({
        where: {
          type: 'INGRESO',
          date: { gte: mStart, lte: mEnd },
          deletedAt: null,
        },
        _sum: { amount: true },
      })
      ingresosUltimos6Meses.push({
        mes: format(monthDate, 'MMM', { locale: es }),
        total: Number(result._sum.amount ?? 0),
      })
    }

    // Procedimientos top (from appointments)
    const aptTypes = await prisma.appointment.groupBy({
      by: ['type'],
      where: { deletedAt: null },
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } },
      take: 5,
    })
    procedimientosTop = aptTypes.map((t) => ({
      nombre: t.type,
      total: t._count.type,
    }))

    // Stock bajo alerts
    const stockBajo = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, name: true, stockCurrent: true, stockMinimum: true },
    })
    alertas.stockBajo = stockBajo
      .filter((p) => Number(p.stockCurrent) <= Number(p.stockMinimum))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        stockCurrent: Number(p.stockCurrent),
        stockMinimum: Number(p.stockMinimum),
      }))

    // Facturas pendientes >7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const facturasVencidas = await prisma.invoice.findMany({
      where: {
        status: 'PENDIENTE',
        createdAt: { lte: sevenDaysAgo },
        deletedAt: null,
      },
      select: { id: true, number: true, total: true, createdAt: true },
      take: 5,
      orderBy: { createdAt: 'asc' },
    })
    alertas.facturasPendientes = facturasVencidas.map((f) => ({
      id: f.id,
      number: f.number,
      total: Number(f.total),
      createdAt: f.createdAt,
    }))

    // Pacientes nuevos vs recurrentes (últimos 6 meses)
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const mStart = startOfMonth(monthDate)
      const mEnd = endOfMonth(monthDate)

      const nuevos = await prisma.patient.count({
        where: {
          createdAt: { gte: mStart, lte: mEnd },
          deletedAt: null,
        },
      })

      const recurrentes = await prisma.appointment.count({
        where: {
          date: { gte: mStart, lte: mEnd },
          deletedAt: null,
          patient: {
            createdAt: { lt: mStart },
          },
        },
      })

      pacientesNuevosVsRecurrentes.push({
        mes: format(monthDate, 'MMM', { locale: es }),
        nuevos,
        recurrentes,
      })
    }

    // Últimas historias clínicas
    const lastRecords = await prisma.clinicalRecord.findMany({
      where: { deletedAt: null },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    ultimasHistorias = lastRecords.map((r) => ({
      id: r.id,
      patientName: `${r.patient.firstName} ${r.patient.lastName}`,
      type: r.type,
      createdAt: r.createdAt,
      doctorName: r.user.name,
    }))
  }

  // MEDICO sees recent clinical records too
  if (session.user.role === 'MEDICO') {
    const lastRecords = await prisma.clinicalRecord.findMany({
      where: { deletedAt: null, userId: session.user.id },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    ultimasHistorias = lastRecords.map((r) => ({
      id: r.id,
      patientName: `${r.patient.firstName} ${r.patient.lastName}`,
      type: r.type,
      createdAt: r.createdAt,
      doctorName: r.user.name,
    }))
  }

  return NextResponse.json({
    citasHoy,
    pacientesAtendidos,
    ingresosMes,
    facturasPendientes,
    ingresosUltimos6Meses,
    procedimientosTop,
    citasHoyDetalle: citasHoyDetalle.map((c) => ({
      id: c.id,
      patientName: `${c.patient.firstName} ${c.patient.lastName}`,
      patientId: c.patientId,
      date: c.date,
      type: c.type,
      status: c.status,
    })),
    alertas,
    pacientesNuevosVsRecurrentes,
    ultimasHistorias,
    userRole: session.user.role,
  })
}
