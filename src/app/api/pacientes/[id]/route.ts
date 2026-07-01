import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pacienteSchema } from '@/validations/paciente'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const patient = await prisma.patient.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      appointments: {
        where: { deletedAt: null },
        orderBy: { date: 'desc' },
        take: 10,
      },
      clinicalRecords: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true } } },
      },
      dataConsents: {
        where: { revokedAt: null },
        orderBy: { acceptedAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!patient) {
    return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
  }

  return NextResponse.json(patient)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = pacienteSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Check for duplicate document (excluding this patient)
  const existing = await prisma.patient.findFirst({
    where: {
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      deletedAt: null,
      NOT: { id: params.id },
    },
  })

  if (existing) {
    return NextResponse.json(
      {
        error: `Ya existe otro paciente con ${data.documentType} ${data.documentNumber}`,
      },
      { status: 409 }
    )
  }

  const patient = await prisma.patient.update({
    where: { id: params.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      birthDate: new Date(data.birthDate),
      sex: data.sex,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      eps: data.eps || null,
      occupation: data.occupation || null,
      status: data.status,
      // Extended fields
      primerNombre: data.primerNombre || null,
      segundoNombre: data.segundoNombre || null,
      primerApellido: data.primerApellido || null,
      segundoApellido: data.segundoApellido || null,
      estadoCivil: data.estadoCivil || null,
      zona: data.zona || null,
      departamento: data.departamento || null,
      municipio: data.municipio || null,
      telefonoAlternativo: data.telefonoAlternativo || null,
      religion: data.religion || null,
      responsableNombre: data.responsableNombre || null,
      responsableParentesco: data.responsableParentesco || null,
      responsableTelefono: data.responsableTelefono || null,
      observaciones: data.observaciones || null,
    },
  })

  return NextResponse.json(patient)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Only ADMINISTRADOR can delete
  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // Check for active clinical records
  const recordsCount = await prisma.clinicalRecord.count({
    where: { patientId: params.id, deletedAt: null },
  })

  if (recordsCount > 0) {
    return NextResponse.json(
      {
        error: `No se puede eliminar el paciente, tiene ${recordsCount} historia(s) clínica(s) activa(s)`,
      },
      { status: 409 }
    )
  }

  // Soft delete
  await prisma.patient.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
