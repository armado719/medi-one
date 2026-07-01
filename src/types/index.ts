export type Role = 'MEDICO' | 'RECEPCIONISTA' | 'ADMINISTRADOR'
export type InvoiceStatus = 'PENDIENTE' | 'PAGADO' | 'ANULADO'
export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'
export type EntryType = 'INGRESO' | 'EGRESO'
export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE'
export type ConsentStatus = 'PENDIENTE' | 'FIRMADO' | 'RECHAZADO'
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
  // Extended personal fields
  primerNombre?: string | null
  segundoNombre?: string | null
  primerApellido?: string | null
  segundoApellido?: string | null
  estadoCivil?: string | null
  // Extended location fields
  zona?: string | null
  departamento?: string | null
  municipio?: string | null
  // Extended contact fields
  telefonoAlternativo?: string | null
  religion?: string | null
  // Emergency contact
  responsableNombre?: string | null
  responsableParentesco?: string | null
  responsableTelefono?: string | null
  // Observations
  observaciones?: string | null
  createdAt: string
  updatedAt: string
  dataConsents?: DataConsent[]
}

export interface DataConsent {
  id: string
  patientId: string
  version: string
  contentHash: string
  acceptedAt: string
  acceptedById: string
  signature?: string | null
  revokedAt?: string | null
  createdAt: string
  acceptedBy?: { name: string }
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
  primeraVez?: boolean
  valorConsulta?: number | null
  prioridad?: boolean
  createdAt: string
  updatedAt: string
  patient?: Patient
  user?: { id: string; name: string }
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

// Phase 2 types

export interface InvoiceItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  subtotal: number
}

export interface Invoice {
  id: string
  number: string
  patientId: string
  userId: string
  appointmentId?: string | null
  status: InvoiceStatus
  paymentMethod?: PaymentMethod | null
  subtotal: number
  discount: number
  discountType: string
  taxAmount: number
  total: number
  notes?: string | null
  cancelReason?: string | null
  paidAt?: string | null
  createdAt: string
  updatedAt: string
  patient?: Patient
  items?: InvoiceItem[]
}

export interface Product {
  id: string
  name: string
  description?: string | null
  unit: string
  stockCurrent: number
  stockMinimum: number
  unitPrice: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface InventoryMovement {
  id: string
  productId: string
  type: MovementType
  quantity: number
  reason?: string | null
  userId: string
  createdAt: string
  user?: { name: string }
  product?: Product
}

export interface PrescriptionItem {
  id: string
  prescriptionId: string
  medication: string
  concentration?: string | null
  form?: string | null
  dose: string
  frequency: string
  duration: string
  route?: string | null
}

export interface Prescription {
  id: string
  patientId: string
  userId: string
  recordId?: string | null
  diagnosis?: string | null
  instructions?: string | null
  createdAt: string
  updatedAt: string
  patient?: Patient
  user?: { name: string }
  items?: PrescriptionItem[]
}

export interface ConsentTemplate {
  id: string
  name: string
  procedure: string
  content: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ConsentForm {
  id: string
  templateId: string
  patientId: string
  recordId?: string | null
  status: ConsentStatus
  signedAt?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  template?: ConsentTemplate
  patient?: Patient
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
