import { z } from 'zod'

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.number().min(0, 'El precio no puede ser negativo'),
  taxRate: z.number().min(0).max(100),
  subtotal: z.number().min(0),
})

export const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'El paciente es requerido'),
  appointmentId: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Se requiere al menos un ítem'),
  discount: z.number().min(0).default(0),
  discountType: z.enum(['PORCENTAJE', 'VALOR']).default('PORCENTAJE'),
  paymentMethod: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']).optional(),
  notes: z.string().optional(),
})

export const markPaidSchema = z.object({
  paymentMethod: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'], {
    required_error: 'El método de pago es requerido',
  }),
})

export const cancelInvoiceSchema = z.object({
  cancelReason: z.string().min(5, 'La razón debe tener al menos 5 caracteres'),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type MarkPaidInput = z.infer<typeof markPaidSchema>
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>
