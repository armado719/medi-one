import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const type = searchParams.get('type')

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
          status: true,
          patient: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { date: 'desc' },
  })

  // Build data rows
  const rows = entries.map((e) => ({
    Fecha: new Date(e.date).toLocaleDateString('es-CO'),
    Tipo: e.type,
    Descripción: e.description,
    Paciente: e.invoice?.patient
      ? `${e.invoice.patient.firstName} ${e.invoice.patient.lastName}`
      : '—',
    'Monto (COP)': Number(e.amount),
    Estado: e.invoice?.status ?? 'MANUAL',
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 40 },
    { wch: 30 },
    { wch: 16 },
    { wch: 12 },
  ]

  // Header style (if XLSX supports it)
  const headerRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (ws[cellAddress]) {
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'C8857A' } },
        alignment: { horizontal: 'center' },
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Contabilidad MEDI ONE')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const date = new Date().toISOString().split('T')[0]
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="contabilidad-medione-${date}.xlsx"`,
    },
  })
}
