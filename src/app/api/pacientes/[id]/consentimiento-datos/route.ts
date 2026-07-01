import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { getActiveDataConsent } from '@/lib/dataConsent'
import { createDataConsentSchema } from '@/validations/dataConsent'
import { getDataConsentContentHash } from '@/lib/legal/dataConsentHash'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const [active, history] = await Promise.all([
    getActiveDataConsent(params.id),
    prisma.dataConsent.findMany({
      where: { patientId: params.id },
      orderBy: { acceptedAt: 'desc' },
      include: { acceptedBy: { select: { name: true } } },
    }),
  ])

  return NextResponse.json({ active, history })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const patient = await prisma.patient.findFirst({
    where: { id: params.id, deletedAt: null },
  })
  if (!patient) {
    return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = createDataConsentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const consent = await prisma.dataConsent.create({
    data: {
      patientId: params.id,
      version: parsed.data.version,
      contentHash: getDataConsentContentHash(),
      acceptedById: session.user.id,
      signature: parsed.data.signature || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'DataConsent',
    entityId: consent.id,
    changes: { patientId: params.id, version: consent.version },
    ip: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json(consent, { status: 201 })
}
