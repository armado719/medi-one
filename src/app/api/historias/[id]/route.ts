import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export async function GET(
  request: NextRequest,
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
      user: { select: { id: true, name: true } },
      patient: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  if (!record) {
    return NextResponse.json({ error: 'Historia no encontrada' }, { status: 404 })
  }

  await logAudit({
    userId: session.user.id,
    action: 'VIEW',
    entity: 'ClinicalRecord',
    entityId: params.id,
    ip: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json(record)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  await prisma.clinicalRecord.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'ClinicalRecord',
    entityId: params.id,
    ip: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true })
}
