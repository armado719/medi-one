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
import { useRouter } from 'next/navigation'
import { X, User } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
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
    user?: { id: string; name: string }
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

const TYPE_BADGE_COLORS: Record<string, string> = {
  LABORAL: 'bg-brand/10 text-brand',
  ESTETICA: 'bg-purple-100 text-purple-700',
  CARDIOVASCULAR: 'bg-red-100 text-red-700',
  CONTROL: 'bg-gray-100 text-gray-700',
}

interface PatientOption {
  id: string
  firstName: string
  lastName: string
}

export function AgendaCalendar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([])
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [patients, setPatients] = useState<PatientOption[]>([])

  // Filter state
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterDoctor, setFilterDoctor] = useState<string>('ALL')
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CitaFormData>({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      duration: 30,
      status: 'PENDIENTE',
      type: 'CONTROL',
      whatsappReminder: false,
      primeraVez: false,
      prioridad: false,
      valorConsulta: undefined,
    },
  })

  const primeraVezWatched = watch('primeraVez')
  const prioridadWatched = watch('prioridad')

  // Apply client-side filters
  useEffect(() => {
    let filtered = events
    if (filterType !== 'ALL') {
      filtered = filtered.filter((e) => e.resource.type === filterType)
    }
    if (filterDoctor !== 'ALL') {
      filtered = filtered.filter((e) => e.resource.userId === filterDoctor)
    }
    setFilteredEvents(filtered)
  }, [events, filterType, filterDoctor])

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true)
    try {
      const start = moment(date).startOf('month').subtract(1, 'week').toISOString()
      const end = moment(date).endOf('month').add(1, 'week').toISOString()
      const response = await fetch(`/api/citas?start=${start}&end=${end}`)
      const data = await response.json()

      const calEvents: CalendarEvent[] = data.map(
        (apt: Appointment & { patient: { id: string; firstName: string; lastName: string; phone: string }; user?: { id: string; name: string } }) => ({
          id: apt.id,
          title: `${apt.patient.firstName} ${apt.patient.lastName}`,
          start: new Date(apt.date),
          end: new Date(new Date(apt.date).getTime() + apt.duration * 60000),
          resource: apt,
        })
      )
      setEvents(calEvents)

      // Extract unique doctors for filter
      const uniqueDoctors = Array.from(
        new Map(
          data
            .filter((apt: { user?: { id: string; name: string } }) => apt.user)
            .map((apt: { user: { id: string; name: string } }) => [apt.user.id, apt.user])
        ).values()
      ) as { id: string; name: string }[]
      setDoctors(uniqueDoctors)
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
    setSelectedEvent(null)
    setCreateOpen(true)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
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

  const handleUpdateStatus = async (id: string, status: string) => {
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
      setSelectedEvent(null)
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
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap p-3 bg-bg-surface border border-border rounded-xl">
        <span className="text-sm font-medium text-content-muted">Filtrar:</span>

        {/* Filter by type */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-content-muted">Tipo:</span>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              <SelectItem value="LABORAL">Laboral</SelectItem>
              <SelectItem value="ESTETICA">Estética</SelectItem>
              <SelectItem value="CARDIOVASCULAR">Cardiovascular</SelectItem>
              <SelectItem value="CONTROL">Control</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter by doctor — only shown when there are multiple doctors */}
        {doctors.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-content-muted">Médico:</span>
            <Select value={filterDoctor} onValueChange={setFilterDoctor}>
              <SelectTrigger className="h-8 text-xs w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los médicos</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(filterType !== 'ALL' || filterDoctor !== 'ALL') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setFilterType('ALL'); setFilterDoctor('ALL') }}
          >
            Limpiar filtros
          </Button>
        )}

        <span className="ml-auto text-xs text-content-muted">
          {filteredEvents.length} cita{filteredEvents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Calendar + side panel */}
      <div className="flex gap-4">
        {/* Calendar takes full width on mobile, flex-1 when panel is open on desktop */}
        <div className={`${selectedEvent ? 'flex-1 min-w-0' : 'w-full'}`}>
          <div className="bg-bg-surface border border-border rounded-xl p-4" style={{ height: 680 }}>
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <p className="text-content-muted">Cargando citas...</p>
              </div>
            )}
            {!isLoading && (
              <Calendar
                localizer={localizer}
                events={filteredEvents}
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
        </div>

        {/* Side panel — desktop: sticky panel; mobile: full-width dialog */}
        {selectedEvent && (
          <>
            {/* Desktop side panel */}
            <div className="hidden md:block w-72 shrink-0">
              <div className="bg-bg-surface border border-border rounded-xl p-4 sticky top-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-content truncate">{selectedEvent.title}</p>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${TYPE_BADGE_COLORS[selectedEvent.resource.type] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {TYPE_LABELS[selectedEvent.resource.type]}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-content-muted hover:text-content transition-colors ml-2 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <PanelRow label="Fecha" value={moment(selectedEvent.start).format('ddd D MMM YYYY')} />
                  <PanelRow label="Hora" value={moment(selectedEvent.start).format('HH:mm')} />
                  <PanelRow label="Duración" value={`${selectedEvent.resource.duration} min`} />
                  {selectedEvent.resource.user && (
                    <PanelRow label="Médico" value={selectedEvent.resource.user.name} />
                  )}
                  {selectedEvent.resource.valorConsulta && (
                    <PanelRow
                      label="Valor"
                      value={`$${Number(selectedEvent.resource.valorConsulta).toLocaleString('es-CO')}`}
                    />
                  )}
                  <div>
                    <p className="text-xs text-content-muted">Estado</p>
                    <Badge
                      className="mt-0.5"
                      variant={
                        selectedEvent.resource.status === 'CONFIRMADA'
                          ? 'success'
                          : selectedEvent.resource.status === 'CANCELADA'
                          ? 'destructive'
                          : selectedEvent.resource.status === 'NO_ASISTIO'
                          ? 'destructive'
                          : 'warning'
                      }
                    >
                      {STATUS_LABELS[selectedEvent.resource.status]}
                    </Badge>
                  </div>
                  {selectedEvent.resource.prioridad && (
                    <div className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Consulta prioritaria
                    </div>
                  )}
                  {selectedEvent.resource.primeraVez && (
                    <div className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Primera vez
                    </div>
                  )}
                  {selectedEvent.resource.notes && (
                    <div>
                      <p className="text-xs text-content-muted">Notas</p>
                      <p className="text-xs text-content mt-0.5">{selectedEvent.resource.notes}</p>
                    </div>
                  )}
                </div>

                {/* Status update */}
                <div>
                  <p className="text-xs text-content-muted font-medium mb-2">Cambiar estado</p>
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => handleUpdateStatus(selectedEvent.id, key)}
                        className={`text-left text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          selectedEvent.resource.status === key
                            ? 'bg-brand text-white border-brand'
                            : 'border-border text-content hover:bg-bg-base'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() =>
                      router.push(`/pacientes/${selectedEvent.resource.patient.id}`)
                    }
                  >
                    <User className="w-3 h-3" />
                    Ver paciente
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile: show as bottom dialog */}
            <div className="md:hidden">
              <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null) }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{selectedEvent.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoRow label="Tipo" value={TYPE_LABELS[selectedEvent.resource.type]} />
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
                            onClick={() => handleUpdateStatus(selectedEvent.id, key)}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        router.push(`/pacientes/${selectedEvent.resource.patient.id}`)
                      }
                    >
                      Ver paciente
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

            {/* Valor consulta */}
            <div className="space-y-1.5">
              <Label htmlFor="valorConsulta">Valor de la consulta (COP)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-content-muted">$</span>
                <Input
                  id="valorConsulta"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="0"
                  className="pl-7"
                  {...register('valorConsulta', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Checkboxes row */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="primeraVez"
                  checked={primeraVezWatched}
                  onCheckedChange={(checked) => setValue('primeraVez', !!checked)}
                />
                <Label htmlFor="primeraVez" className="text-sm cursor-pointer">
                  Primera vez (paciente nuevo)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="prioridad"
                  checked={prioridadWatched}
                  onCheckedChange={(checked) => setValue('prioridad', !!checked)}
                />
                <Label htmlFor="prioridad" className="text-sm cursor-pointer">
                  Consulta prioritaria
                </Label>
              </div>
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
    </>
  )
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-content-muted">{label}</p>
      <p className="text-sm text-content mt-0.5">{value}</p>
    </div>
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
