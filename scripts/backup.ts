import { exec } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const backupDir = path.join(process.cwd(), 'backups')
if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true })

const date = new Date().toISOString().split('T')[0]
const filename = `medione-backup-${date}.sql`
const filepath = path.join(backupDir, filename)

// Read DB credentials from environment if available
const dbUser = process.env.DB_USER || 'root'
const dbPassword = process.env.DB_PASSWORD || ''
const dbName = process.env.DB_NAME || 'medione'
const dbHost = process.env.DB_HOST || 'localhost'

const passwordArg = dbPassword ? `-p${dbPassword}` : ''
const command = `mysqldump -h ${dbHost} -u ${dbUser} ${passwordArg} ${dbName} > "${filepath}"`

console.log(`Iniciando backup de la base de datos "${dbName}"...`)
console.log(`Archivo destino: ${filepath}`)

exec(command, (error, _stdout, stderr) => {
  if (error) {
    console.error(`Error en backup: ${error.message}`)
    if (stderr) console.error(`stderr: ${stderr}`)
    process.exit(1)
  }
  console.log(`✓ Backup creado exitosamente: ${filename}`)
  console.log(`  Ubicación: ${filepath}`)
})
