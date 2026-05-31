import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { citaSchema } from '@/validations/cita'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = citaSchema.partial().safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      ...(data.date ? { date: new Date(data.date) } : {}),
      ...(data.duration ? { duration: data.duration } : {}),
      ...(data.type ? { type: data.type } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      ...(data.whatsappReminder !== undefined
        ? { whatsappReminder: data.whatsappReminder }
        : {}),
    },
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  return NextResponse.json(appointment)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Soft delete
  await prisma.appointment.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
