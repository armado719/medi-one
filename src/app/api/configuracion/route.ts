import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const configSchema = z.object({
  clinicName: z.string().min(1).optional(),
  clinicAddress: z.string().optional().nullable(),
  clinicCity: z.string().optional().nullable(),
  clinicPhone: z.string().optional().nullable(),
  clinicEmail: z.string().email().optional().nullable().or(z.literal('')),
  clinicNit: z.string().optional().nullable(),
  clinicWebsite: z.string().optional().nullable(),
  doctorName: z.string().optional(),
  doctorSpecialties: z.string().optional().nullable(),
  doctorLicense: z.string().optional().nullable(),
  doctorCardNum: z.string().optional().nullable(),
  signatureUrl: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let config = await prisma.systemConfig.findFirst()
  if (!config) {
    config = await prisma.systemConfig.create({ data: {} })
  }

  return NextResponse.json(config)
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = configSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  let config = await prisma.systemConfig.findFirst()
  if (!config) {
    config = await prisma.systemConfig.create({ data: parsed.data })
  } else {
    config = await prisma.systemConfig.update({
      where: { id: config.id },
      data: parsed.data,
    })
  }

  return NextResponse.json(config)
}
