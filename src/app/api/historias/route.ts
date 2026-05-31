import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Only MEDICO and ADMINISTRADOR can access clinical records
  if (session.user.role === 'RECEPCIONISTA') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId')
  const type = searchParams.get('type')

  if (!patientId) {
    return NextResponse.json(
      { error: 'patientId es requerido' },
      { status: 400 }
    )
  }

  const records = await prisma.clinicalRecord.findMany({
    where: {
      patientId,
      deletedAt: null,
      ...(type ? { type: type as 'LABORAL' | 'ESTETICA' | 'CARDIOVASCULAR' } : {}),
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(records)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Only MEDICO and ADMINISTRADOR can create clinical records
  if (session.user.role === 'RECEPCIONISTA') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { patientId, type, data } = body

  if (!patientId || !type || !data) {
    return NextResponse.json(
      { error: 'patientId, type y data son requeridos' },
      { status: 400 }
    )
  }

  if (!['LABORAL', 'ESTETICA', 'CARDIOVASCULAR'].includes(type)) {
    return NextResponse.json(
      { error: 'Tipo de historia inválido' },
      { status: 400 }
    )
  }

  // Verify patient exists
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
  })

  if (!patient) {
    return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
  }

  const record = await prisma.clinicalRecord.create({
    data: {
      patientId,
      userId: session.user.id,
      type: type as 'LABORAL' | 'ESTETICA' | 'CARDIOVASCULAR',
      data,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'ClinicalRecord',
    entityId: record.id,
    changes: { patientId, type },
    ip: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json(record, { status: 201 })
}
