'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Download, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import type { ConsentStatus } from '@/types'

interface ConsentDetail {
  id: string
  templateId: string
  patientId: string
  status: ConsentStatus
  signedAt?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  patient: {
    firstName: string
    lastName: string
    documentType: string
    documentNumber: string
    phone: string
    email?: string | null
  }
  template: {
    name: string
    procedure: string
    content: string
    isActive: boolean
  }
}

function StatusBadge({ status }: { status: ConsentStatus }) {
  if (status === 'FIRMADO') return <Badge variant="success">Firmado</Badge>
  if (status === 'RECHAZADO') return <Badge variant="destructive">Rechazado</Badge>
  return <Badge variant="warning">Pendiente</Badge>
}

export default function ConsentimientoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const [form, setForm] = useState<ConsentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFirmar, setShowFirmar] = useState(false)
  const [showRechazar, setShowRechazar] = useState(false)
  const [notes, setNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const isAdmin = session?.user?.role === 'ADMINISTRADOR'

  useEffect(() => {
    fetch(`/api/consentimientos/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm(data)
        setNotes(data.notes ?? '')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleUpdateStatus = async (status: ConsentStatus) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/consentimientos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      const updated = await res.json()
      setForm(updated)
      toast.success(status === 'FIRMADO' ? 'Consentimiento firmado' : 'Consentimiento rechazado')
      setShowFirmar(false)
      setShowRechazar(false)
    } catch {
      toast.error('Error al actualizar el consentimiento')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownload = async () => {
    const res = await fetch(`/api/pdf/consentimiento/${id}`)
    if (!res.ok) { toast.error('Error al generar PDF'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `consentimiento-${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este consentimiento? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/consentimientos/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Error al eliminar'); return }
    toast.success('Consentimiento eliminado')
    router.push('/documentos/consentimientos')
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!form) {
    return (
      <div className="max-w-4xl">
        <p className="text-content-muted">Consentimiento no encontrado.</p>
        <Link href="/documentos/consentimientos">
          <Button variant="outline" className="mt-4">Volver</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/documentos/consentimientos" className="flex items-center gap-1 text-sm text-content-muted hover:text-content">
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-content">{form.template.name}</h1>
              <StatusBadge status={form.status} />
            </div>
            <p className="text-sm text-content-muted mt-0.5">
              Generado el {formatDate(form.createdAt)}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4" />
          Descargar PDF
        </Button>
      </div>

      {/* Patient + template info */}
      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-content-muted uppercase font-medium mb-1">Paciente</p>
            <p className="font-semibold text-content">{form.patient.firstName} {form.patient.lastName}</p>
            <p className="text-sm text-content-muted">{form.patient.documentType}: {form.patient.documentNumber}</p>
            {form.patient.phone && <p className="text-sm text-content-muted">{form.patient.phone}</p>}
          </div>
          <div>
            <p className="text-xs text-content-muted uppercase font-medium mb-1">Procedimiento</p>
            <p className="font-semibold text-content">{form.template.procedure}</p>
            {form.signedAt && (
              <>
                <p className="text-xs text-content-muted uppercase font-medium mb-1 mt-3">Firmado el</p>
                <p className="text-sm text-content">{formatDate(form.signedAt)}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones adicionales..."
            rows={3}
            disabled={form.status !== 'PENDIENTE'}
          />
          {form.status === 'PENDIENTE' && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await fetch(`/api/consentimientos/${id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ notes }),
                })
                toast.success('Notas guardadas')
              }}
            >
              Guardar notas
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Consent content */}
      <Card>
        <CardHeader>
          <CardTitle>Contenido del consentimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-content leading-relaxed whitespace-pre-wrap border border-border rounded-lg p-4 bg-bg-base text-sm">
            {form.template.content}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {form.status === 'PENDIENTE' && (
        <div className="flex gap-3 justify-end">
          <Button onClick={() => setShowFirmar(true)}>
            <CheckCircle className="w-4 h-4" />
            Marcar como firmado
          </Button>
          <Button variant="destructive" onClick={() => setShowRechazar(true)}>
            <XCircle className="w-4 h-4" />
            Rechazar
          </Button>
        </div>
      )}

      {form.status === 'FIRMADO' && (
        <div className="flex items-center gap-2 justify-end">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700 font-medium">
            Firmado el {formatDate(form.signedAt ?? form.updatedAt)}
          </span>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-4 text-content-muted"
              onClick={async () => {
                await fetch(`/api/consentimientos/${id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'PENDIENTE' }),
                })
                setForm((prev) => prev ? { ...prev, status: 'PENDIENTE' } : prev)
                toast.success('Devuelto a pendiente')
              }}
            >
              <Clock className="w-4 h-4 mr-1" />
              Revertir a pendiente
            </Button>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="flex justify-start pt-2 border-t border-border">
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={handleDelete}>
            Eliminar consentimiento
          </Button>
        </div>
      )}

      {/* Firmar dialog */}
      <Dialog open={showFirmar} onOpenChange={setShowFirmar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar firma</DialogTitle>
            <DialogDescription>
              El consentimiento quedará registrado como FIRMADO con la fecha y hora actual.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFirmar(false)}>Cancelar</Button>
            <Button onClick={() => handleUpdateStatus('FIRMADO')} disabled={actionLoading}>
              {actionLoading ? 'Guardando...' : 'Confirmar firma'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rechazar dialog */}
      <Dialog open={showRechazar} onOpenChange={setShowRechazar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar consentimiento</DialogTitle>
            <DialogDescription>
              El consentimiento quedará como RECHAZADO. Puede agregar notas antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label>Motivo (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo del rechazo..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRechazar(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleUpdateStatus('RECHAZADO')} disabled={actionLoading}>
              {actionLoading ? 'Guardando...' : 'Confirmar rechazo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
