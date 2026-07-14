/**
 * One-off diagnostic: checks whether a plaintext password matches a user's
 * stored bcrypt hash, bypassing the login UI entirely.
 *   npx tsx scripts/check-password.ts <email> <contraseña-a-probar>
 */
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  const [email, password] = process.argv.slice(2)
  if (!email || !password) {
    console.error('Uso: npx tsx scripts/check-password.ts <email> <contraseña-a-probar>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log(`No existe ningún usuario con el email: ${email}`)
    return
  }

  console.log(`Usuario encontrado: ${user.name} (${user.email})`)
  console.log(`active: ${user.active}, deletedAt: ${user.deletedAt}`)

  const matches = await bcrypt.compare(password, user.password)
  console.log(`¿La contraseña "${password}" coincide?`, matches)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
