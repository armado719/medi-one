'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PacienteForm } from '@/components/modules/pacientes/PacienteForm'
import { formatDate, calculateAge } from '@/lib/utils'
import type { Patient, ClinicalRecord, Appointment } from '@/types'

interface PatientWithRelations extends Patient {
  appointments: Appointment[]
  clinicalRecords: (ClinicalRecord & { user: { name: string } })[]
}

const DOCUMENT_LABELS: Record<string, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  PA: 'Pasaporte',
  TI: 'Tarjeta de identidad',
}

const SEX_LABELS: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
  OTRO: 'Otro',
}

const RECORD_TYPE_LABELS: Record<string, string> = {
  LABORAL: 'Historia Laboral',
  ESTETICA: 'Historia Estética',
  CARDIOVASCULAR: 'Historia Cardiovascular',
}

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  LABORAL: 'Laboral',
  ESTETICA: 'Estética',
  CARDIOVASCULAR: 'Cardiovascular',
  CONTROL: 'Control',
}

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  CONFIRMADA: 'Confirmada',
  PENDIENTE: 'Pendiente',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistió',
}

export default function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const isEditing = searchParams.get('edit') === 'true'
  const isAdmin = session?.user?.role === 'ADMINISTRADOR'

  const [patient, setPatient] = useState<PatientWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/pacientes/${id}`)
        if (!response.ok) {
          toast.error('Paciente no encontrado')
          router.push('/pacientes')
          return
        }
        const data = await response.json()
        setPatient(data)
      } catch {
        toast.error('Error al cargar el paciente')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPatient()
  }, [id, router])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/pacientes/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Paciente eliminado')
      router.push('/pacientes')
    } catch {
      toast.error('Error al eliminar el paciente')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (!patient) return null

  const fullName = `${patient.firstName} ${patient.lastName}`

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/pacientes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold text-content">
              {fullName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={patient.status === 'ACTIVO' ? 'success' : 'destructive'}
              >
                {patient.status === 'ACTIVO' ? 'Activo' : 'Inactivo'}
              </Badge>
              <span className="text-sm text-content-muted">
                {DOCUMENT_LABELS[patient.documentType]} — {patient.documentNumber}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <Link href={`/pacientes/${id}?edit=true`}>
              <Button variant="outline">Editar datos</Button>
            </Link>
          )}
          {isAdmin && !isEditing && (
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Eliminar paciente?</DialogTitle>
                  <DialogDescription>
                    Esta acción no se puede deshacer. Se eliminará el registro de{' '}
                    <strong>{fullName}</strong>. El paciente no puede tener historias
                    clínicas activas.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isEditing ? (
        <PacienteForm mode="edit" patient={patient} />
      ) : (
        <>
          {/* Patient info */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del Paciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <InfoItem label="Nombres" value={patient.firstName} />
                <InfoItem label="Apellidos" value={patient.lastName} />
                <InfoItem
                  label="Documento"
                  value={`${patient.documentType} ${patient.documentNumber}`}
                />
                <InfoItem
                  label="Fecha de nacimiento"
                  value={`${formatDate(patient.birthDate)} (${calculateAge(patient.birthDate)} años)`}
                />
                <InfoItem label="Sexo" value={SEX_LABELS[patient.sex]} />
                <InfoItem label="Teléfono" value={patient.phone} />
                {patient.email && <InfoItem label="Email" value={patient.email} />}
                {patient.address && (
                  <InfoItem label="Dirección" value={patient.address} />
                )}
                {patient.city && <InfoItem label="Ciudad" value={patient.city} />}
                {patient.eps && <InfoItem label="EPS" value={patient.eps} />}
                {patient.occupation && (
                  <InfoItem label="Ocupación" value={patient.occupation} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Historias clínicas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand" />
                Historias Clínicas
              </CardTitle>
              <div className="flex gap-2">
                <Link href={`/historias/laboral/nueva?pacienteId=${id}`}>
                  <Button size="sm" variant="outline">
                    Laboral
                  </Button>
                </Link>
                <Link href={`/historias/estetica/nueva?pacienteId=${id}`}>
                  <Button size="sm" variant="outline">
                    Estética
                  </Button>
                </Link>
                <Link href={`/historias/cardiovascular/nueva?pacienteId=${id}`}>
                  <Button size="sm" variant="outline">
                    Cardiovascular
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {patient.clinicalRecords.length === 0 ? (
                <p className="text-sm text-content-muted text-center py-6">
                  Sin historias clínicas registradas
                </p>
              ) : (
                <div className="space-y-2">
                  {patient.clinicalRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-bg-base"
                    >
                      <div>
                        <p className="text-sm font-medium text-content">
                          {RECORD_TYPE_LABELS[record.type]}
                        </p>
                        <p className="text-xs text-content-muted">
                          {formatDate(record.createdAt)} — Dr(a). {record.user.name}
                        </p>
                      </div>
                      <Link
                        href={`/historias/${record.type.toLowerCase()}/${record.id}`}
                      >
                        <Button size="sm" variant="ghost">
                          Ver
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Citas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand" />
                Citas
              </CardTitle>
              <Link href={`/agenda?pacienteId=${id}`}>
                <Button size="sm" variant="outline">
                  Nueva cita
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {patient.appointments.length === 0 ? (
                <p className="text-sm text-content-muted text-center py-6">
                  Sin citas registradas
                </p>
              ) : (
                <div className="space-y-2">
                  {patient.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-bg-base"
                    >
                      <div>
                        <p className="text-sm font-medium text-content">
                          {formatDate(apt.date, 'd MMM yyyy, HH:mm')} —{' '}
                          {APPOINTMENT_TYPE_LABELS[apt.type]}
                        </p>
                        {apt.notes && (
                          <p className="text-xs text-content-muted">{apt.notes}</p>
                        )}
                      </div>
                      <Badge
                        variant={
                          apt.status === 'CONFIRMADA'
                            ? 'success'
                            : apt.status === 'CANCELADA'
                            ? 'destructive'
                            : apt.status === 'NO_ASISTIO'
                            ? 'destructive'
                            : 'warning'
                        }
                      >
                        {APPOINTMENT_STATUS_LABELS[apt.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-content-muted font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-content mt-0.5">{value}</p>
    </div>
  )
}
