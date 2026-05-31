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
  doctorName: z.string().min(1, 'El nombre es requerido'),
  doctorSpecialties: z.string().optional(),
  doctorLicense: z.string().optional(),
  doctorCardNum: z.string().optional(),
  signatureUrl: z.string().optional(),
})

type MedicoForm = z.infer<typeof schema>

export function TabMedico() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MedicoForm>({
    resolver: zodResolver(schema),
  })

  const signatureUrlValue = watch('signatureUrl')

  useEffect(() => {
    if (signatureUrlValue) setSignaturePreview(signatureUrlValue)
  }, [signatureUrlValue])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/configuracion')
        if (res.ok) {
          const data = await res.json()
          reset({
            doctorName: data.doctorName ?? '',
            doctorSpecialties: data.doctorSpecialties ?? '',
            doctorLicense: data.doctorLicense ?? '',
            doctorCardNum: data.doctorCardNum ?? '',
            signatureUrl: data.signatureUrl ?? '',
          })
          if (data.signatureUrl) setSignaturePreview(data.signatureUrl)
        }
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [reset])

  const onSubmit = async (data: MedicoForm) => {
    setLoading(true)
    try {
      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast.success('Información del médico guardada')
    } catch {
      toast.error('Error al guardar la información')
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
        <CardTitle className="text-lg">Información del médico / doctora</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="doctorName">Nombre completo *</Label>
              <Input id="doctorName" placeholder="Dra. Alejandra Bárcenas" {...register('doctorName')} />
              {errors.doctorName && (
                <p className="text-xs text-red-600">{errors.doctorName.message}</p>
              )}
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="doctorSpecialties">Especialidades</Label>
              <Input
                id="doctorSpecialties"
                placeholder="Medicina Laboral, Estética, Cardiovascular"
                {...register('doctorSpecialties')}
              />
              <p className="text-xs text-content-muted">Separadas por coma</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="doctorLicense">Número de registro médico</Label>
              <Input id="doctorLicense" placeholder="RM-123456" {...register('doctorLicense')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="doctorCardNum">Tarjeta profesional</Label>
              <Input id="doctorCardNum" placeholder="TP-987654" {...register('doctorCardNum')} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="signatureUrl">URL de firma (PNG con fondo transparente)</Label>
              <Input
                id="signatureUrl"
                placeholder="https://ejemplo.com/firma.png"
                {...register('signatureUrl')}
              />
              <p className="text-xs text-content-muted">
                Imagen PNG con fondo transparente, máximo 1MB recomendado
              </p>
            </div>
          </div>

          {/* Signature preview */}
          {signaturePreview && (
            <div className="space-y-2">
              <Label>Vista previa de la firma</Label>
              <div className="border border-border rounded-xl p-4 bg-gray-50 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signaturePreview}
                  alt="Firma"
                  className="max-h-20 object-contain"
                  onError={() => setSignaturePreview(null)}
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar información'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
