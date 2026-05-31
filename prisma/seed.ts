import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const medicoPassword = await bcrypt.hash('Medico123!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@medione.com' },
    update: {},
    create: {
      email: 'admin@medione.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMINISTRADOR',
      active: true,
    },
  })

  const medico = await prisma.user.upsert({
    where: { email: 'dra@medione.com' },
    update: {},
    create: {
      email: 'dra@medione.com',
      password: medicoPassword,
      name: 'Dra. Alejandra Bárcenas',
      role: 'MEDICO',
      active: true,
    },
  })

  console.log('Created users:', { admin: admin.email, medico: medico.email })
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
