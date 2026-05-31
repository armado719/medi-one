'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { pacienteSchema, type PacienteFormData } from '@/validations/paciente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Patient } from '@/types'

interface PacienteFormProps {
  mode: 'create' | 'edit'
  patient?: Patient
}

export function PacienteForm({ mode, patient }: PacienteFormProps) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: patient
      ? {
          firstName: patient.firstName,
          lastName: patient.lastName,
          documentType: patient.documentType,
          documentNumber: patient.documentNumber,
          birthDate: patient.birthDate
            ? new Date(patient.birthDate).toISOString().split('T')[0]
            : '',
          sex: patient.sex,
          phone: patient.phone,
          email: patient.email || '',
          address: patient.address || '',
          city: patient.city || '',
          eps: patient.eps || '',
          occupation: patient.occupation || '',
          status: patient.status,
        }
      : {
          status: 'ACTIVO',
        },
  })

  const status = watch('status')

  const onSubmit = async (data: PacienteFormData) => {
    try {
      const url =
        mode === 'create' ? '/api/pacientes' : `/api/pacientes/${patient?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Error al guardar el paciente')
        return
      }

      toast.success(
        mode === 'create'
          ? 'Paciente creado exitosamente'
          : 'Paciente actualizado exitosamente'
      )
      router.push('/pacientes')
      router.refresh()
    } catch {
      toast.error('Ocurrió un error inesperado')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Datos personales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Personales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombres */}
          <div className="space-y-1.5">
            <Label htmlFor="firstName">
              Nombres <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              placeholder="Ej. María Alejandra"
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500">{errors.firstName.message}</p>
            )}
          </div>

          {/* Apellidos */}
          <div className="space-y-1.5">
            <Label htmlFor="lastName">
              Apellidos <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              placeholder="Ej. García López"
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500">{errors.lastName.message}</p>
            )}
          </div>

          {/* Tipo documento */}
          <div className="space-y-1.5">
            <Label>
              Tipo de documento <span className="text-red-500">*</span>
            </Label>
            <Select
              defaultValue={patient?.documentType}
              onValueChange={(val) =>
                setValue('documentType', val as PacienteFormData['documentType'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CC">Cédula de ciudadanía (CC)</SelectItem>
                <SelectItem value="CE">Cédula de extranjería (CE)</SelectItem>
                <SelectItem value="PA">Pasaporte (PA)</SelectItem>
                <SelectItem value="TI">Tarjeta de identidad (TI)</SelectItem>
              </SelectContent>
            </Select>
            {errors.documentType && (
              <p className="text-xs text-red-500">{errors.documentType.message}</p>
            )}
          </div>

          {/* Número documento */}
          <div className="space-y-1.5">
            <Label htmlFor="documentNumber">
              Número de documento <span className="text-red-500">*</span>
            </Label>
            <Input
              id="documentNumber"
              placeholder="Ej. 1234567890"
              {...register('documentNumber')}
            />
            {errors.documentNumber && (
              <p className="text-xs text-red-500">{errors.documentNumber.message}</p>
            )}
          </div>

          {/* Fecha nacimiento */}
          <div className="space-y-1.5">
            <Label htmlFor="birthDate">
              Fecha de nacimiento <span className="text-red-500">*</span>
            </Label>
            <Input
              id="birthDate"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              {...register('birthDate')}
            />
            {errors.birthDate && (
              <p className="text-xs text-red-500">{errors.birthDate.message}</p>
            )}
          </div>

          {/* Sexo */}
          <div className="space-y-1.5">
            <Label>
              Sexo <span className="text-red-500">*</span>
            </Label>
            <Select
              defaultValue={patient?.sex}
              onValueChange={(val) =>
                setValue('sex', val as PacienteFormData['sex'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MASCULINO">Masculino</SelectItem>
                <SelectItem value="FEMENINO">Femenino</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>
            {errors.sex && (
              <p className="text-xs text-red-500">{errors.sex.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Datos de contacto */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Teléfono */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Teléfono celular <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="Ej. 3001234567"
              maxLength={10}
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Dirección */}
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              placeholder="Ej. Calle 123 # 45-67"
              {...register('address')}
            />
          </div>

          {/* Ciudad */}
          <div className="space-y-1.5">
            <Label htmlFor="city">Ciudad</Label>
            <Input
              id="city"
              placeholder="Ej. Bogotá"
              {...register('city')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Datos médicos / adicionales */}
      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* EPS */}
          <div className="space-y-1.5">
            <Label htmlFor="eps">EPS</Label>
            <Input
              id="eps"
              placeholder="Ej. Sura, Compensar..."
              {...register('eps')}
            />
          </div>

          {/* Ocupación */}
          <div className="space-y-1.5">
            <Label htmlFor="occupation">Ocupación</Label>
            <Input
              id="occupation"
              placeholder="Ej. Ingeniero, Docente..."
              {...register('occupation')}
            />
          </div>

          {/* Estado */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center gap-3">
              <Switch
                id="status"
                checked={status === 'ACTIVO'}
                onCheckedChange={(checked) =>
                  setValue('status', checked ? 'ACTIVO' : 'INACTIVO')
                }
              />
              <Label htmlFor="status">
                Paciente{' '}
                <span
                  className={
                    status === 'ACTIVO' ? 'text-green-600' : 'text-red-500'
                  }
                >
                  {status === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                </span>
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            'Guardando...'
          ) : mode === 'create' ? (
            'Crear paciente'
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </form>
  )
}
