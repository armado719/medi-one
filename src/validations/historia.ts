import { z } from 'zod'

// ---- Historia Laboral ----
export const riesgoOcupacionalSchema = z.object({
  fisico: z.boolean().default(false),
  quimico: z.boolean().default(false),
  biologico: z.boolean().default(false),
  ergonomico: z.boolean().default(false),
  psicosocial: z.boolean().default(false),
  mecanico: z.boolean().default(false),
  electrico: z.boolean().default(false),
  descripcion: z.record(z.string(), z.string()).default({}),
})

export const sistemaRevisionSchema = z.object({
  presente: z.boolean().default(false),
  descripcion: z.string().default(''),
})

export const paraclinicoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  resultado: z.string(),
  valorReferencia: z.string(),
  anormal: z.boolean().default(false),
})

export const historiaLaboralSchema = z.object({
  patientId: z.string().min(1, 'Seleccione un paciente'),
  // Tab 1: Datos Laborales
  empresa: z.string().min(1, 'La empresa es requerida'),
  nit: z.string(),
  cargo: z.string().min(1, 'El cargo es requerido'),
  area: z.string(),
  tiempoLaborando: z.string(),
  tipoExamen: z.enum(['Ingreso', 'Periódico', 'Retiro', 'Post-incapacidad']),
  // Tab 2: Riesgos
  riesgos: riesgoOcupacionalSchema,
  // Tab 3: Antecedentes
  antecedentesPer: z.object({
    patologicos: z.string().default(''),
    quirurgicos: z.string().default(''),
    traumaticos: z.string().default(''),
    toxicos: z.string().default(''),
    farmacologicos: z.string().default(''),
  }),
  antecedentesFam: z.string().default(''),
  // Tab 4: Revisión por sistemas
  revisionSistemas: z.record(z.string(), sistemaRevisionSchema).default({}),
  // Tab 5: Examen físico
  examenFisico: z.object({
    ta: z.string().default(''),
    fc: z.number().nullable().default(null),
    fr: z.number().nullable().default(null),
    temp: z.number().nullable().default(null),
    peso: z.number().nullable().default(null),
    talla: z.number().nullable().default(null),
    imc: z.number().nullable().default(null),
    hallazgos: z.record(z.string(), z.string()).default({}),
  }),
  // Tab 6: Paraclínicos
  paraclínicos: z.array(paraclinicoSchema).default([]),
  // Tab 7: Diagnóstico
  diagnostico: z.object({
    cie10: z.string().default(''),
    descripcion: z.string().default(''),
  }),
  // Tab 8: Conclusión
  conclusion: z.object({
    aptitud: z.enum(['Apto', 'Apto con restricciones', 'No apto']),
    restricciones: z.string().default(''),
    recomendaciones: z.string().default(''),
  }),
})

export type HistoriaLaboralFormData = z.infer<typeof historiaLaboralSchema>

// ---- Historia Estética ----
export const materialUsadoSchema = z.object({
  producto: z.string().min(1, 'Producto requerido'),
  marca: z.string(),
  lote: z.string(),
  cantidad: z.string(),
})

export const historiaEsteticaSchema = z.object({
  patientId: z.string().min(1, 'Seleccione un paciente'),
  // Tab 1
  motivoConsulta: z.string().min(1, 'El motivo de consulta es requerido'),
  // Tab 2
  antecedentes: z.object({
    alergias: z.string().default(''),
    medicamentosActuales: z.string().default(''),
    cirugiasPrevias: z.string().default(''),
    enfermedadesCronicas: z.string().default(''),
  }),
  // Tab 3
  zonasTratar: z.object({
    rostro: z.boolean().default(false),
    cuello: z.boolean().default(false),
    escote: z.boolean().default(false),
    abdomen: z.boolean().default(false),
    brazos: z.boolean().default(false),
    piernas: z.boolean().default(false),
    gluteos: z.boolean().default(false),
    otro: z.boolean().default(false),
    descripcion: z.string().default(''),
  }),
  // Tab 4
  procedimiento: z.object({
    nombre: z.string().default(''),
    tecnica: z.string().default(''),
    duracion: z.string().default(''),
  }),
  // Tab 5
  materialesUsados: z.array(materialUsadoSchema).default([]),
  // Tab 6: fotografías (handled separately)
  fotografias: z.array(z.object({
    url: z.string(),
    categoria: z.enum(['Antes', 'Durante', 'Después']),
    nombre: z.string(),
  })).default([]),
  // Tab 7
  evolucion: z.object({
    descripcion: z.string().default(''),
    proximaCita: z.string().default(''),
  }),
  // Tab 8
  consentimiento: z.object({
    estado: z.enum(['Firmado', 'Pendiente']).default('Pendiente'),
  }),
})

export type HistoriaEsteticaFormData = z.infer<typeof historiaEsteticaSchema>

// ---- Historia Cardiovascular ----
export const historiaCardiovascularSchema = z.object({
  patientId: z.string().min(1, 'Seleccione un paciente'),
  // Tab 1: Signos vitales
  signosVitales: z.object({
    tas: z.number().min(60).max(300).nullable().default(null),
    tad: z.number().min(40).max(200).nullable().default(null),
    fc: z.number().min(30).max(300).nullable().default(null),
    fr: z.number().min(8).max(60).nullable().default(null),
    temp: z.number().min(34).max(42).nullable().default(null),
    peso: z.number().min(1).max(500).nullable().default(null),
    talla: z.number().min(50).max(250).nullable().default(null),
    imc: z.number().nullable().default(null),
    glucosa: z.number().min(50).max(600).nullable().default(null),
  }),
  // Tab 2: Perfil lipídico
  perfilLipidico: z.object({
    colesterolTotal: z.number().nullable().default(null),
    hdl: z.number().nullable().default(null),
    ldl: z.number().nullable().default(null),
    trigliceridos: z.number().nullable().default(null),
  }),
  // Tab 3: Hábitos
  habitos: z.object({
    tabaquismo: z.boolean().default(false),
    tabaquismoCuantos: z.string().default(''),
    alcohol: z.boolean().default(false),
    alcoholFrecuencia: z.string().default(''),
    actividadFisica: z.boolean().default(false),
    actividadFisicaTipo: z.string().default(''),
  }),
  // Tab 4: Antecedentes
  antecedentesFamiliares: z.object({
    hta: z.boolean().default(false),
    dm: z.boolean().default(false),
    iam: z.boolean().default(false),
    acv: z.boolean().default(false),
    otros: z.string().default(''),
  }),
  antecedentesPersonales: z.string().default(''),
  // Tab 5: Framingham (calculated)
  framingham: z.object({
    score: z.number(),
    riesgo: z.enum(['Bajo', 'Moderado', 'Alto']),
    porcentaje: z.number(),
  }).nullable().default(null),
  // Tab 6: Diagnóstico
  diagnostico: z.string().default(''),
  plan: z.string().default(''),
})

export type HistoriaCardiovascularFormData = z.infer<typeof historiaCardiovascularSchema>
