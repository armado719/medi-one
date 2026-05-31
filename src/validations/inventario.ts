import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  unit: z.enum(['und', 'ml', 'mg', 'g', 'L']).default('und'),
  stockCurrent: z.number().min(0, 'El stock no puede ser negativo').default(0),
  stockMinimum: z.number().min(0, 'El stock mínimo no puede ser negativo').default(0),
  unitPrice: z.number().min(0, 'El precio no puede ser negativo').default(0),
})

export const movimientoSchema = z.object({
  type: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE']),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  reason: z.string().min(1, 'La razón es requerida'),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type MovimientoInput = z.infer<typeof movimientoSchema>
