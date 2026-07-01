import { prisma } from '@/lib/prisma'

export function getActiveDataConsent(patientId: string) {
  return prisma.dataConsent.findFirst({
    where: { patientId, revokedAt: null },
    orderBy: { acceptedAt: 'desc' },
  })
}
