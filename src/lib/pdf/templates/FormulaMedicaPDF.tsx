import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  C,
} from '@/lib/pdf/base'
import { PDFHeader, PDFFooter } from '@/lib/pdf/base'
import type { Prescription, PrescriptionItem, Patient } from '@/types'
function calculateAge(birthDate: string | Date): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const S = StyleSheet.create({
  body: { paddingHorizontal: 32 },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.brandDk,
    letterSpacing: 1,
  },
  brandLine: {
    width: 60,
    height: 2,
    backgroundColor: C.brand,
    marginTop: 4,
    marginBottom: 4,
    alignSelf: 'center',
  },
  patientRow: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    padding: 10,
    borderRadius: 6,
    marginBottom: 14,
  },
  patientCol: { flex: 1 },
  fieldLabel: { fontSize: 7, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 1 },
  fieldValue: { fontSize: 9, color: C.text },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.brand,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    borderBottom: `1px solid ${C.border}`,
    paddingBottom: 3,
    marginBottom: 6,
    marginTop: 10,
  },
  diagnosisBox: {
    backgroundColor: C.bg,
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    fontSize: 9,
    color: C.text,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.brand,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottom: `1px solid ${C.border}`,
  },
  tableRowAlt: { backgroundColor: C.bg },
  thCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white },
  tdCell: { fontSize: 8, color: C.text },
  colMed: { flex: 2 },
  colConc: { width: '12%' },
  colDose: { width: '14%' },
  colFreq: { width: '18%' },
  colDur: { width: '12%' },
  colRoute: { width: '12%' },
  instructionsBox: {
    backgroundColor: C.bg,
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    fontSize: 9,
    color: C.text,
    lineHeight: 1.5,
  },
  signaturesRow: {
    flexDirection: 'row',
    marginTop: 32,
    justifyContent: 'space-between',
  },
  sigBox: {
    width: '40%',
    alignItems: 'center',
  },
  sigLine: { borderBottom: `1px solid ${C.text}`, width: '100%', marginBottom: 4 },
  sigName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },
  sigRole: { fontSize: 7, color: C.muted },
  validity: {
    marginTop: 16,
    borderTop: `1px solid ${C.border}`,
    paddingTop: 6,
    textAlign: 'center' as const,
    fontSize: 8,
    color: C.muted,
    fontFamily: 'Helvetica-Oblique',
  },
})

function fmtDate(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface FormulaMedicaPDFProps {
  prescription: Prescription & {
    patient: Patient
    user: { name: string }
    items: PrescriptionItem[]
  }
}

export function FormulaMedicaPDF({ prescription }: FormulaMedicaPDFProps) {
  const { patient, user, items } = prescription
  const patientName = `${patient.firstName} ${patient.lastName}`
  const age = calculateAge(patient.birthDate)

  return (
    <Document>
      <Page size="A4" style={{ fontFamily: 'Helvetica', fontSize: 9, color: C.text, paddingBottom: 50 }}>
        <PDFHeader documentType="FÓRMULA MÉDICA" date={fmtDate(prescription.createdAt)} />

        <View style={S.body}>
          {/* Title */}
          <View style={S.titleBlock}>
            <Text style={S.title}>FÓRMULA MÉDICA</Text>
            <View style={S.brandLine} />
          </View>

          {/* Patient info */}
          <View style={S.patientRow}>
            <View style={S.patientCol}>
              <Text style={S.fieldLabel}>Paciente</Text>
              <Text style={{ ...S.fieldValue, fontFamily: 'Helvetica-Bold', fontSize: 10 }}>{patientName}</Text>
              <Text style={S.fieldValue}>{patient.documentType}: {patient.documentNumber}</Text>
            </View>
            <View style={S.patientCol}>
              <Text style={S.fieldLabel}>Edad</Text>
              <Text style={S.fieldValue}>{age} años</Text>
              <Text style={{ ...S.fieldLabel, marginTop: 4 }}>Fecha</Text>
              <Text style={S.fieldValue}>{fmtDate(prescription.createdAt)}</Text>
            </View>
            <View style={S.patientCol}>
              <Text style={S.fieldLabel}>Médico</Text>
              <Text style={S.fieldValue}>{user.name}</Text>
            </View>
          </View>

          {/* Diagnosis */}
          {prescription.diagnosis && (
            <>
              <Text style={S.sectionTitle}>Diagnóstico</Text>
              <View style={S.diagnosisBox}>
                <Text>{prescription.diagnosis}</Text>
              </View>
            </>
          )}

          {/* Medications */}
          <Text style={S.sectionTitle}>Medicamentos prescritos</Text>
          <View style={S.tableHeader}>
            <Text style={{ ...S.thCell, ...S.colMed }}>Medicamento</Text>
            <Text style={{ ...S.thCell, ...S.colConc }}>Conc.</Text>
            <Text style={{ ...S.thCell, ...S.colDose }}>Dosis</Text>
            <Text style={{ ...S.thCell, ...S.colFreq }}>Frecuencia</Text>
            <Text style={{ ...S.thCell, ...S.colDur }}>Duración</Text>
            <Text style={{ ...S.thCell, ...S.colRoute }}>Vía</Text>
          </View>
          {items.map((item, i) => (
            <View key={item.id} style={i % 2 === 1 ? { ...S.tableRow, ...S.tableRowAlt } : S.tableRow}>
              <Text style={{ ...S.tdCell, ...S.colMed, fontFamily: 'Helvetica-Bold' }}>{item.medication}</Text>
              <Text style={{ ...S.tdCell, ...S.colConc }}>{item.concentration ?? '—'}</Text>
              <Text style={{ ...S.tdCell, ...S.colDose }}>{item.dose}</Text>
              <Text style={{ ...S.tdCell, ...S.colFreq }}>{item.frequency}</Text>
              <Text style={{ ...S.tdCell, ...S.colDur }}>{item.duration}</Text>
              <Text style={{ ...S.tdCell, ...S.colRoute }}>{item.route ?? 'Oral'}</Text>
            </View>
          ))}

          {/* Instructions */}
          {prescription.instructions && (
            <>
              <Text style={S.sectionTitle}>Indicaciones generales</Text>
              <View style={S.instructionsBox}>
                <Text>{prescription.instructions}</Text>
              </View>
            </>
          )}

          {/* Signatures */}
          <View style={S.signaturesRow}>
            <View style={S.sigBox}>
              <View style={S.sigLine} />
              <Text style={S.sigName}>{patientName}</Text>
              <Text style={S.sigRole}>Paciente — {patient.documentType} {patient.documentNumber}</Text>
            </View>
            <View style={S.sigBox}>
              <View style={S.sigLine} />
              <Text style={S.sigName}>{user.name}</Text>
              <Text style={S.sigRole}>Médico tratante</Text>
            </View>
          </View>

          <Text style={S.validity}>
            Válida por 30 días desde la fecha de emisión — {fmtDate(prescription.createdAt)}
          </Text>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  )
}
