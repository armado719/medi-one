import { Document, Page, Text, View } from '@react-pdf/renderer'
import {
  baseStyles as s,
  PDFHeader,
  PDFFooter,
  PDFField,
} from '@/lib/pdf/base'
import { formatDate } from '@/lib/utils'
import type { HistoriaEsteticaData } from '@/types'

interface Props {
  record: {
    id: string
    createdAt: string | Date
    data: HistoriaEsteticaData
    patient: {
      firstName: string
      lastName: string
      documentType: string
      documentNumber: string
      phone: string
    }
    user: { name: string }
  }
}

export function HistoriaEsteticaPDF({ record }: Props) {
  const d = record.data
  const fecha = formatDate(new Date(record.createdAt))
  const paciente = `${record.patient.firstName} ${record.patient.lastName}`

  const zt = d.zonasTratar ?? {}
  const zonasActivas = Object.entries(zt)
    .filter(([k, v]) => k !== 'descripcion' && v === true)
    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))

  return (
    <Document
      title={`Historia Estética — ${paciente}`}
      author="MEDI ONE"
      subject="Historia Médica Estética"
    >
      <Page size="A4" style={s.page}>
        <PDFHeader documentType="HISTORIA MÉDICA ESTÉTICA" date={fecha} />

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
              <PDFField label="Teléfono" value={record.patient.phone} style={s.col2} />
            </View>
          </View>

          {/* Motivo */}
          {d.motivoConsulta && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Motivo de Consulta</Text>
              <Text style={s.textBlock}>{d.motivoConsulta}</Text>
            </View>
          )}

          {/* Antecedentes */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Antecedentes Relevantes</Text>
            <View style={s.row}>
              <View style={s.col2}>
                <Text style={s.fieldLabel}>Alergias</Text>
                <Text style={s.textBlock}>{d.antecedentes?.alergias || '—'}</Text>
              </View>
              <View style={[s.col2, { paddingLeft: 8 }]}>
                <Text style={s.fieldLabel}>Medicamentos actuales</Text>
                <Text style={s.textBlock}>{d.antecedentes?.medicamentosActuales || '—'}</Text>
              </View>
            </View>
            <View style={[s.row, { marginTop: 6 }]}>
              <View style={s.col2}>
                <Text style={s.fieldLabel}>Cirugías previas</Text>
                <Text style={s.textBlock}>{d.antecedentes?.cirugiasPrevias || '—'}</Text>
              </View>
              <View style={[s.col2, { paddingLeft: 8 }]}>
                <Text style={s.fieldLabel}>Enfermedades crónicas</Text>
                <Text style={s.textBlock}>{d.antecedentes?.enfermedadesCronicas || '—'}</Text>
              </View>
            </View>
          </View>

          {/* Zonas y procedimiento */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Procedimiento</Text>
            <View style={s.row}>
              <PDFField label="Procedimiento" value={d.procedimiento?.nombre} style={s.col2} />
              <PDFField label="Técnica" value={d.procedimiento?.tecnica} style={s.col2} />
            </View>
            <View style={s.row}>
              <PDFField label="Duración" value={d.procedimiento?.duracion ? `${d.procedimiento.duracion} min` : undefined} style={s.col3} />
              <View style={[s.col2, { paddingLeft: 8 }]}>
                <Text style={s.fieldLabel}>Zonas tratadas</Text>
                <Text style={s.fieldValue}>{zonasActivas.join(' · ') || '—'}</Text>
              </View>
            </View>
            {d.zonasTratar?.descripcion && (
              <>
                <Text style={[s.fieldLabel, { marginTop: 6, marginBottom: 3 }]}>
                  Descripción de zonas
                </Text>
                <Text style={s.textBlock}>{d.zonasTratar.descripcion}</Text>
              </>
            )}
          </View>

          {/* Materiales */}
          {Array.isArray(d.materialesUsados) && d.materialesUsados.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Materiales e Insumos Utilizados</Text>
              <View style={s.table}>
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, { flex: 2 }]}>Producto</Text>
                  <Text style={s.tableHeaderCell}>Marca</Text>
                  <Text style={s.tableHeaderCell}>Lote</Text>
                  <Text style={s.tableHeaderCell}>Cantidad</Text>
                </View>
                {d.materialesUsados.map((m, i) => (
                  <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                    <Text style={[s.tableCell, { flex: 2 }]}>{m.producto}</Text>
                    <Text style={s.tableCell}>{m.marca}</Text>
                    <Text style={s.tableCell}>{m.lote}</Text>
                    <Text style={s.tableCell}>{m.cantidad}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Evolución */}
          {d.evolucion?.descripcion && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Evolución y Seguimiento</Text>
              <Text style={s.textBlock}>{d.evolucion.descripcion}</Text>
              {d.evolucion?.proximaCita && (
                <View style={[s.row, { marginTop: 6 }]}>
                  <PDFField
                    label="Próxima cita recomendada"
                    value={d.evolucion.proximaCita}
                    style={{ width: 200 }}
                  />
                </View>
              )}
            </View>
          )}

          {/* Consentimiento */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Consentimiento Informado</Text>
            <View style={s.row}>
              <PDFField
                label="Estado"
                value={d.consentimiento?.estado === 'Firmado' ? 'Firmado ✓' : 'Pendiente'}
                style={s.col2}
              />
            </View>
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
