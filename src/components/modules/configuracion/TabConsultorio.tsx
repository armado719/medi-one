'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  clinicName: z.string().min(1, 'El nombre es requerido'),
  clinicAddress: z.string().optional(),
  clinicCity: z.string().optional(),
  clinicPhone: z.string().optional(),
  clinicEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  clinicNit: z.string().optional(),
  clinicWebsite: z.string().optional(),
})

type ConsultorioForm = z.infer<typeof schema>

export function TabConsultorio() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConsultorioForm>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/configuracion')
        if (res.ok) {
          const data = await res.json()
          reset({
            clinicName: data.clinicName ?? '',
            clinicAddress: data.clinicAddress ?? '',
            clinicCity: data.clinicCity ?? '',
            clinicPhone: data.clinicPhone ?? '',
            clinicEmail: data.clinicEmail ?? '',
            clinicNit: data.clinicNit ?? '',
            clinicWebsite: data.clinicWebsite ?? '',
          })
        }
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [reset])

  const onSubmit = async (data: ConsultorioForm) => {
    setLoading(true)
    try {
      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast.success('Configuración del consultorio guardada')
    } catch {
      toast.error('Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="text-sm text-content-muted py-8 text-center">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Información del consultorio</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="clinicName">Nombre del consultorio *</Label>
              <Input id="clinicName" {...register('clinicName')} />
              {errors.clinicName && (
                <p className="text-xs text-red-600">{errors.clinicName.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="clinicNit">NIT</Label>
              <Input id="clinicNit" placeholder="900.123.456-7" {...register('clinicNit')} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="clinicAddress">Dirección</Label>
              <Input id="clinicAddress" placeholder="Calle 123 # 45-67" {...register('clinicAddress')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clinicCity">Ciudad</Label>
              <Input id="clinicCity" placeholder="Bogotá" {...register('clinicCity')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clinicPhone">Teléfono</Label>
              <Input id="clinicPhone" placeholder="+57 300 123 4567" {...register('clinicPhone')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clinicEmail">Email</Label>
              <Input id="clinicEmail" type="email" placeholder="consultorio@ejemplo.com" {...register('clinicEmail')} />
              {errors.clinicEmail && (
                <p className="text-xs text-red-600">{errors.clinicEmail.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="clinicWebsite">Sitio web (opcional)</Label>
              <Input id="clinicWebsite" placeholder="https://ejemplo.com" {...register('clinicWebsite')} />
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar configuración'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
