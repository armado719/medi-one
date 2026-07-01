import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pacienteSchema } from '@/validations/paciente'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const skip = (page - 1) * pageSize

  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { documentNumber: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        dataConsents: {
          where: { revokedAt: null },
          orderBy: { acceptedAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.patient.count({ where }),
  ])

  return NextResponse.json({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function POST(request: NextRequest) {
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

  // Check for duplicate document
  const existing = await prisma.patient.findFirst({
    where: {
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      deletedAt: null,
    },
  })

  if (existing) {
    return NextResponse.json(
      {
        error: `Ya existe un paciente con ${data.documentType} ${data.documentNumber}`,
      },
      { status: 409 }
    )
  }

  const patient = await prisma.patient.create({
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

  return NextResponse.json(patient, { status: 201 })
}
