import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; consentId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const consent = await prisma.dataConsent.findFirst({
    where: { id: params.consentId, patientId: params.id },
  })
  if (!consent) {
    return NextResponse.json({ error: 'Consentimiento no encontrado' }, { status: 404 })
  }
  if (consent.revokedAt) {
    return NextResponse.json({ error: 'El consentimiento ya está revocado' }, { status: 409 })
  }

  const updated = await prisma.dataConsent.update({
    where: { id: params.consentId },
    data: { revokedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'DataConsent',
    entityId: updated.id,
    changes: { revokedAt: updated.revokedAt },
    ip: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json(updated)
}
