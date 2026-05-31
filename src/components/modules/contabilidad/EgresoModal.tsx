'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  notas: z.string().optional(),
})

type EgresoFormData = z.infer<typeof schema>

interface EgresoModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EgresoModal({ open, onClose, onSuccess }: EgresoModalProps) {
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EgresoFormData>({
    resolver: zodResolver(schema),
    defaultValues: { fecha: today },
  })

  const onSubmit = async (data: EgresoFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/contabilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: data.descripcion,
          monto: data.monto,
          fecha: data.fecha,
          notas: data.notas,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al registrar egreso')
      }

      toast.success('Egreso registrado correctamente')
      reset({ fecha: today })
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Egreso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Input
              id="descripcion"
              placeholder="Ej: Pago de arriendo"
              {...register('descripcion')}
            />
            {errors.descripcion && (
              <p className="text-xs text-red-600">{errors.descripcion.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="monto">Monto (COP) *</Label>
            <Input
              id="monto"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              {...register('monto')}
            />
            {errors.monto && (
              <p className="text-xs text-red-600">{errors.monto.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="fecha">Fecha *</Label>
            <Input id="fecha" type="date" {...register('fecha')} />
            {errors.fecha && (
              <p className="text-xs text-red-600">{errors.fecha.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Información adicional..."
              rows={3}
              {...register('notas')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Guardando...' : 'Registrar egreso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
