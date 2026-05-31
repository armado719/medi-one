'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer, type View } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment'
import 'moment/locale/es'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { citaSchema, type CitaFormData } from '@/validations/cita'
import type { Appointment } from '@/types'

moment.locale('es')
const localizer = momentLocalizer(moment)

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Appointment & {
    patient: { id: string; firstName: string; lastName: string; phone: string }
  }
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMADA: '#22c55e',
  PENDIENTE: '#eab308',
  CANCELADA: '#9ca3af',
  NO_ASISTIO: '#ef4444',
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

interface PatientOption {
  id: string
  firstName: string
  lastName: string
}

export function AgendaCalendar() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [patients, setPatients] = useState<PatientOption[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CitaFormData>({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      duration: 30,
      status: 'PENDIENTE',
      type: 'CONTROL',
      whatsappReminder: false,
    },
  })

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true)
    try {
      const start = moment(date).startOf('month').subtract(1, 'week').toISOString()
      const end = moment(date).endOf('month').add(1, 'week').toISOString()
      const response = await fetch(`/api/citas?start=${start}&end=${end}`)
      const data = await response.json()

      const calEvents: CalendarEvent[] = data.map(
        (apt: Appointment & { patient: { id: string; firstName: string; lastName: string; phone: string } }) => ({
          id: apt.id,
          title: `${apt.patient.firstName} ${apt.patient.lastName}`,
          start: new Date(apt.date),
          end: new Date(new Date(apt.date).getTime() + apt.duration * 60000),
          resource: apt,
        })
      )
      setEvents(calEvents)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [date])

  const fetchPatients = useCallback(async () => {
    try {
      const response = await fetch('/api/pacientes?pageSize=100')
      const data = await response.json()
      setPatients(data.data || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end })
    setValue('date', start.toISOString())
    setValue('userId', session?.user?.id || '')
    setCreateOpen(true)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setDetailOpen(true)
  }

  const onSubmitCreate = async (data: CitaFormData) => {
    try {
      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok) {
        toast.error(result.error || 'Error al crear la cita')
        return
      }
      toast.success('Cita creada exitosamente')
      setCreateOpen(false)
      reset()
      fetchAppointments()
    } catch {
      toast.error('Ocurrió un error inesperado')
    }
  }

  const handleUpdateStatus = async (
    id: string,
    status: string
  ) => {
    try {
      const response = await fetch(`/api/citas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        toast.error('Error al actualizar la cita')
        return
      }
      toast.success('Estado actualizado')
      setDetailOpen(false)
      fetchAppointments()
    } catch {
      toast.error('Ocurrió un error')
    }
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status
    const color = STATUS_COLORS[status] || '#C8857A'
    return {
      style: {
        backgroundColor: color,
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        fontSize: '12px',
        padding: '2px 6px',
      },
    }
  }

  const messages = {
    today: 'Hoy',
    previous: '‹',
    next: '›',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Sin citas en este período',
  }

  return (
    <>
      <div className="bg-bg-surface border border-border rounded-xl p-4" style={{ height: 680 }}>
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-content-muted">Cargando citas...</p>
          </div>
        )}
        {!isLoading && (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={(v) => setView(v)}
            date={date}
            onNavigate={(d) => setDate(d)}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            messages={messages}
            style={{ height: '100%' }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[key] }}
            />
            <span className="text-xs text-content-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* Create appointment dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Cita</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
            {/* Patient */}
            <div className="space-y-1.5">
              <Label>
                Paciente <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(val) => setValue('patientId', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patientId && (
                <p className="text-xs text-red-500">{errors.patientId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="date">
                  Fecha y hora <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="datetime-local"
                  defaultValue={
                    selectedSlot
                      ? moment(selectedSlot.start).format('YYYY-MM-DDTHH:mm')
                      : ''
                  }
                  onChange={(e) =>
                    setValue('date', new Date(e.target.value).toISOString())
                  }
                />
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <Label htmlFor="duration">Duración (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  max={240}
                  step={15}
                  {...register('duration', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Tipo de cita</Label>
              <Select
                defaultValue="CONTROL"
                onValueChange={(val) =>
                  setValue('type', val as CitaFormData['type'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LABORAL">Laboral</SelectItem>
                  <SelectItem value="ESTETICA">Estética</SelectItem>
                  <SelectItem value="CARDIOVASCULAR">Cardiovascular</SelectItem>
                  <SelectItem value="CONTROL">Control</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                defaultValue="PENDIENTE"
                onValueChange={(val) =>
                  setValue('status', val as CitaFormData['status'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales..."
                {...register('notes')}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setCreateOpen(false); reset() }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Crear cita'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Appointment detail dialog */}
      {selectedEvent && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedEvent.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InfoRow
                  label="Tipo"
                  value={TYPE_LABELS[selectedEvent.resource.type]}
                />
                <InfoRow
                  label="Estado"
                  value={
                    <Badge
                      variant={
                        selectedEvent.resource.status === 'CONFIRMADA'
                          ? 'success'
                          : selectedEvent.resource.status === 'CANCELADA'
                          ? 'destructive'
                          : 'warning'
                      }
                    >
                      {STATUS_LABELS[selectedEvent.resource.status]}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Fecha"
                  value={moment(selectedEvent.start).format('ddd D MMM YYYY, HH:mm')}
                />
                <InfoRow
                  label="Duración"
                  value={`${selectedEvent.resource.duration} minutos`}
                />
                {selectedEvent.resource.notes && (
                  <div className="col-span-2">
                    <InfoRow label="Notas" value={selectedEvent.resource.notes} />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <p className="text-xs text-content-muted font-medium mb-2">
                  Actualizar estado
                </p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={
                        selectedEvent.resource.status === key ? 'default' : 'outline'
                      }
                      onClick={() =>
                        handleUpdateStatus(selectedEvent.id, key)
                      }
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs text-content-muted font-medium">{label}</p>
      <div className="text-sm text-content mt-0.5">{value}</div>
    </div>
  )
}
