'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, FileText, Download, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { GenerarConsentimientoModal } from '@/components/modules/documentos/GenerarConsentimientoModal'
import { ConsentimientoTemplateForm } from '@/components/modules/documentos/ConsentimientoTemplateForm'
import type { ConsentTemplate, ConsentForm, ConsentStatus } from '@/types'

interface ConsentFormRow extends ConsentForm {
  patient: { firstName: string; lastName: string; documentType: string; documentNumber: string }
  template: { name: string; procedure: string }
}

function ConsentStatusBadge({ status }: { status: ConsentStatus }) {
  if (status === 'FIRMADO') return <Badge variant="success">Firmado</Badge>
  if (status === 'RECHAZADO') return <Badge variant="destructive">Rechazado</Badge>
  return <Badge variant="warning">Pendiente</Badge>
}

function TemplatesTab({ isAdmin, onRefresh }: { isAdmin: boolean; onRefresh: number }) {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTemplate, setEditTemplate] = useState<ConsentTemplate | null>(null)
  const [generateForId, setGenerateForId] = useState<string>('')
  const [showGenerate, setShowGenerate] = useState(false)

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/consentimientos/templates?active=false')
      const json = await res.json()
      setTemplates(Array.isArray(json) ? json : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTemplates() }, [loadTemplates, onRefresh])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de desactivar esta plantilla?')) return
    try {
      await fetch(`/api/consentimientos/templates/${id}`, { method: 'DELETE' })
      toast.success('Plantilla desactivada')
      loadTemplates()
    } catch {
      toast.error('Error al desactivar la plantilla')
    }
  }

  if (loading) {
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
  }

  return (
    <>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => { setEditTemplate(null); setShowForm(true) }}>
            <Plus className="w-4 h-4" />
            Nueva plantilla
          </Button>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-content-muted">
          <FileText className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">No hay plantillas creadas</p>
        </div>
      ) : (
        <div className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Procedimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm text-content-muted">{t.procedure}</TableCell>
                  <TableCell>
                    {t.isActive
                      ? <Badge variant="success">Activa</Badge>
                      : <Badge variant="outline">Inactiva</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setGenerateForId(t.id); setShowGenerate(true) }}
                      >
                        Generar
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => { setEditTemplate(t); setShowForm(true) }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Template form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTemplate ? 'Editar plantilla' : 'Nueva plantilla'}</DialogTitle>
          </DialogHeader>
          <ConsentimientoTemplateForm
            template={editTemplate ?? undefined}
            onSuccess={() => { setShowForm(false); loadTemplates() }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Generate modal */}
      <GenerarConsentimientoModal
        open={showGenerate}
        defaultTemplateId={generateForId}
        onClose={() => setShowGenerate(false)}
        onSuccess={() => { setShowGenerate(false) }}
      />
    </>
  )
}

function DocumentsTab({ onRefresh }: { onRefresh: number }) {
  const [forms, setForms] = useState<ConsentFormRow[]>([])
  const [loading, setLoading] = useState(true)

  const loadForms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/consentimientos')
      const json = await res.json()
      setForms(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadForms() }, [loadForms, onRefresh])

  const handleDownload = async (id: string) => {
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

  if (loading) {
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
  }

  if (forms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-content-muted">
        <FileText className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No hay documentos generados</p>
      </div>
    )
  }

  return (
    <div className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Plantilla</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="text-sm text-content-muted whitespace-nowrap">
                {formatDate(f.createdAt, 'd MMM yyyy')}
              </TableCell>
              <TableCell>
                <div className="font-medium">{f.patient.firstName} {f.patient.lastName}</div>
                <div className="text-xs text-content-muted">{f.patient.documentType}: {f.patient.documentNumber}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{f.template.name}</div>
                <div className="text-xs text-content-muted">{f.template.procedure}</div>
              </TableCell>
              <TableCell><ConsentStatusBadge status={f.status} /></TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => handleDownload(f.id)} title="Descargar PDF">
                  <Download className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function ConsentimientosPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'plantillas' | 'documentos'>('plantillas')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showGenerate, setShowGenerate] = useState(false)
  const isAdmin = session?.user?.role === 'ADMINISTRADOR'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-content">Consentimientos Informados</h1>
          <p className="text-sm text-content-muted mt-1">Plantillas y documentos de consentimiento</p>
        </div>
        <Button onClick={() => setShowGenerate(true)}>
          <Plus className="w-4 h-4" />
          Generar consentimiento
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['plantillas', 'documentos'] as const).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${activeTab === tab ? 'border-brand text-brand' : 'border-transparent text-content-muted hover:text-content'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'plantillas' ? 'Plantillas' : 'Documentos generados'}
          </button>
        ))}
      </div>

      {activeTab === 'plantillas'
        ? <TemplatesTab isAdmin={isAdmin} onRefresh={refreshKey} />
        : <DocumentsTab onRefresh={refreshKey} />
      }

      <GenerarConsentimientoModal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        onSuccess={() => { setShowGenerate(false); setRefreshKey((k) => k + 1) }}
      />
    </div>
  )
}
