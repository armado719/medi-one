import { z } from 'zod'

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  procedure: z.string().min(1, 'El procedimiento es requerido'),
  content: z.string().min(10, 'El contenido es requerido'),
})

export const createConsentFormSchema = z.object({
  templateId: z.string().min(1, 'La plantilla es requerida'),
  patientId: z.string().min(1, 'El paciente es requerido'),
  recordId: z.string().optional(),
  status: z.enum(['PENDIENTE', 'FIRMADO', 'RECHAZADO']).default('PENDIENTE'),
  notes: z.string().optional(),
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type CreateConsentFormInput = z.infer<typeof createConsentFormSchema>
