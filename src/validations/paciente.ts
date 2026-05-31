import { z } from 'zod'

export const pacienteSchema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100, 'El apellido no puede superar 100 caracteres'),
  documentType: z.enum(['CC', 'CE', 'PA', 'TI'], {
    required_error: 'Seleccione el tipo de documento',
  }),
  documentNumber: z
    .string()
    .min(6, 'El número de documento debe tener al menos 6 dígitos')
    .max(12, 'El número de documento no puede superar 12 dígitos')
    .regex(/^\d+$/, 'El número de documento solo debe contener dígitos'),
  birthDate: z
    .string()
    .min(1, 'La fecha de nacimiento es requerida')
    .refine(
      (val) => {
        const date = new Date(val)
        const today = new Date()
        return date < today
      },
      { message: 'La fecha de nacimiento no puede ser futura' }
    ),
  sex: z.enum(['MASCULINO', 'FEMENINO', 'OTRO'], {
    required_error: 'Seleccione el sexo',
  }),
  phone: z
    .string()
    .length(10, 'El teléfono debe tener exactamente 10 dígitos')
    .regex(/^3\d{9}$/, 'El teléfono debe empezar con 3 y tener 10 dígitos'),
  email: z
    .string()
    .email('Ingrese un email válido')
    .optional()
    .or(z.literal('')),
  address: z.string().max(500, 'La dirección no puede superar 500 caracteres').optional().or(z.literal('')),
  city: z.string().max(100, 'La ciudad no puede superar 100 caracteres').optional().or(z.literal('')),
  eps: z.string().max(255, 'La EPS no puede superar 255 caracteres').optional().or(z.literal('')),
  occupation: z.string().max(255, 'La ocupación no puede superar 255 caracteres').optional().or(z.literal('')),
  status: z.enum(['ACTIVO', 'INACTIVO']).default('ACTIVO'),
})

export type PacienteFormData = z.infer<typeof pacienteSchema>
