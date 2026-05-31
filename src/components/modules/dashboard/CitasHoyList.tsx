import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays } from 'lucide-react'

interface CitaDetalle {
  id: string
  patientName: string
  patientId: string
  date: string | Date
  type: string
  status: string
}

interface CitasHoyListProps {
  citas: CitaDetalle[]
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  CONFIRMADA: 'success',
  PENDIENTE: 'warning',
  CANCELADA: 'destructive',
  NO_ASISTIO: 'secondary',
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMADA: 'Confirmada',
  PENDIENTE: 'Pendiente',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistió',
}

const TYPE_LABELS: Record<string, string> = {
  LABORAL: 'Laboral',
  ESTETICA: 'Estética',
  CARDIOVASCULAR: 'Cardiovascular',
  CONTROL: 'Control',
}

function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function CitasHoyList({ citas }: CitasHoyListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Citas de hoy</CardTitle>
      </CardHeader>
      <CardContent>
        {citas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="w-10 h-10 text-content-muted/40 mb-2" />
            <p className="text-sm text-content-muted">No hay citas programadas para hoy</p>
          </div>
        ) : (
          <div className="space-y-2">
            {citas.map((cita) => (
              <div
                key={cita.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-bg-base hover:bg-bg-surface transition-colors"
              >
                <div className="text-center w-14 shrink-0">
                  <p className="text-sm font-semibold text-brand">{formatTime(cita.date)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-content truncate">{cita.patientName}</p>
                  <p className="text-xs text-content-muted">{TYPE_LABELS[cita.type] ?? cita.type}</p>
                </div>
                <Badge variant={STATUS_VARIANT[cita.status] ?? 'secondary'}>
                  {STATUS_LABELS[cita.status] ?? cita.status}
                </Badge>
                <Link
                  href={`/pacientes/${cita.patientId}`}
                  className="text-xs text-brand hover:underline shrink-0"
                >
                  Ver paciente
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
