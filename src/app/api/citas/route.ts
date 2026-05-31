import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { citaSchema } from '@/validations/cita'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const where: {
    deletedAt: null
    date?: { gte: Date; lte: Date }
  } = { deletedAt: null }

  if (start && end) {
    where.date = {
      gte: new Date(start),
      lte: new Date(end),
    }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(appointments)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = citaSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data
  const appointmentDate = new Date(data.date)
  const appointmentEnd = new Date(appointmentDate.getTime() + data.duration * 60000)

  // Check for overlapping appointments for the same doctor
  const overlapping = await prisma.appointment.findFirst({
    where: {
      userId: data.userId,
      deletedAt: null,
      status: { not: 'CANCELADA' },
      AND: [
        { date: { lt: appointmentEnd } },
        {
          date: {
            gte: new Date(appointmentDate.getTime() - 30 * 60000),
          },
        },
      ],
    },
  })

  if (overlapping) {
    return NextResponse.json(
      { error: 'Ya existe una cita en ese horario para este médico' },
      { status: 409 }
    )
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: data.patientId,
      userId: data.userId,
      date: appointmentDate,
      duration: data.duration,
      type: data.type,
      status: data.status,
      notes: data.notes || null,
      whatsappReminder: data.whatsappReminder,
      primeraVez: data.primeraVez ?? false,
      valorConsulta: data.valorConsulta ?? null,
      prioridad: data.prioridad ?? false,
    },
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  return NextResponse.json(appointment, { status: 201 })
}
