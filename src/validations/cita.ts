import { z } from 'zod'

export const citaSchema = z.object({
  patientId: z.string().min(1, 'Seleccione un paciente'),
  userId: z.string().min(1, 'Seleccione un médico'),
  date: z
    .string()
    .min(1, 'La fecha es requerida')
    .refine(
      (val) => {
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: 'Fecha inválida' }
    ),
  duration: z
    .number()
    .min(15, 'La duración mínima es 15 minutos')
    .max(240, 'La duración máxima es 240 minutos')
    .default(30),
  type: z.enum(['LABORAL', 'ESTETICA', 'CARDIOVASCULAR', 'CONTROL'], {
    required_error: 'Seleccione el tipo de cita',
  }),
  status: z
    .enum(['CONFIRMADA', 'PENDIENTE', 'CANCELADA', 'NO_ASISTIO'])
    .default('PENDIENTE'),
  notes: z
    .string()
    .max(1000, 'Las notas no pueden superar 1000 caracteres')
    .optional()
    .or(z.literal('')),
  whatsappReminder: z.boolean().default(false),
  primeraVez: z.boolean().default(false),
  valorConsulta: z
    .number()
    .min(0, 'El valor no puede ser negativo')
    .max(99999999, 'Valor demasiado alto')
    .nullable()
    .optional(),
  prioridad: z.boolean().default(false),
})

export type CitaFormData = z.infer<typeof citaSchema>
