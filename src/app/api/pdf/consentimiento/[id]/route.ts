import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { ConsentimientoPDF } from '@/lib/pdf/templates/ConsentimientoPDF'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'RECEPCIONISTA') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const consentForm = await prisma.consentForm.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      template: true,
      patient: true,
    },
  })

  if (!consentForm) return NextResponse.json({ error: 'Consentimiento no encontrado' }, { status: 404 })

  const typedForm = {
    ...consentForm,
    createdAt: consentForm.createdAt.toISOString(),
    updatedAt: consentForm.updatedAt.toISOString(),
    signedAt: consentForm.signedAt?.toISOString() ?? null,
    template: {
      ...consentForm.template,
      createdAt: consentForm.template.createdAt.toISOString(),
      updatedAt: consentForm.template.updatedAt.toISOString(),
    },
    patient: {
      ...consentForm.patient,
      birthDate: consentForm.patient.birthDate.toISOString(),
      createdAt: consentForm.patient.createdAt.toISOString(),
      updatedAt: consentForm.patient.updatedAt.toISOString(),
    },
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(ConsentimientoPDF, { consentForm: typedForm as any }))
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="consentimiento-${params.id}.pdf"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}
