import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date, pattern = "d 'de' MMMM 'de' yyyy"): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: es })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "d MMM yyyy, HH:mm", { locale: es })
}

export function calculateAge(birthDate: string | Date): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function calculateIMC(peso: number, talla: number): number {
  if (!peso || !talla) return 0
  const tallaMt = talla / 100
  return Math.round((peso / (tallaMt * tallaMt)) * 10) / 10
}

export function getIMCCategory(imc: number): string {
  if (imc < 18.5) return 'Bajo peso'
  if (imc < 25) return 'Normal'
  if (imc < 30) return 'Sobrepeso'
  if (imc < 35) return 'Obesidad I'
  if (imc < 40) return 'Obesidad II'
  return 'Obesidad III'
}
