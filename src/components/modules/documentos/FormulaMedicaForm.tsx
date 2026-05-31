'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createPrescriptionSchema, type CreatePrescriptionInput } from '@/validations/formula'
import { useDebounce } from '@/hooks/useDebounce'
import type { Patient, ClinicalRecord } from '@/types'

const FORMAS = ['Tableta', 'Cápsula', 'Jarabe', 'Crema', 'Solución', 'Ampolla', 'Otro'] as const
const VIAS = ['Oral', 'Tópica', 'Intramuscular', 'Intravenosa', 'Sublingual', 'Otra'] as const

export function FormulaMedicaForm() {
  const router = useRouter()
  const [patientSearch, setPatientSearch] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [records, setRecords] = useState<ClinicalRecord[]>([])
  const [submitting, setSubmitting] = useState(false)
  const debouncedSearch = useDebounce(patientSearch, 300)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreatePrescriptionInput>({
    resolver: zodResolver(createPrescriptionSchema),
    defaultValues: {
      items: [{ medication: '', concentration: '', form: '', dose: '', frequency: '', duration: '', route: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // Patient search
  useEffect(() => {
    if (!debouncedSearch) { setPatients([]); return }
    fetch(`/api/pacientes?search=${encodeURIComponent(debouncedSearch)}&pageSize=5`)
      .then((r) => r.json())
      .then((j) => setPatients(j.data ?? []))
  }, [debouncedSearch])

  // Load records for selected patient
  useEffect(() => {
    if (!selectedPatient) { setRecords([]); return }
    fetch(`/api/historias?patientId=${selectedPatient.id}`)
      .then((r) => r.json())
      .then((j) => setRecords(j.data ?? []))
  }, [selectedPatient])

  const onSubmit = async (data: CreatePrescriptionInput) => {
    if (!selectedPatient) { toast.error('Debe seleccionar un paciente'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/formulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, patientId: selectedPatient.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear la fórmula')
      }
      const formula = await res.json()
      toast.success('Fórmula médica creada exitosamente')
      router.push(`/documentos/formulas/${formula.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la fórmula')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Patient */}
      <div className="bg-bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-content">Paciente</h2>
        <div className="relative">
          <Label className="mb-1 block text-sm font-medium text-content">Buscar paciente *</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
            <Input
              className="pl-9"
              placeholder="Nombre o número de documento..."
              value={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : patientSearch}
              onChange={(e) => {
                setSelectedPatient(null)
                setPatientSearch(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
            />
          </div>
          {showDropdown && patients.length > 0 && !selectedPatient && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
              {patients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-bg-surface transition-colors border-b border-border last:border-0"
                  onClick={() => {
                    setSelectedPatient(p)
                    setValue('patientId', p.id)
                    setShowDropdown(false)
                    setPatientSearch('')
                  }}
                >
                  <div className="font-medium text-content">{p.firstName} {p.lastName}</div>
                  <div className="text-xs text-content-muted">{p.documentType}: {p.documentNumber}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPatient && (
          <div className="flex items-center gap-3 p-3 bg-brand/5 border border-brand/20 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-content">{selectedPatient.firstName} {selectedPatient.lastName}</div>
              <div className="text-xs text-content-muted">{selectedPatient.documentType}: {selectedPatient.documentNumber}</div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedPatient(null); setValue('patientId', '') }}>
              Cambiar
            </Button>
          </div>
        )}

        {/* Optional clinical record */}
        {records.length > 0 && (
          <div className="space-y-1">
            <Label className="text-sm font-medium text-content">Historia clínica relacionada (opcional)</Label>
            <Controller
              control={control}
              name="recordId"
              render={({ field: f }) => (
                <Select value={f.value ?? ''} onValueChange={f.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar historia..." />
                  </SelectTrigger>
                  <SelectContent>
                    {records.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.type} — {new Date(r.createdAt).toLocaleDateString('es-CO')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
      </div>

      {/* Diagnosis */}
      <div className="bg-bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-content">Diagnóstico</h2>
        <div className="space-y-1">
          <Input {...register('diagnosis')} placeholder="Diagnóstico (opcional)..." />
        </div>
      </div>

      {/* Medications */}
      <div className="bg-bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-content">Medicamentos</h2>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-border rounded-xl p-4 space-y-3 relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-content-muted">Medicamento #{index + 1}</span>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Medicamento *</Label>
                  <Input {...register(`items.${index}.medication`)} placeholder="Nombre del medicamento" />
                  {errors.items?.[index]?.medication && (
                    <p className="text-xs text-red-500">{errors.items[index]?.medication?.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Concentración</Label>
                  <Input {...register(`items.${index}.concentration`)} placeholder="ej. 500mg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Forma farmacéutica</Label>
                  <Controller
                    control={control}
                    name={`items.${index}.form`}
                    render={({ field: f }) => (
                      <Select value={f.value ?? ''} onValueChange={f.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMAS.map((forma) => <SelectItem key={forma} value={forma}>{forma}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Dosis *</Label>
                  <Input {...register(`items.${index}.dose`)} placeholder="ej. 1 tableta" />
                  {errors.items?.[index]?.dose && (
                    <p className="text-xs text-red-500">{errors.items[index]?.dose?.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Frecuencia *</Label>
                  <Input {...register(`items.${index}.frequency`)} placeholder="ej. cada 8 horas" />
                  {errors.items?.[index]?.frequency && (
                    <p className="text-xs text-red-500">{errors.items[index]?.frequency?.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Duración *</Label>
                  <Input {...register(`items.${index}.duration`)} placeholder="ej. 7 días" />
                  {errors.items?.[index]?.duration && (
                    <p className="text-xs text-red-500">{errors.items[index]?.duration?.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vía de administración</Label>
                  <Controller
                    control={control}
                    name={`items.${index}.route`}
                    render={({ field: f }) => (
                      <Select value={f.value ?? ''} onValueChange={f.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {VIAS.map((via) => <SelectItem key={via} value={via}>{via}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {errors.items && typeof errors.items.message === 'string' && (
          <p className="text-sm text-red-500">{errors.items.message}</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ medication: '', concentration: '', form: '', dose: '', frequency: '', duration: '', route: '' })}
        >
          <Plus className="w-4 h-4" />
          Agregar medicamento
        </Button>
      </div>

      {/* Instructions */}
      <div className="bg-bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-content">Indicaciones generales</h2>
        <Textarea
          {...register('instructions')}
          placeholder="Indicaciones adicionales para el paciente..."
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar Fórmula Médica'}
        </Button>
      </div>
    </form>
  )
}
