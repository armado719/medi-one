'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createProductSchema, type CreateProductInput } from '@/validations/inventario'
import type { Product } from '@/types'

const UNITS = ['und', 'ml', 'mg', 'g', 'L'] as const

interface Props {
  product?: Product
  onSuccess?: (product: Product) => void
}

export function ProductoForm({ product, onSuccess }: Props) {
  const router = useRouter()
  const isEditing = !!product

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      unit: (product?.unit as CreateProductInput['unit']) ?? 'und',
      stockCurrent: Number(product?.stockCurrent ?? 0),
      stockMinimum: Number(product?.stockMinimum ?? 0),
      unitPrice: Number(product?.unitPrice ?? 0),
    },
  })

  const onSubmit = async (data: CreateProductInput) => {
    try {
      const url = isEditing ? `/api/productos/${product.id}` : '/api/productos'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }

      const saved = await res.json()
      toast.success(isEditing ? 'Producto actualizado' : 'Producto creado exitosamente')
      onSuccess ? onSuccess(saved) : router.push('/inventario')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el producto')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1">
          <Label>Nombre *</Label>
          <Input {...register('name')} placeholder="Nombre del producto..." />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="md:col-span-2 space-y-1">
          <Label>Descripción (opcional)</Label>
          <Textarea {...register('description')} placeholder="Descripción del producto..." rows={2} />
        </div>

        <div className="space-y-1">
          <Label>Unidad de medida *</Label>
          <Controller
            control={control}
            name="unit"
            render={({ field: f }) => (
              <Select value={f.value} onValueChange={f.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          {errors.unit && <p className="text-sm text-red-500">{errors.unit.message}</p>}
        </div>

        <div className="space-y-1">
          <Label>Precio unitario</Label>
          <Input
            type="number"
            min="0"
            step="100"
            {...register('unitPrice', { valueAsNumber: true })}
          />
          {errors.unitPrice && <p className="text-sm text-red-500">{errors.unitPrice.message}</p>}
        </div>

        {!isEditing && (
          <div className="space-y-1">
            <Label>Stock actual</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              {...register('stockCurrent', { valueAsNumber: true })}
            />
            {errors.stockCurrent && <p className="text-sm text-red-500">{errors.stockCurrent.message}</p>}
          </div>
        )}

        <div className="space-y-1">
          <Label>Stock mínimo</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            {...register('stockMinimum', { valueAsNumber: true })}
          />
          {errors.stockMinimum && <p className="text-sm text-red-500">{errors.stockMinimum.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Producto'}
        </Button>
      </div>
    </form>
  )
}
