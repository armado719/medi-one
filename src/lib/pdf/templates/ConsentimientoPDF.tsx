import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  C,
} from '@/lib/pdf/base'
import { PDFHeader, PDFFooter } from '@/lib/pdf/base'
import type { ConsentForm, ConsentTemplate, Patient } from '@/types'

const S = StyleSheet.create({
  body: { paddingHorizontal: 32 },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.brandDk,
    letterSpacing: 1,
  },
  procedure: {
    fontSize: 10,
    color: C.muted,
    marginTop: 3,
  },
  brandLine: {
    width: 60,
    height: 2,
    backgroundColor: C.brand,
    marginTop: 6,
    alignSelf: 'center',
  },
  patientBox: {
    backgroundColor: C.bg,
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    flexDirection: 'row',
  },
  patientCol: { flex: 1 },
  fieldLabel: { fontSize: 7, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 1 },
  fieldValue: { fontSize: 9, color: C.text },
  contentTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.brand,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    borderBottom: `1px solid ${C.border}`,
    paddingBottom: 3,
    marginBottom: 10,
  },
  contentText: {
    fontSize: 9,
    color: C.text,
    lineHeight: 1.6,
    marginBottom: 16,
  },
  declarationBox: {
    backgroundColor: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: 12,
    marginBottom: 24,
  },
  declarationText: {
    fontSize: 9,
    color: C.text,
    lineHeight: 1.6,
    fontFamily: 'Helvetica-Oblique',
  },
  signaturesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  sigBox: {
    width: '43%',
  },
  sigLine: { borderBottom: `1px solid ${C.text}`, marginBottom: 4 },
  sigName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },
  sigRole: { fontSize: 7, color: C.muted },
  dateBlock: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 4,
  },
  dateLabel: { fontSize: 8, color: C.muted },
  dateLine: { flex: 1, borderBottom: `1px solid ${C.border}` },
})

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return '__________'
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

function replaceVariables(content: string, vars: Record<string, string>): string {
  let result = content
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  // Strip any remaining HTML tags
  result = result.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return result
}

interface ConsentimientoPDFProps {
  consentForm: ConsentForm & {
    template: ConsentTemplate
    patient: Patient
  }
  doctorName?: string
}

export function ConsentimientoPDF({ consentForm, doctorName = 'Dra. Alejandra Bárcenas' }: ConsentimientoPDFProps) {
  const { template, patient } = consentForm
  const patientName = `${patient.firstName} ${patient.lastName}`

  const variables: Record<string, string> = {
    nombre_paciente: patientName,
    fecha: fmtDate(consentForm.createdAt),
    procedimiento: template.procedure,
    medico: doctorName,
    documento: `${patient.documentType} ${patient.documentNumber}`,
  }

  const contentText = replaceVariables(template.content, variables)

  return (
    <Document>
      <Page size="A4" style={{ fontFamily: 'Helvetica', fontSize: 9, color: C.text, paddingBottom: 50 }}>
        <PDFHeader documentType="CONSENTIMIENTO INFORMADO" date={fmtDate(consentForm.createdAt)} />

        <View style={S.body}>
          {/* Title */}
          <View style={S.titleBlock}>
            <Text style={S.title}>CONSENTIMIENTO INFORMADO</Text>
            <Text style={S.procedure}>{template.procedure}</Text>
            <View style={S.brandLine} />
          </View>

          {/* Patient data */}
          <View style={S.patientBox}>
            <View style={S.patientCol}>
              <Text style={S.fieldLabel}>Paciente</Text>
              <Text style={{ ...S.fieldValue, fontFamily: 'Helvetica-Bold' }}>{patientName}</Text>
            </View>
            <View style={S.patientCol}>
              <Text style={S.fieldLabel}>Documento</Text>
              <Text style={S.fieldValue}>{patient.documentType} {patient.documentNumber}</Text>
            </View>
            <View style={S.patientCol}>
              <Text style={S.fieldLabel}>Fecha</Text>
              <Text style={S.fieldValue}>{fmtDate(consentForm.createdAt)}</Text>
            </View>
          </View>

          {/* Content */}
          <Text style={S.contentTitle}>Información del procedimiento</Text>
          <Text style={S.contentText}>{contentText}</Text>

          {/* Declaration */}
          <View style={S.declarationBox}>
            <Text style={S.declarationText}>
              Yo, {patientName}, identificado(a) con {patient.documentType} número {patient.documentNumber},
              declaro haber leído y comprendido el presente documento. He tenido la oportunidad de hacer
              preguntas sobre el procedimiento, sus riesgos, beneficios y alternativas. Manifiesto que
              comprendo la información recibida y en pleno uso de mis facultades mentales, DOY MI
              CONSENTIMIENTO para la realización del procedimiento: {template.procedure}.
            </Text>
          </View>

          {/* Signatures */}
          <View style={S.signaturesGrid}>
            <View style={S.sigBox}>
              <View style={S.sigLine} />
              <Text style={S.sigName}>{patientName}</Text>
              <Text style={S.sigRole}>{patient.documentType} {patient.documentNumber}</Text>
              <Text style={S.sigRole}>Firma del paciente</Text>
            </View>
            <View style={S.sigBox}>
              <View style={S.sigLine} />
              <Text style={S.sigName}>{doctorName}</Text>
              <Text style={S.sigRole}>Médico tratante</Text>
              <Text style={S.sigRole}>MEDI ONE</Text>
            </View>
          </View>

          {/* Date */}
          <View style={S.dateBlock}>
            <Text style={S.dateLabel}>Fecha y lugar:</Text>
            <View style={S.dateLine} />
          </View>
        </View>

        <PDFFooter text="Documento confidencial — MEDI ONE" />
      </Page>
    </Document>
  )
}
