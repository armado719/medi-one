'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, Download } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createConsentFormSchema, type CreateConsentFormInput } from '@/validations/consentimiento'
import { useDebounce } from '@/hooks/useDebounce'
import type { Patient, ConsentTemplate } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  defaultTemplateId?: string
}

export function GenerarConsentimientoModal({ open, onClose, onSuccess, defaultTemplateId }: Props) {
  const [patientSearch, setPatientSearch] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [templates, setTemplates] = useState<ConsentTemplate[]>([])
  const [preview, setPreview] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const debouncedSearch = useDebounce(patientSearch, 300)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateConsentFormInput>({
    resolver: zodResolver(createConsentFormSchema),
    defaultValues: {
      templateId: defaultTemplateId ?? '',
      patientId: '',
      status: 'PENDIENTE',
    },
  })

  const templateId = watch('templateId')

  // Load templates
  useEffect(() => {
    if (!open) return
    fetch('/api/consentimientos/templates')
      .then((r) => r.json())
      .then((j) => setTemplates(Array.isArray(j) ? j : []))
  }, [open])

  // Patient search
  useEffect(() => {
    if (!debouncedSearch) { setPatients([]); return }
    fetch(`/api/pacientes?search=${encodeURIComponent(debouncedSearch)}&pageSize=5`)
      .then((r) => r.json())
      .then((j) => setPatients(j.data ?? []))
  }, [debouncedSearch])

  // Update preview when patient or template changes
  useEffect(() => {
    const template = templates.find((t) => t.id === templateId)
    if (!template || !selectedPatient) { setPreview(''); return }

    let content = template.content
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/{{nombre_paciente}}/g, `${selectedPatient.firstName} ${selectedPatient.lastName}`)
      .replace(/{{fecha}}/g, new Date().toLocaleDateString('es-CO'))
      .replace(/{{procedimiento}}/g, template.procedure)
      .replace(/{{medico}}/g, 'Dra. Alejandra Bárcenas')
      .replace(/{{documento}}/g, `${selectedPatient.documentType} ${selectedPatient.documentNumber}`)

    setPreview(content.substring(0, 400) + (content.length > 400 ? '...' : ''))
  }, [templateId, selectedPatient, templates])

  const onSubmit = async (data: CreateConsentFormInput) => {
    if (!selectedPatient) { toast.error('Debe seleccionar un paciente'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/consentimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, patientId: selectedPatient.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al generar el consentimiento')
      }
      const form = await res.json()
      toast.success('Consentimiento generado exitosamente')

      // Auto-download PDF
      const pdfRes = await fetch(`/api/pdf/consentimiento/${form.id}`)
      if (pdfRes.ok) {
        const blob = await pdfRes.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `consentimiento-${form.id}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }

      reset()
      setSelectedPatient(null)
      setPatientSearch('')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar el consentimiento')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); setSelectedPatient(null); onClose() } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generar consentimiento informado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Template select */}
          <div className="space-y-1">
            <Label>Plantilla *</Label>
            <Controller
              control={control}
              name="templateId"
              render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plantilla..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name} — {t.procedure}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.templateId && <p className="text-sm text-red-500">{errors.templateId.message}</p>}
          </div>

          {/* Patient search */}
          <div className="relative space-y-1">
            <Label>Paciente *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
              <Input
                className="pl-9"
                placeholder="Buscar paciente..."
                value={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : patientSearch}
                onChange={(e) => {
                  setSelectedPatient(null)
                  setPatientSearch(e.target.value)
                  setValue('patientId', '')
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
              />
            </div>
            {showDropdown && patients.length > 0 && !selectedPatient && (
              <div className="absolute z-10 top-full left-0 right-0 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-bg-surface border-b border-border last:border-0"
                    onClick={() => {
                      setSelectedPatient(p)
                      setValue('patientId', p.id)
                      setShowDropdown(false)
                    }}
                  >
                    <div className="font-medium">{p.firstName} {p.lastName}</div>
                    <div className="text-xs text-content-muted">{p.documentType}: {p.documentNumber}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>Estado inicial</Label>
            <Controller
              control={control}
              name="status"
              render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDIENTE">Pendiente de firma</SelectItem>
                    <SelectItem value="FIRMADO">Firmado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-medium text-content-muted uppercase mb-2">Vista previa del contenido</p>
              <p className="text-sm text-content leading-relaxed">{preview}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); setSelectedPatient(null); onClose() }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              <Download className="w-4 h-4" />
              {submitting ? 'Generando...' : 'Generar y Descargar PDF'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
