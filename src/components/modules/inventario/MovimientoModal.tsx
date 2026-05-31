'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { movimientoSchema, type MovimientoInput } from '@/validations/inventario'
import type { Product } from '@/types'

interface Props {
  product: Product
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const MOVEMENT_TYPES = [
  { value: 'ENTRADA', label: 'Entrada', color: 'bg-green-500 text-white', inactive: 'bg-white text-green-600 border border-green-200 hover:bg-green-50' },
  { value: 'SALIDA', label: 'Salida', color: 'bg-red-500 text-white', inactive: 'bg-white text-red-600 border border-red-200 hover:bg-red-50' },
  { value: 'AJUSTE', label: 'Ajuste', color: 'bg-blue-500 text-white', inactive: 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50' },
] as const

export function MovimientoModal({ product, open, onClose, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<MovimientoInput>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: { type: 'ENTRADA', quantity: 1, reason: '' },
  })

  const type = watch('type')
  const quantity = watch('quantity')
  const currentStock = Number(product.stockCurrent)
  const minStock = Number(product.stockMinimum)

  const projectedStock = type === 'ENTRADA'
    ? currentStock + (quantity || 0)
    : type === 'SALIDA'
      ? currentStock - (quantity || 0)
      : quantity || 0

  const willBeLow = projectedStock <= minStock
  const willBeNegative = projectedStock < 0

  const onSubmit = async (data: MovimientoInput) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/productos/${product.id}/movimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al registrar movimiento')
      }
      toast.success('Movimiento registrado exitosamente')
      reset()
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar movimiento')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
          <p className="text-sm text-content-muted">{product.name}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type toggle */}
          <div className="space-y-1">
            <Label>Tipo de movimiento *</Label>
            <Controller
              control={control}
              name="type"
              render={({ field: f }) => (
                <div className="flex gap-2">
                  {MOVEMENT_TYPES.map((mt) => (
                    <button
                      key={mt.value}
                      type="button"
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${f.value === mt.value ? mt.color : mt.inactive}`}
                      onClick={() => f.onChange(mt.value)}
                    >
                      {mt.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <Label>
              {type === 'AJUSTE' ? 'Nuevo stock total' : 'Cantidad'} *
            </Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              {...register('quantity', { valueAsNumber: true })}
            />
            {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
          </div>

          {/* Stock preview */}
          <div className="bg-bg-surface border border-border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-content-muted">Stock actual</span>
              <span className="font-medium">{currentStock.toLocaleString('es-CO')} {product.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Stock proyectado</span>
              <span className={`font-medium ${willBeNegative ? 'text-red-600' : willBeLow ? 'text-yellow-600' : 'text-green-600'}`}>
                {projectedStock.toFixed(2)} {product.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Stock mínimo</span>
              <span>{minStock.toLocaleString('es-CO')} {product.unit}</span>
            </div>
          </div>

          {/* Warnings */}
          {(willBeLow || willBeNegative) && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${willBeNegative ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {willBeNegative
                  ? 'El stock quedaría negativo. Puede continuar, pero verifique la cantidad.'
                  : 'El stock quedará por debajo del mínimo establecido.'}
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1">
            <Label>Razón / Descripción *</Label>
            <Textarea
              {...register('reason')}
              placeholder="Motivo del movimiento..."
              rows={2}
            />
            {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Registrando...' : 'Registrar movimiento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
