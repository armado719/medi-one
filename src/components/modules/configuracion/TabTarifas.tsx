'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'

interface Tarifa {
  id: string
  name: string
  price: number
  isActive: boolean
}

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  price: z.coerce.number().positive('El precio debe ser mayor a 0'),
  isActive: z.boolean().default(true),
})

type TarifaForm = z.infer<typeof schema>

export function TabTarifas() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tarifa | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<TarifaForm>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  })

  const fetchTarifas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/configuracion/tarifas')
      if (res.ok) {
        const data: Array<{ id: string; name: string; price: string | number; isActive: boolean }> = await res.json()
        setTarifas(data.map((t) => ({ ...t, price: Number(t.price) })))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTarifas() }, [fetchTarifas])

  const openCreate = () => {
    setEditing(null)
    form.reset({ name: '', price: 0, isActive: true })
    setDialogOpen(true)
  }

  const openEdit = (t: Tarifa) => {
    setEditing(t)
    form.reset({ name: t.name, price: t.price, isActive: t.isActive })
    setDialogOpen(true)
  }

  const onSubmit = async (data: TarifaForm) => {
    setSubmitting(true)
    try {
      const url = editing
        ? `/api/configuracion/tarifas/${editing.id}`
        : '/api/configuracion/tarifas'
      const method = editing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast.success(editing ? 'Tarifa actualizada' : 'Tarifa creada')
      setDialogOpen(false)
      fetchTarifas()
    } catch {
      toast.error('Error al guardar la tarifa')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarifa?')) return
    try {
      const res = await fetch(`/api/configuracion/tarifas/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Tarifa eliminada')
      fetchTarifas()
    } catch {
      toast.error('Error al eliminar la tarifa')
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tarifas de procedimientos</CardTitle>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar tarifa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-content-muted text-center py-8">Cargando tarifas...</p>
          ) : tarifas.length === 0 ? (
            <p className="text-sm text-content-muted text-center py-8">
              No hay tarifas configuradas. Agrega la primera tarifa.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-2 font-medium text-content-muted">Procedimiento</th>
                    <th className="text-left py-2 font-medium text-content-muted">Precio base</th>
                    <th className="text-left py-2 font-medium text-content-muted">Estado</th>
                    <th className="text-right py-2 font-medium text-content-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tarifas.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-bg-surface">
                      <td className="py-3 font-medium text-content">{t.name}</td>
                      <td className="py-3 text-green-700 font-semibold">{formatCurrency(t.price)}</td>
                      <td className="py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            t.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {t.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) setDialogOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar tarifa' : 'Nueva tarifa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Nombre del procedimiento *</Label>
              <Input placeholder="Ej: Consulta general" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Precio base (COP) *</Label>
              <Input type="number" min="0" step="1000" {...form.register('price')} />
              {form.formState.errors.price && (
                <p className="text-xs text-red-600">{form.formState.errors.price.message}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
