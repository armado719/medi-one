import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { HistoriaLaboralPDF } from '@/lib/pdf/templates/HistoriaLaboralPDF'
import { HistoriaEsteticaPDF } from '@/lib/pdf/templates/HistoriaEsteticaPDF'
import { HistoriaCardiovascularPDF } from '@/lib/pdf/templates/HistoriaCardiovascularPDF'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (session.user.role === 'RECEPCIONISTA') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const record = await prisma.clinicalRecord.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      patient: true,
      user: { select: { name: true } },
    },
  })

  if (!record) {
    return NextResponse.json({ error: 'Historia no encontrada' }, { status: 404 })
  }

  let pdfElement
  const typedRecord = {
    ...record,
    createdAt: record.createdAt.toISOString(),
    patient: {
      ...record.patient,
      birthDate: record.patient.birthDate.toISOString(),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: record.data as any,
    user: { name: record.user?.name ?? 'Médico' },
  }

  switch (record.type) {
    case 'LABORAL':
      pdfElement = createElement(HistoriaLaboralPDF, { record: typedRecord })
      break
    case 'ESTETICA':
      pdfElement = createElement(HistoriaEsteticaPDF, { record: typedRecord })
      break
    case 'CARDIOVASCULAR':
      pdfElement = createElement(HistoriaCardiovascularPDF, { record: typedRecord })
      break
    default:
      return NextResponse.json({ error: 'Tipo no soportado' }, { status: 400 })
  }

  try {
    const buffer = await renderToBuffer(pdfElement as any)
    const filename = `historia-${record.type.toLowerCase()}-${record.id}.pdf`

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}
