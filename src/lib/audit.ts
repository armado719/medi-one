import { prisma } from '@/lib/prisma'

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  changes,
  ip,
}: {
  userId: string
  action: AuditAction
  entity: string
  entityId: string
  changes?: Record<string, unknown>
  ip?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        changes: changes ? (changes as import('@prisma/client').Prisma.InputJsonValue) : undefined,
        ip: ip ?? 'unknown',
      },
    })
  } catch {
    // Never throw — audit failure should not break the request
  }
}
