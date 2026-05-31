import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPrescriptionSchema } from '@/validations/formula'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'RECEPCIONISTA') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId') || ''
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = { deletedAt: null }
  if (patientId) where.patientId = patientId
  if (search) {
    where.OR = [
      { patient: { firstName: { contains: search } } },
      { patient: { lastName: { contains: search } } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true, documentType: true, documentNumber: true } },
        user: { select: { name: true } },
        items: true,
      },
    }),
    prisma.prescription.count({ where }),
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
  const parsed = createPrescriptionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data
  const prescription = await prisma.prescription.create({
    data: {
      patientId: d.patientId,
      userId: session.user.id,
      recordId: d.recordId || null,
      diagnosis: d.diagnosis || null,
      instructions: d.instructions || null,
      items: {
        create: d.items.map((item) => ({
          medication: item.medication,
          concentration: item.concentration || null,
          form: item.form || null,
          dose: item.dose,
          frequency: item.frequency,
          duration: item.duration,
          route: item.route || null,
        })),
      },
    },
    include: {
      items: true,
      patient: { select: { firstName: true, lastName: true, documentType: true, documentNumber: true, birthDate: true } },
      user: { select: { name: true } },
    },
  })

  return NextResponse.json(prescription, { status: 201 })
}
