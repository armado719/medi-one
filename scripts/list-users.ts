/**
 * One-off diagnostic: lists all users (no passwords) in whatever database
 * DATABASE_URL currently points to.
 *   npx tsx scripts/list-users.ts
 */
import { prisma } from '../src/lib/prisma'

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, deletedAt: true },
  })

  if (users.length === 0) {
    console.log('No hay ningún usuario en esta base de datos.')
    return
  }

  console.log(`${users.length} usuario(s) encontrado(s):`)
  for (const u of users) {
    console.log(`- ${u.email} | ${u.name} | ${u.role} | active: ${u.active} | deletedAt: ${u.deletedAt}`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
