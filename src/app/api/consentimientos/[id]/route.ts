import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'RECEPCIONISTA') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const form = await prisma.consentForm.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      patient: true,
      template: true,
    },
  })

  if (!form) return NextResponse.json({ error: 'Consentimiento no encontrado' }, { status: 404 })

  return NextResponse.json(form)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'RECEPCIONISTA') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { status, notes } = body

  const form = await prisma.consentForm.findFirst({
    where: { id: params.id, deletedAt: null },
  })
  if (!form) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const updated = await prisma.consentForm.update({
    where: { id: params.id },
    data: {
      ...(status && { status }),
      ...(status === 'FIRMADO' && !form.signedAt && { signedAt: new Date() }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      patient: true,
      template: true,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  await prisma.consentForm.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
