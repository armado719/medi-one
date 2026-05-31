import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional().or(z.literal('')),
  role: z.enum(['MEDICO', 'RECEPCIONISTA', 'ADMINISTRADOR']).optional(),
  active: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const user = await prisma.user.findFirst({
    where: { id: params.id, deletedAt: null },
  })
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}

  if (parsed.data.name) updateData.name = parsed.data.name
  if (parsed.data.email) updateData.email = parsed.data.email
  if (parsed.data.role) updateData.role = parsed.data.role
  if (parsed.data.active !== undefined) updateData.active = parsed.data.active
  if (parsed.data.password && parsed.data.password.length > 0) {
    updateData.password = await bcrypt.hash(parsed.data.password, 10)
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, active: true },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'User',
    entityId: params.id,
    changes: { ...updateData, password: updateData.password ? '[CHANGED]' : undefined },
    ip: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json(updated)
}
