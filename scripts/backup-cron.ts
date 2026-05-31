import { exec } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

// Simple cron-like scheduler using setInterval + time check
// Runs backup daily at 2:00 AM

const BACKUP_HOUR = 2
const BACKUP_MINUTE = 0

function runBackup() {
  const backupDir = path.join(process.cwd(), 'backups')
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true })

  const date = new Date().toISOString().split('T')[0]
  const filename = `medione-backup-${date}.sql`
  const filepath = path.join(backupDir, filename)

  const dbUser = process.env.DB_USER || 'root'
  const dbPassword = process.env.DB_PASSWORD || ''
  const dbName = process.env.DB_NAME || 'medione'
  const dbHost = process.env.DB_HOST || 'localhost'

  const passwordArg = dbPassword ? `-p${dbPassword}` : ''
  const command = `mysqldump -h ${dbHost} -u ${dbUser} ${passwordArg} ${dbName} > "${filepath}"`

  console.log(`[${new Date().toISOString()}] Ejecutando backup automático...`)

  exec(command, (error) => {
    if (error) {
      console.error(`[${new Date().toISOString()}] Error en backup: ${error.message}`)
      return
    }
    console.log(`[${new Date().toISOString()}] Backup creado: ${filename}`)
  })
}

function checkAndRun() {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()

  if (hour === BACKUP_HOUR && minute === BACKUP_MINUTE) {
    runBackup()
  }
}

console.log(`Programador de backup iniciado. Ejecutará a las ${BACKUP_HOUR}:${String(BACKUP_MINUTE).padStart(2, '0')} AM cada día.`)
console.log('Presiona Ctrl+C para detener.')

// Check every minute
setInterval(checkAndRun, 60 * 1000)

// Also check immediately on start (won't trigger unless it's exactly 2:00 AM)
checkAndRun()
