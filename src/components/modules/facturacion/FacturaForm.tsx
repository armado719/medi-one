'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { formatCurrency } from '@/lib/utils'
import { createInvoiceSchema, type CreateInvoiceInput } from '@/validations/factura'
import { useDebounce } from '@/hooks/useDebounce'
import type { Patient } from '@/types'

const TAX_RATES = [0, 5, 19]

export function FacturaForm() {
  const router = useRouter()
  const [patientSearch, setPatientSearch] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const debouncedSearch = useDebounce(patientSearch, 300)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, subtotal: 0 }],
      discount: 0,
      discountType: 'PORCENTAJE',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')
  const discount = watch('discount')
  const discountType = watch('discountType')

  // Search patients
  useEffect(() => {
    if (!debouncedSearch) { setPatients([]); return }
    fetch(`/api/pacientes?search=${encodeURIComponent(debouncedSearch)}&pageSize=5`)
      .then((r) => r.json())
      .then((j) => setPatients(j.data ?? []))
  }, [debouncedSearch])

  // Calculate item subtotals
  const updateSubtotal = useCallback((index: number) => {
    const item = items[index]
    if (!item) return
    const sub = Number(item.quantity) * Number(item.unitPrice)
    setValue(`items.${index}.subtotal`, sub)
  }, [items, setValue])

  // Calculated totals
  const rawSubtotal = items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0)
  let discountAmount = 0
  if (discountType === 'PORCENTAJE') {
    discountAmount = rawSubtotal * (Number(discount || 0) / 100)
  } else {
    discountAmount = Number(discount || 0)
  }
  const afterDiscount = rawSubtotal - discountAmount
  const taxAmount = items.reduce((acc, item) => {
    const ratio = rawSubtotal > 0 ? Number(item.subtotal || 0) / rawSubtotal : 0
    const itemAfterDiscount = Number(item.subtotal || 0) - discountAmount * ratio
    return acc + itemAfterDiscount * (Number(item.taxRate || 0) / 100)
  }, 0)
  const total = afterDiscount + taxAmount

  const onSubmit = async (data: CreateInvoiceInput) => {
    if (!selectedPatient) {
      toast.error('Debe seleccionar un paciente')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, patientId: selectedPatient.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear la factura')
      }
      const invoice = await res.json()
      toast.success('Factura creada exitosamente')
      router.push(`/facturacion/${invoice.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la factura')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Patient selector */}
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedPatient(null); setValue('patientId', '') }}
            >
              Cambiar
            </Button>
          </div>
        )}
        {errors.patientId && <p className="text-sm text-red-500">{errors.patientId.message}</p>}
      </div>

      {/* Items */}
      <div className="bg-bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-content">Ítems de la factura</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-xs text-content-muted uppercase font-medium">Descripción</th>
                <th className="text-center py-2 px-2 text-xs text-content-muted uppercase font-medium w-20">Cant.</th>
                <th className="text-right py-2 px-2 text-xs text-content-muted uppercase font-medium w-32">Precio Unit.</th>
                <th className="text-center py-2 px-2 text-xs text-content-muted uppercase font-medium w-24">IVA</th>
                <th className="text-right py-2 px-2 text-xs text-content-muted uppercase font-medium w-32">Subtotal</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="border-b border-border/50">
                  <td className="py-2 px-2">
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder="Descripción del servicio..."
                      className="w-full"
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-xs text-red-500 mt-1">{errors.items[index]?.description?.message}</p>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <Controller
                      control={control}
                      name={`items.${index}.quantity`}
                      render={({ field: f }) => (
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="text-center"
                          value={f.value}
                          onChange={(e) => {
                            f.onChange(parseFloat(e.target.value) || 0)
                            updateSubtotal(index)
                          }}
                          onBlur={() => updateSubtotal(index)}
                        />
                      )}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Controller
                      control={control}
                      name={`items.${index}.unitPrice`}
                      render={({ field: f }) => (
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          className="text-right"
                          value={f.value}
                          onChange={(e) => {
                            f.onChange(parseFloat(e.target.value) || 0)
                            updateSubtotal(index)
                          }}
                          onBlur={() => updateSubtotal(index)}
                        />
                      )}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Controller
                      control={control}
                      name={`items.${index}.taxRate`}
                      render={({ field: f }) => (
                        <Select value={String(f.value)} onValueChange={(v) => { f.onChange(Number(v)); updateSubtotal(index) }}>
                          <SelectTrigger className="text-center">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_RATES.map((r) => (
                              <SelectItem key={r} value={String(r)}>{r}%</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </td>
                  <td className="py-2 px-2 text-right font-medium text-content">
                    {formatCurrency(Number(items[index]?.subtotal ?? 0))}
                  </td>
                  <td className="py-2 px-2">
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {errors.items && typeof errors.items.message === 'string' && (
          <p className="text-sm text-red-500">{errors.items.message}</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ description: '', quantity: 1, unitPrice: 0, taxRate: 0, subtotal: 0 })}
        >
          <Plus className="w-4 h-4" />
          Agregar ítem
        </Button>
      </div>

      {/* Discount + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-content">Descuento</h2>
          <div className="flex gap-3">
            <Controller
              control={control}
              name="discountType"
              render={({ field: f }) => (
                <div className="flex rounded-lg overflow-hidden border border-border">
                  {(['PORCENTAJE', 'VALOR'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`px-4 py-2 text-sm font-medium transition-colors ${f.value === t ? 'bg-brand text-white' : 'bg-white text-content-muted hover:bg-bg-surface'}`}
                      onClick={() => f.onChange(t)}
                    >
                      {t === 'PORCENTAJE' ? '%' : '$'}
                    </button>
                  ))}
                </div>
              )}
            />
            <Controller
              control={control}
              name="discount"
              render={({ field: f }) => (
                <Input
                  type="number"
                  min="0"
                  max={discountType === 'PORCENTAJE' ? 100 : undefined}
                  step={discountType === 'PORCENTAJE' ? '1' : '1000'}
                  value={f.value}
                  onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                  placeholder={discountType === 'PORCENTAJE' ? '0%' : '$ 0'}
                />
              )}
            />
          </div>

          <div className="space-y-3 pt-4">
            <Label className="block text-sm font-medium text-content">Método de pago</Label>
            <Controller
              control={control}
              name="paymentMethod"
              render={({ field: f }) => (
                <Select value={f.value ?? ''} onValueChange={f.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferencia Bancaria</SelectItem>
                    <SelectItem value="TARJETA">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label className="block text-sm font-medium text-content">Notas (opcional)</Label>
            <Textarea {...register('notes')} placeholder="Observaciones adicionales..." rows={3} />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-bg-surface border border-border rounded-xl shadow-sm p-6">
          <h2 className="font-display text-lg font-semibold text-content mb-4">Resumen</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-content-muted">Subtotal</span>
              <span className="font-medium">{formatCurrency(rawSubtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-content-muted">
                  Descuento {discountType === 'PORCENTAJE' ? `(${discount}%)` : ''}
                </span>
                <span className="font-medium text-red-600">- {formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-content-muted">IVA</span>
                <span className="font-medium">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-display text-lg font-semibold text-content">Total</span>
              <span className="font-display text-2xl font-bold text-brand">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar Factura'}
        </Button>
      </div>
    </form>
  )
}
