'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createTemplateSchema, type CreateTemplateInput } from '@/validations/consentimiento'
import type { ConsentTemplate } from '@/types'

const AVAILABLE_VARS = [
  { key: 'nombre_paciente', label: 'Nombre del paciente' },
  { key: 'fecha', label: 'Fecha del documento' },
  { key: 'procedimiento', label: 'Nombre del procedimiento' },
  { key: 'medico', label: 'Nombre del médico' },
  { key: 'documento', label: 'Documento del paciente' },
]

interface Props {
  template?: ConsentTemplate
  onSuccess?: (template: ConsentTemplate) => void
  onCancel?: () => void
}

export function ConsentimientoTemplateForm({ template, onSuccess, onCancel }: Props) {
  const isEditing = !!template

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTemplateInput>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: template?.name ?? '',
      procedure: template?.procedure ?? '',
      content: template?.content ?? '',
    },
  })

  const onSubmit = async (data: CreateTemplateInput) => {
    try {
      const url = isEditing ? `/api/consentimientos/templates/${template.id}` : '/api/consentimientos/templates'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar la plantilla')
      }

      const saved = await res.json()
      toast.success(isEditing ? 'Plantilla actualizada' : 'Plantilla creada exitosamente')
      onSuccess?.(saved)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar la plantilla')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Nombre de la plantilla *</Label>
          <Input {...register('name')} placeholder="ej. Consentimiento Botox" />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <Label>Procedimiento *</Label>
          <Input {...register('procedure')} placeholder="ej. Aplicación de Toxina Botulínica" />
          {errors.procedure && <p className="text-sm text-red-500">{errors.procedure.message}</p>}
        </div>
      </div>

      {/* Variables reference */}
      <div className="bg-brand/5 border border-brand/20 rounded-xl p-4">
        <p className="text-sm font-medium text-content mb-2">Variables disponibles en el contenido:</p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_VARS.map((v) => (
            <code
              key={v.key}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-border rounded text-xs text-brand font-mono cursor-default"
              title={v.label}
            >
              {`{{${v.key}}}`}
            </code>
          ))}
        </div>
        <p className="text-xs text-content-muted mt-2">
          Estas variables serán reemplazadas automáticamente al generar el documento para el paciente.
        </p>
      </div>

      <div className="space-y-1">
        <Label>Contenido del consentimiento *</Label>
        <Textarea
          {...register('content')}
          placeholder="Escriba el contenido del consentimiento informado. Use las variables indicadas arriba para personalizar el documento..."
          rows={12}
          className="font-mono text-sm"
        />
        {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar plantilla' : 'Crear plantilla'}
        </Button>
      </div>
    </form>
  )
}
