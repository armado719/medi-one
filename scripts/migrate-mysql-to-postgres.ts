/**
 * One-time local migration: copies data from the legacy local MySQL database
 * (XAMPP) into the Postgres database now used by prisma/schema.prisma.
 *
 * Requires MYSQL_DATABASE_URL (source) and DATABASE_URL (target, Postgres) in .env.
 * Run after: npx prisma generate --schema=prisma/schema.mysql.prisma
 *
 *   npx tsx scripts/migrate-mysql-to-postgres.ts
 */
import { PrismaClient as MysqlClient } from '../node_modules/.prisma-mysql-client'
import { prisma as pg } from '../src/lib/prisma'

const mysql = new MysqlClient()

async function copyTable<T extends { id: string }>(
  name: string,
  read: () => Promise<T[]>,
  write: (rows: T[]) => Promise<unknown>
) {
  const rows = await read()
  if (rows.length === 0) {
    console.log(`${name}: nada que copiar`)
    return
  }
  await write(rows)
  console.log(`${name}: ${rows.length} registro(s) copiado(s)`)
}

async function main() {
  await copyTable(
    'users',
    () => mysql.user.findMany(),
    (rows) => pg.user.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'patients',
    () => mysql.patient.findMany(),
    (rows) => pg.patient.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'appointments',
    () => mysql.appointment.findMany(),
    (rows) => pg.appointment.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'clinical_records',
    () => mysql.clinicalRecord.findMany(),
    (rows) => pg.clinicalRecord.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'products',
    () => mysql.product.findMany(),
    (rows) => pg.product.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'inventory_movements',
    () => mysql.inventoryMovement.findMany(),
    (rows) => pg.inventoryMovement.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'invoices',
    () => mysql.invoice.findMany(),
    (rows) => pg.invoice.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'invoice_items',
    () => mysql.invoiceItem.findMany(),
    (rows) => pg.invoiceItem.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'account_entries',
    () => mysql.accountEntry.findMany(),
    (rows) => pg.accountEntry.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'prescriptions',
    () => mysql.prescription.findMany(),
    (rows) => pg.prescription.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'prescription_items',
    () => mysql.prescriptionItem.findMany(),
    (rows) => pg.prescriptionItem.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'consent_templates',
    () => mysql.consentTemplate.findMany(),
    (rows) => pg.consentTemplate.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'consent_forms',
    () => mysql.consentForm.findMany(),
    (rows) => pg.consentForm.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'audit_logs',
    () => mysql.auditLog.findMany(),
    (rows) => pg.auditLog.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'system_config',
    () => mysql.systemConfig.findMany(),
    (rows) => pg.systemConfig.createMany({ data: rows, skipDuplicates: true })
  )
  await copyTable(
    'procedure_rates',
    () => mysql.procedureRate.findMany(),
    (rows) => pg.procedureRate.createMany({ data: rows, skipDuplicates: true })
  )

  console.log('\nMigración completa.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await mysql.$disconnect()
    await pg.$disconnect()
  })
