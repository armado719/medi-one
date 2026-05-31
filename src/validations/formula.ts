import { z } from 'zod'

export const prescriptionItemSchema = z.object({
  medication: z.string().min(1, 'El medicamento es requerido'),
  concentration: z.string().optional(),
  form: z.string().optional(),
  dose: z.string().min(1, 'La dosis es requerida'),
  frequency: z.string().min(1, 'La frecuencia es requerida'),
  duration: z.string().min(1, 'La duración es requerida'),
  route: z.string().optional(),
})

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'El paciente es requerido'),
  recordId: z.string().optional(),
  diagnosis: z.string().optional(),
  instructions: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'Se requiere al menos un medicamento'),
})

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>
