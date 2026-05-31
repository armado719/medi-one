export type Role = 'MEDICO' | 'RECEPCIONISTA' | 'ADMINISTRADOR'
export type DocumentType = 'CC' | 'CE' | 'PA' | 'TI'
export type Sex = 'MASCULINO' | 'FEMENINO' | 'OTRO'
export type PatientStatus = 'ACTIVO' | 'INACTIVO'
export type AppointmentType = 'LABORAL' | 'ESTETICA' | 'CARDIOVASCULAR' | 'CONTROL'
export type AppointmentStatus = 'CONFIRMADA' | 'PENDIENTE' | 'CANCELADA' | 'NO_ASISTIO'
export type ClinicalRecordType = 'LABORAL' | 'ESTETICA' | 'CARDIOVASCULAR'

export interface UserSession {
  id: string
  name: string
  email: string
  role: Role
}

export interface Patient {
  id: string
  firstName: string
  lastName: string
  documentType: DocumentType
  documentNumber: string
  birthDate: string
  sex: Sex
  phone: string
  email?: string | null
  address?: string | null
  city?: string | null
  eps?: string | null
  occupation?: string | null
  status: PatientStatus
  photoUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  patientId: string
  userId: string
  date: string
  duration: number
  type: AppointmentType
  status: AppointmentStatus
  notes?: string | null
  whatsappReminder: boolean
  createdAt: string
  updatedAt: string
  patient?: Patient
}

export interface ClinicalRecord {
  id: string
  patientId: string
  userId: string
  type: ClinicalRecordType
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Historia Laboral types
export interface RiesgoOcupacional {
  fisico: boolean
  quimico: boolean
  biologico: boolean
  ergonomico: boolean
  psicosocial: boolean
  mecanico: boolean
  electrico: boolean
  descripcion: Record<string, string>
}

export interface SistemaRevision {
  presente: boolean
  descripcion: string
}

export interface Paraclínico {
  nombre: string
  resultado: string
  valorReferencia: string
  anormal: boolean
}

export interface HistoriaLaboralData {
  empresa: string
  nit: string
  cargo: string
  area: string
  tiempoLaborando: string
  tipoExamen: 'Ingreso' | 'Periódico' | 'Retiro' | 'Post-incapacidad'
  riesgos: RiesgoOcupacional
  antecedentesPer: {
    patologicos: string
    quirurgicos: string
    traumaticos: string
    toxicos: string
    farmacologicos: string
  }
  antecedentesFam: string
  revisionSistemas: Record<string, SistemaRevision>
  examenFisico: {
    ta: string
    fc: number | null
    fr: number | null
    temp: number | null
    peso: number | null
    talla: number | null
    imc: number | null
    hallazgos: Record<string, string>
  }
  paraclínicos: Paraclínico[]
  diagnostico: {
    cie10: string
    descripcion: string
  }
  conclusion: {
    aptitud: 'Apto' | 'Apto con restricciones' | 'No apto'
    restricciones: string
    recomendaciones: string
  }
}

// Historia Estética types
export interface MaterialUsado {
  producto: string
  marca: string
  lote: string
  cantidad: string
}

export interface FotografiaClinica {
  url: string
  categoria: 'Antes' | 'Durante' | 'Después'
  nombre: string
}

export interface HistoriaEsteticaData {
  motivoConsulta: string
  antecedentes: {
    alergias: string
    medicamentosActuales: string
    cirugiasPrevias: string
    enfermedadesCronicas: string
  }
  zonasTratar: {
    rostro: boolean
    cuello: boolean
    escote: boolean
    abdomen: boolean
    brazos: boolean
    piernas: boolean
    gluteos: boolean
    otro: boolean
    descripcion: string
  }
  procedimiento: {
    nombre: string
    tecnica: string
    duracion: string
  }
  materialesUsados: MaterialUsado[]
  fotografias: FotografiaClinica[]
  evolucion: {
    descripcion: string
    proximaCita: string
  }
  consentimiento: {
    estado: 'Firmado' | 'Pendiente'
  }
}

// Historia Cardiovascular types
export interface HistoriaCardiovascularData {
  signosVitales: {
    tas: number | null
    tad: number | null
    fc: number | null
    fr: number | null
    temp: number | null
    peso: number | null
    talla: number | null
    imc: number | null
    glucosa: number | null
  }
  perfilLipidico: {
    colesterolTotal: number | null
    hdl: number | null
    ldl: number | null
    trigliceridos: number | null
  }
  habitos: {
    tabaquismo: boolean
    tabaquismoCuantos: string
    alcohol: boolean
    alcoholFrecuencia: string
    actividadFisica: boolean
    actividadFisicaTipo: string
  }
  antecedentesFamiliares: {
    hta: boolean
    dm: boolean
    iam: boolean
    acv: boolean
    otros: string
  }
  antecedentesPersonales: string
  framingham: {
    score: number
    riesgo: 'Bajo' | 'Moderado' | 'Alto'
    porcentaje: number
  } | null
  diagnostico: string
  plan: string
}
