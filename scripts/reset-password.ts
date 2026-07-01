/**
 * One-off local utility: resets a user's password directly in the database.
 *   npx tsx scripts/reset-password.ts <email> <nueva-contraseña>
 */
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  const [email, newPassword] = process.argv.slice(2)
  if (!email || !newPassword) {
    console.error('Uso: npx tsx scripts/reset-password.ts <email> <nueva-contraseña>')
    process.exit(1)
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashed },
  })

  console.log(`Contraseña actualizada para ${user.email}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
