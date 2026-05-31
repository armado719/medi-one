import { Document, Page, Text, View } from '@react-pdf/renderer'
import {
  baseStyles as s,
  PDFHeader,
  PDFFooter,
  PDFField,
  C,
  StyleSheet,
} from '@/lib/pdf/base'
import { formatDate } from '@/lib/utils'
import { calculateFramingham } from '@/lib/framingham'
import type { HistoriaCardiovascularData } from '@/types'

const extra = StyleSheet.create({
  riskBajo: {
    backgroundColor: '#DCFCE7', color: '#166534',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4,
    fontSize: 11, fontFamily: 'Helvetica-Bold',
  },
  riskModerado: {
    backgroundColor: '#FEF9C3', color: '#854D0E',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4,
    fontSize: 11, fontFamily: 'Helvetica-Bold',
  },
  riskAlto: {
    backgroundColor: '#FEE2E2', color: '#991B1B',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4,
    fontSize: 11, fontFamily: 'Helvetica-Bold',
  },
  scoreBox: {
    borderRadius: 6, padding: 12, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FDF0EE', border: `1px solid ${C.border}`,
  },
  bigNumber: {
    fontSize: 32, fontFamily: 'Helvetica-Bold', color: C.brandDk,
  },
  bigLabel: {
    fontSize: 8, color: C.muted, marginTop: 2,
  },
})

const riskStyle: Record<string, import('@react-pdf/types').Style> = {
  Bajo: extra.riskBajo,
  Moderado: extra.riskModerado,
  Alto: extra.riskAlto,
}

interface Props {
  record: {
    id: string
    createdAt: string | Date
    data: HistoriaCardiovascularData
    patient: {
      firstName: string
      lastName: string
      documentType: string
      documentNumber: string
      birthDate: string | Date
      sex: string
    }
    user: { name: string }
  }
}

export function HistoriaCardiovascularPDF({ record }: Props) {
  const d = record.data
  const sv = d.signosVitales
  const pl = d.perfilLipidico
  const hab = d.habitos
  const fecha = formatDate(new Date(record.createdAt))
  const paciente = `${record.patient.firstName} ${record.patient.lastName}`

  const age = new Date().getFullYear() - new Date(record.patient.birthDate).getFullYear()
  const sex: 'MASCULINO' | 'FEMENINO' = record.patient.sex === 'Masculino' ? 'MASCULINO' : 'FEMENINO'

  const framingham = calculateFramingham({
    age,
    sex,
    totalCholesterol: Number(pl?.colesterolTotal) || 0,
    hdl: Number(pl?.hdl) || 0,
    systolicBP: Number(sv?.tas) || 0,
    smoker: hab?.tabaquismo === true,
    diabetes: sv?.glucosa ? Number(sv.glucosa) >= 126 : false,
  })

  const imc =
    sv?.peso && sv?.talla
      ? (Number(sv.peso) / Math.pow(Number(sv.talla) / 100, 2)).toFixed(1)
      : '—'

  return (
    <Document
      title={`Historia Cardiovascular — ${paciente}`}
      author="MEDI ONE"
      subject="Historia Riesgo Cardiovascular"
    >
      <Page size="A4" style={s.page}>
        <PDFHeader documentType="HISTORIA RIESGO CARDIOVASCULAR" date={fecha} />

        <View style={s.body}>
          {/* Paciente */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Datos del Paciente</Text>
            <View style={s.row}>
              <PDFField label="Nombre completo" value={paciente} style={s.col2} />
              <PDFField
                label="Documento"
                value={`${record.patient.documentType}: ${record.patient.documentNumber}`}
                style={s.col2}
              />
            </View>
            <View style={s.row}>
              <PDFField
                label="Fecha de nacimiento"
                value={formatDate(new Date(record.patient.birthDate))}
                style={s.col3}
              />
              <PDFField label="Sexo" value={record.patient.sex} style={s.col3} />
              <PDFField label="Edad" value={`${age} años`} style={s.col3} />
            </View>
          </View>

          {/* Signos vitales */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Signos Vitales y Medidas Antropométricas</Text>
            <View style={s.row}>
              <PDFField label="TA Sistólica (mmHg)" value={sv?.tas?.toString()} style={s.col4} />
              <PDFField label="TA Diastólica (mmHg)" value={sv?.tad?.toString()} style={s.col4} />
              <PDFField label="FC (lpm)" value={sv?.fc?.toString()} style={s.col4} />
              <PDFField label="Glucosa (mg/dL)" value={sv?.glucosa?.toString()} style={s.col4} />
            </View>
            <View style={s.row}>
              <PDFField label="Peso (kg)" value={sv?.peso?.toString()} style={s.col4} />
              <PDFField label="Talla (cm)" value={sv?.talla?.toString()} style={s.col4} />
              <PDFField label="IMC (kg/m²)" value={imc} style={s.col4} />
              <PDFField label="FR (rpm)" value={sv?.fr?.toString()} style={s.col4} />
            </View>
          </View>

          {/* Perfil lipídico */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Perfil Lipídico</Text>
            <View style={s.row}>
              <PDFField label="Colesterol total (mg/dL)" value={pl?.colesterolTotal?.toString()} style={s.col4} />
              <PDFField label="HDL (mg/dL)" value={pl?.hdl?.toString()} style={s.col4} />
              <PDFField label="LDL (mg/dL)" value={pl?.ldl?.toString()} style={s.col4} />
              <PDFField label="Triglicéridos (mg/dL)" value={pl?.trigliceridos?.toString()} style={s.col4} />
            </View>
          </View>

          {/* Hábitos */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Hábitos y Estilo de Vida</Text>
            <View style={s.row}>
              <PDFField
                label="Tabaquismo"
                value={hab?.tabaquismo ? `Sí${hab.tabaquismoCuantos ? ` — ${hab.tabaquismoCuantos} cig/día` : ''}` : 'No'}
                style={s.col3}
              />
              <PDFField
                label="Alcohol"
                value={hab?.alcohol ? `Sí${hab.alcoholFrecuencia ? ` — ${hab.alcoholFrecuencia}` : ''}` : 'No'}
                style={s.col3}
              />
              <PDFField
                label="Actividad física"
                value={hab?.actividadFisica ? `Sí${hab.actividadFisicaTipo ? ` — ${hab.actividadFisicaTipo}` : ''}` : 'No'}
                style={s.col3}
              />
            </View>
          </View>

          {/* Score Framingham */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Score de Riesgo Cardiovascular (Framingham 1998)</Text>
            <View style={extra.scoreBox}>
              <View>
                <Text style={extra.bigNumber}>{framingham.porcentaje}%</Text>
                <Text style={extra.bigLabel}>Riesgo a 10 años</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={riskStyle[framingham.riesgo] ?? extra.riskBajo}>
                  {framingham.riesgo.toUpperCase()}
                </Text>
                <Text style={[extra.bigLabel, { marginTop: 6 }]}>
                  Puntuación: {framingham.score} pts
                </Text>
                <Text style={extra.bigLabel}>
                  {'<10% Bajo · 10-20% Moderado · >20% Alto'}
                </Text>
              </View>
            </View>
          </View>

          {/* Diagnóstico y Plan */}
          {d.diagnostico && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Diagnóstico</Text>
              <Text style={s.textBlock}>{d.diagnostico}</Text>
            </View>
          )}
          {d.plan && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Plan de Manejo</Text>
              <Text style={s.textBlock}>{d.plan}</Text>
            </View>
          )}

          {/* Firma */}
          <View style={s.signatureBlock}>
            <View style={s.signatureBox}>
              <View style={s.signatureLine} />
              <Text style={s.signatureName}>{record.user.name}</Text>
              <Text style={s.signatureRole}>Médico tratante</Text>
              <Text style={s.signatureRole}>Reg. Médico: — — —</Text>
            </View>
          </View>
        </View>

        <PDFFooter />
      </Page>
    </Document>
  )
}
