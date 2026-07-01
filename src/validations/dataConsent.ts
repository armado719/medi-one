import { z } from 'zod'

export const createDataConsentSchema = z.object({
  version: z.string().min(1, 'La versión es requerida'),
  accepted: z.literal(true, {
    errorMap: () => ({ message: 'Debe aceptar el consentimiento' }),
  }),
  signature: z.string().optional(),
})

export type CreateDataConsentInput = z.infer<typeof createDataConsentSchema>
