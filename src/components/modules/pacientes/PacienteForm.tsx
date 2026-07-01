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
          primerNombre: patient.primerNombre || '',
          segundoNombre: patient.segundoNombre || '',
          primerApellido: patient.primerApellido || '',
          segundoApellido: patient.segundoApellido || '',
          estadoCivil: (patient.estadoCivil as PacienteFormData['estadoCivil']) || '',
          documentType: patient.documentType,
          documentNumber: patient.documentNumber,
          birthDate: patient.birthDate
            ? new Date(patient.birthDate).toISOString().split('T')[0]
            : '',
          sex: patient.sex,
          phone: patient.phone,
          telefonoAlternativo: patient.telefonoAlternativo || '',
          email: patient.email || '',
          address: patient.address || '',
          city: patient.city || '',
          zona: (patient.zona as PacienteFormData['zona']) || '',
          departamento: patient.departamento || '',
          municipio: patient.municipio || '',
          eps: patient.eps || '',
          occupation: patient.occupation || '',
          religion: patient.religion || '',
          responsableNombre: patient.responsableNombre || '',
          responsableParentesco: (patient.responsableParentesco as PacienteFormData['responsableParentesco']) || '',
          responsableTelefono: patient.responsableTelefono || '',
          observaciones: patient.observaciones || '',
          status: patient.status,
        }
      : {
          status: 'ACTIVO',
        },
  })

  const status = watch('status')

  const onSubmit = async (data: PacienteFormData) => {
    try {
      // Sync firstName/lastName with new fields if new fields are filled
      if (data.primerNombre) {
        data.firstName = [data.primerNombre, data.segundoNombre].filter(Boolean).join(' ')
      }
      if (data.primerApellido) {
        data.lastName = [data.primerApellido, data.segundoApellido].filter(Boolean).join(' ')
      }

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Split name — 2x2 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primer nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="primerNombre">
                Primer nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="primerNombre"
                placeholder="Ej. María"
                {...register('primerNombre')}
              />
              {errors.primerNombre && (
                <p className="text-xs text-red-500">{errors.primerNombre.message}</p>
              )}
            </div>

            {/* Segundo nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="segundoNombre">Segundo nombre</Label>
              <Input
                id="segundoNombre"
                placeholder="Ej. Alejandra"
                {...register('segundoNombre')}
              />
            </div>

            {/* Primer apellido */}
            <div className="space-y-1.5">
              <Label htmlFor="primerApellido">
                Primer apellido <span className="text-red-500">*</span>
              </Label>
              <Input
                id="primerApellido"
                placeholder="Ej. García"
                {...register('primerApellido')}
              />
              {errors.primerApellido && (
                <p className="text-xs text-red-500">{errors.primerApellido.message}</p>
              )}
            </div>

            {/* Segundo apellido */}
            <div className="space-y-1.5">
              <Label htmlFor="segundoApellido">Segundo apellido</Label>
              <Input
                id="segundoApellido"
                placeholder="Ej. López"
                {...register('segundoApellido')}
              />
            </div>
          </div>

          {/* Legacy fields — hidden but kept for backend compatibility */}
          <input type="hidden" {...register('firstName')} />
          <input type="hidden" {...register('lastName')} />

          {/* Document + birth date + sex */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Estado civil */}
            <div className="space-y-1.5">
              <Label>Estado civil</Label>
              <Select
                defaultValue={patient?.estadoCivil || ''}
                onValueChange={(val) =>
                  setValue('estadoCivil', val as PacienteFormData['estadoCivil'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Soltero/a">Soltero/a</SelectItem>
                  <SelectItem value="Casado/a">Casado/a</SelectItem>
                  <SelectItem value="Unión libre">Unión libre</SelectItem>
                  <SelectItem value="Divorciado/a">Divorciado/a</SelectItem>
                  <SelectItem value="Viudo/a">Viudo/a</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos de Contacto */}
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

          {/* Teléfono alternativo */}
          <div className="space-y-1.5">
            <Label htmlFor="telefonoAlternativo">Teléfono alternativo</Label>
            <Input
              id="telefonoAlternativo"
              placeholder="Ej. 6011234567"
              {...register('telefonoAlternativo')}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5 md:col-span-2">
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
        </CardContent>
      </Card>

      {/* Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle>Ubicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Zona / Departamento / Municipio — 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Zona</Label>
              <Select
                defaultValue={patient?.zona || ''}
                onValueChange={(val) =>
                  setValue('zona', val as PacienteFormData['zona'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Urbana">Urbana</SelectItem>
                  <SelectItem value="Rural">Rural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="departamento">Departamento</Label>
              <Input
                id="departamento"
                placeholder="Ej. Cundinamarca"
                {...register('departamento')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="municipio">Municipio/Ciudad</Label>
              <Input
                id="municipio"
                placeholder="Ej. Bogotá"
                {...register('municipio')}
              />
            </div>
          </div>

          {/* Dirección — full width */}
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              placeholder="Ej. Calle 123 # 45-67"
              {...register('address')}
            />
          </div>

          {/* Keep city field for backward compat — hidden mapping to municipio display */}
          <input type="hidden" {...register('city')} />
        </CardContent>
      </Card>

      {/* Información Adicional */}
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

          {/* Religión */}
          <div className="space-y-1.5">
            <Label htmlFor="religion">Religión</Label>
            <Input
              id="religion"
              placeholder="Ej. Católica, Cristiana..."
              {...register('religion')}
            />
          </div>

          {/* Estado */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 mt-6">
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

          {/* Observaciones */}
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              placeholder="Observaciones generales del paciente..."
              rows={3}
              {...register('observaciones')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacto de Emergencia */}
      <Card>
        <CardHeader>
          <CardTitle>Contacto de Emergencia</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre del responsable */}
          <div className="space-y-1.5">
            <Label htmlFor="responsableNombre">Nombre del responsable</Label>
            <Input
              id="responsableNombre"
              placeholder="Nombre completo"
              {...register('responsableNombre')}
            />
          </div>

          {/* Parentesco */}
          <div className="space-y-1.5">
            <Label>Parentesco</Label>
            <Select
              defaultValue={patient?.responsableParentesco || ''}
              onValueChange={(val) =>
                setValue(
                  'responsableParentesco',
                  val as PacienteFormData['responsableParentesco']
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Padre/Madre">Padre/Madre</SelectItem>
                <SelectItem value="Hijo/a">Hijo/a</SelectItem>
                <SelectItem value="Cónyuge/Pareja">Cónyuge/Pareja</SelectItem>
                <SelectItem value="Hermano/a">Hermano/a</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Teléfono del responsable */}
          <div className="space-y-1.5">
            <Label htmlFor="responsableTelefono">Teléfono del responsable</Label>
            <Input
              id="responsableTelefono"
              placeholder="Ej. 3001234567"
              {...register('responsableTelefono')}
            />
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
