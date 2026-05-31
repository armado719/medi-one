import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createConsentFormSchema } from '@/validations/consentimiento'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'RECEPCIONISTA') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = { deletedAt: null }
  if (patientId) where.patientId = patientId

  const [data, total] = await Promise.all([
    prisma.consentForm.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true, documentType: true, documentNumber: true } },
        template: { select: { name: true, procedure: true } },
      },
    }),
    prisma.consentForm.count({ where }),
  ])

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'RECEPCIONISTA') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createConsentFormSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data
  const consentForm = await prisma.consentForm.create({
    data: {
      templateId: d.templateId,
      patientId: d.patientId,
      recordId: d.recordId || null,
      status: d.status,
      signedAt: d.status === 'FIRMADO' ? new Date() : null,
      notes: d.notes || null,
    },
    include: {
      template: true,
      patient: { select: { firstName: true, lastName: true, documentType: true, documentNumber: true } },
    },
  })

  return NextResponse.json(consentForm, { status: 201 })
}
