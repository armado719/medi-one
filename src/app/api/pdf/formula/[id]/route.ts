import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { FormulaMedicaPDF } from '@/lib/pdf/templates/FormulaMedicaPDF'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'RECEPCIONISTA') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const prescription = await prisma.prescription.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      patient: true,
      user: { select: { name: true } },
      items: true,
    },
  })

  if (!prescription) return NextResponse.json({ error: 'Fórmula no encontrada' }, { status: 404 })

  const typedPrescription = {
    ...prescription,
    createdAt: prescription.createdAt.toISOString(),
    updatedAt: prescription.updatedAt.toISOString(),
    patient: {
      ...prescription.patient,
      birthDate: prescription.patient.birthDate.toISOString(),
      createdAt: prescription.patient.createdAt.toISOString(),
      updatedAt: prescription.patient.updatedAt.toISOString(),
    },
    items: prescription.items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    user: { name: prescription.user?.name ?? 'Médico' },
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(FormulaMedicaPDF, { prescription: typedPrescription as any }) as any)
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="formula-${params.id}.pdf"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}
