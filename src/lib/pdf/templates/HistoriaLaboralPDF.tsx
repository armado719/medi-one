import { Document, Page, Text, View } from '@react-pdf/renderer'
import {
  baseStyles as s,
  PDFHeader,
  PDFFooter,
  PDFField,
} from '@/lib/pdf/base'
import { formatDate } from '@/lib/utils'
import type { HistoriaLaboralData } from '@/types'

interface Props {
  record: {
    id: string
    createdAt: string | Date
    data: HistoriaLaboralData
    patient: {
      firstName: string
      lastName: string
      documentType: string
      documentNumber: string
      birthDate: string | Date
      sex: string
      phone: string
      eps?: string | null
    }
    user: { name: string }
  }
}

const aptitudStyle: Record<string, import('@react-pdf/types').Style> = {
  'Apto': s.badgeApto,
  'Apto con restricciones': s.badgeRestriccion,
  'No apto': s.badgeNoApto,
}

export function HistoriaLaboralPDF({ record }: Props) {
  const d = record.data
  const ef = d.examenFisico
  const fecha = formatDate(new Date(record.createdAt))
  const paciente = `${record.patient.firstName} ${record.patient.lastName}`
  const doc = `${record.patient.documentType}: ${record.patient.documentNumber}`

  const riesgosActivos = Object.entries(d.riesgos ?? {})
    .filter(([, v]) => (v as { activo?: boolean }).activo)
    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))

  const aptitud = d.conclusion?.aptitud ?? 'Apto'

  return (
    <Document
      title={`Historia Laboral — ${paciente}`}
      author="MEDI ONE"
      subject="Historia Médica Laboral"
    >
      <Page size="A4" style={s.page}>
        <PDFHeader documentType="HISTORIA MÉDICA LABORAL" date={fecha} />

        <View style={s.body}>
          {/* Datos del paciente */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Datos del Paciente</Text>
            <View style={s.row}>
              <PDFField label="Nombre completo" value={paciente} style={s.col2} />
              <PDFField label="Documento" value={doc} style={s.col2} />
            </View>
            <View style={s.row}>
              <PDFField
                label="Fecha de nacimiento"
                value={formatDate(new Date(record.patient.birthDate))}
                style={s.col3}
              />
              <PDFField label="Sexo" value={record.patient.sex} style={s.col3} />
              <PDFField label="EPS" value={record.patient.eps ?? undefined} style={s.col3} />
            </View>
          </View>

          {/* Datos laborales */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Datos Laborales</Text>
            <View style={s.row}>
              <PDFField label="Empresa" value={d.empresa} style={s.col2} />
              <PDFField label="NIT" value={d.nit} style={s.col2} />
            </View>
            <View style={s.row}>
              <PDFField label="Cargo" value={d.cargo} style={s.col3} />
              <PDFField label="Área" value={d.area} style={s.col3} />
              <PDFField label="Tipo de examen" value={d.tipoExamen} style={s.col3} />
            </View>
          </View>

          {/* Riesgos */}
          {riesgosActivos.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Riesgos Ocupacionales</Text>
              <Text style={s.textBlock}>
                {riesgosActivos.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(' · ')}
              </Text>
            </View>
          )}

          {/* Antecedentes */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Antecedentes</Text>
            {d.antecedentesPer?.patologicos && (
              <>
                <Text style={[s.fieldLabel, { marginBottom: 3 }]}>Patológicos</Text>
                <Text style={s.textBlock}>{d.antecedentesPer.patologicos}</Text>
              </>
            )}
            {d.antecedentesPer?.quirurgicos && (
              <>
                <Text style={[s.fieldLabel, { marginTop: 6, marginBottom: 3 }]}>Quirúrgicos</Text>
                <Text style={s.textBlock}>{d.antecedentesPer.quirurgicos}</Text>
              </>
            )}
            {d.antecedentesFam && (
              <>
                <Text style={[s.fieldLabel, { marginTop: 6, marginBottom: 3 }]}>Familiares</Text>
                <Text style={s.textBlock}>{d.antecedentesFam}</Text>
              </>
            )}
          </View>

          {/* Examen físico */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Examen Físico — Signos Vitales</Text>
            <View style={s.row}>
              <PDFField label="TA (mmHg)" value={ef?.ta} style={s.col4} />
              <PDFField label="FC (lpm)" value={ef?.fc?.toString()} style={s.col4} />
              <PDFField label="Peso (kg)" value={ef?.peso?.toString()} style={s.col4} />
              <PDFField label="Talla (cm)" value={ef?.talla?.toString()} style={s.col4} />
            </View>
          </View>

          {/* Paraclínicos */}
          {Array.isArray(d.paraclínicos) && d.paraclínicos.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Paraclínicos</Text>
              <View style={s.table}>
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, { flex: 2 }]}>Examen</Text>
                  <Text style={s.tableHeaderCell}>Resultado</Text>
                  <Text style={s.tableHeaderCell}>Referencia</Text>
                  <Text style={s.tableHeaderCell}>Anormal</Text>
                </View>
                {d.paraclínicos.map((p, i) => (
                  <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                    <Text style={[s.tableCell, { flex: 2 }]}>{p.nombre}</Text>
                    <Text style={s.tableCell}>{p.resultado}</Text>
                    <Text style={s.tableCell}>{p.valorReferencia}</Text>
                    <Text style={s.tableCell}>{p.anormal ? 'Sí' : 'No'}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Diagnóstico */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Diagnóstico</Text>
            <View style={s.row}>
              <PDFField label="Código CIE-10" value={d.diagnostico?.cie10} style={{ width: 120 }} />
              <PDFField
                label="Descripción"
                value={d.diagnostico?.descripcion}
                style={{ flex: 1, marginLeft: 12 }}
              />
            </View>
          </View>

          {/* Conclusión de aptitud */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Conclusión de Aptitud</Text>
            <View style={[s.row, { alignItems: 'center', marginBottom: 8 }]}>
              <Text style={[s.fieldLabel, { marginRight: 8, marginBottom: 0 }]}>
                Concepto médico:
              </Text>
              <Text style={aptitudStyle[aptitud] ?? s.badgeApto}>
                {aptitud.toUpperCase()}
              </Text>
            </View>
            {d.conclusion?.restricciones && (
              <>
                <Text style={[s.fieldLabel, { marginBottom: 3 }]}>Restricciones</Text>
                <Text style={s.textBlock}>{d.conclusion.restricciones}</Text>
              </>
            )}
            {d.conclusion?.recomendaciones && (
              <>
                <Text style={[s.fieldLabel, { marginTop: 6, marginBottom: 3 }]}>Recomendaciones</Text>
                <Text style={s.textBlock}>{d.conclusion.recomendaciones}</Text>
              </>
            )}
          </View>

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
