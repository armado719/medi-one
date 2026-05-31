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

  const prescription = await prisma.prescription.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      patient: true,
      user: { select: { name: true } },
      items: true,
    },
  })

  if (!prescription) return NextResponse.json({ error: 'Fórmula no encontrada' }, { status: 404 })

  return NextResponse.json(prescription)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'RECEPCIONISTA') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  await prisma.prescription.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
