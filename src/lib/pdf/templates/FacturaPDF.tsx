import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  C,
} from '@/lib/pdf/base'
import { PDFHeader, PDFFooter } from '@/lib/pdf/base'
import type { Invoice, Patient, InvoiceItem } from '@/types'

const S = StyleSheet.create({
  body: { paddingHorizontal: 32 },
  numberBox: {
    backgroundColor: C.bg,
    borderLeft: `4px solid ${C.brand}`,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberLabel: { fontSize: 8, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  numberValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.brandDk },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  patientBox: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottom: `1px solid ${C.border}`,
    paddingBottom: 12,
  },
  patientCol: { flex: 1 },
  fieldLabel: { fontSize: 7, color: C.muted, textTransform: 'uppercase' as const, marginBottom: 1 },
  fieldValue: { fontSize: 9, color: C.text },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.brand,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: `1px solid ${C.border}`,
  },
  tableRowAlt: { backgroundColor: C.bg },
  thCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white },
  tdCell: { fontSize: 8, color: C.text },
  col5: { width: '5%' },
  colDesc: { flex: 1 },
  colQty: { width: '10%', textAlign: 'right' as const },
  colPrice: { width: '15%', textAlign: 'right' as const },
  colTax: { width: '10%', textAlign: 'center' as const },
  colSubtotal: { width: '18%', textAlign: 'right' as const },
  totalsBox: {
    marginTop: 12,
    alignSelf: 'flex-end',
    width: 240,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottom: `1px solid ${C.border}`,
  },
  totalsLabel: { fontSize: 9, color: C.muted },
  totalsValue: { fontSize: 9, color: C.text },
  totalsFinal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  totalsFinalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.brandDk },
  totalsFinalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.brandDk },
  notesBox: {
    marginTop: 16,
    backgroundColor: C.bg,
    padding: 8,
    borderRadius: 4,
  },
  notesLabel: { fontSize: 7, color: C.muted, textTransform: 'uppercase' as const, marginBottom: 3 },
  notesText: { fontSize: 9, color: C.text, lineHeight: 1.4 },
})

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

function statusStyle(status: string) {
  if (status === 'PAGADO') return { ...S.statusBadge, backgroundColor: '#DCFCE7', color: '#166534' }
  if (status === 'ANULADO') return { ...S.statusBadge, backgroundColor: '#F3F4F6', color: '#6B7280' }
  return { ...S.statusBadge, backgroundColor: '#FEF9C3', color: '#854D0E' }
}

function statusLabel(status: string) {
  if (status === 'PAGADO') return 'PAGADO'
  if (status === 'ANULADO') return 'ANULADO'
  return 'PENDIENTE'
}

interface FacturaPDFProps {
  invoice: Invoice & {
    patient: Patient
    items: InvoiceItem[]
    user?: { name: string }
  }
}

export function FacturaPDF({ invoice }: FacturaPDFProps) {
  const patientName = `${invoice.patient.firstName} ${invoice.patient.lastName}`

  return (
    <Document>
      <Page size="A4" style={{ fontFamily: 'Helvetica', fontSize: 9, color: C.text, paddingBottom: 50 }}>
        <PDFHeader documentType="FACTURA" date={fmtDate(invoice.createdAt)} />

        <View style={S.body}>
          {/* Number + status */}
          <View style={S.numberBox}>
            <View>
              <Text style={S.numberLabel}>Número de factura</Text>
              <Text style={S.numberValue}>{invoice.number}</Text>
            </View>
            <Text style={statusStyle(invoice.status)}>{statusLabel(invoice.status)}</Text>
          </View>

          {/* Patient info */}
          <View style={S.patientBox}>
            <View style={S.patientCol}>
              <Text style={S.fieldLabel}>Paciente</Text>
              <Text style={{ ...S.fieldValue, fontFamily: 'Helvetica-Bold' }}>{patientName}</Text>
              <Text style={S.fieldValue}>{invoice.patient.documentType}: {invoice.patient.documentNumber}</Text>
            </View>
            <View style={S.patientCol}>
              <Text style={S.fieldLabel}>Fecha de emisión</Text>
              <Text style={S.fieldValue}>{fmtDate(invoice.createdAt)}</Text>
              {invoice.paidAt && (
                <>
                  <Text style={{ ...S.fieldLabel, marginTop: 4 }}>Fecha de pago</Text>
                  <Text style={S.fieldValue}>{fmtDate(invoice.paidAt)}</Text>
                </>
              )}
            </View>
            <View style={S.patientCol}>
              {invoice.paymentMethod && (
                <>
                  <Text style={S.fieldLabel}>Método de pago</Text>
                  <Text style={S.fieldValue}>{invoice.paymentMethod}</Text>
                </>
              )}
              {invoice.user && (
                <>
                  <Text style={{ ...S.fieldLabel, marginTop: 4 }}>Emitido por</Text>
                  <Text style={S.fieldValue}>{invoice.user.name}</Text>
                </>
              )}
            </View>
          </View>

          {/* Items table */}
          <View style={S.tableHeader}>
            <Text style={{ ...S.thCell, ...S.col5 }}>#</Text>
            <Text style={{ ...S.thCell, ...S.colDesc }}>Descripción</Text>
            <Text style={{ ...S.thCell, ...S.colQty }}>Cant.</Text>
            <Text style={{ ...S.thCell, ...S.colPrice }}>P. Unit.</Text>
            <Text style={{ ...S.thCell, ...S.colTax }}>IVA</Text>
            <Text style={{ ...S.thCell, ...S.colSubtotal }}>Subtotal</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View key={item.id} style={i % 2 === 1 ? { ...S.tableRow, ...S.tableRowAlt } : S.tableRow}>
              <Text style={{ ...S.tdCell, ...S.col5 }}>{i + 1}</Text>
              <Text style={{ ...S.tdCell, ...S.colDesc }}>{item.description}</Text>
              <Text style={{ ...S.tdCell, ...S.colQty }}>{Number(item.quantity)}</Text>
              <Text style={{ ...S.tdCell, ...S.colPrice }}>{fmtCurrency(Number(item.unitPrice))}</Text>
              <Text style={{ ...S.tdCell, ...S.colTax }}>{Number(item.taxRate)}%</Text>
              <Text style={{ ...S.tdCell, ...S.colSubtotal }}>{fmtCurrency(Number(item.subtotal))}</Text>
            </View>
          ))}

          {/* Totals */}
          <View style={S.totalsBox}>
            <View style={S.totalsRow}>
              <Text style={S.totalsLabel}>Subtotal</Text>
              <Text style={S.totalsValue}>{fmtCurrency(Number(invoice.subtotal))}</Text>
            </View>
            {Number(invoice.discount) > 0 && (
              <View style={S.totalsRow}>
                <Text style={S.totalsLabel}>
                  Descuento {invoice.discountType === 'PORCENTAJE' ? `(${Number(invoice.discount)}%)` : ''}
                </Text>
                <Text style={{ ...S.totalsValue, color: '#DC2626' }}>- {fmtCurrency(Number(invoice.discount))}</Text>
              </View>
            )}
            {Number(invoice.taxAmount) > 0 && (
              <View style={S.totalsRow}>
                <Text style={S.totalsLabel}>IVA</Text>
                <Text style={S.totalsValue}>{fmtCurrency(Number(invoice.taxAmount))}</Text>
              </View>
            )}
            <View style={S.totalsFinal}>
              <Text style={S.totalsFinalLabel}>TOTAL</Text>
              <Text style={S.totalsFinalValue}>{fmtCurrency(Number(invoice.total))}</Text>
            </View>
          </View>

          {/* Notes */}
          {invoice.notes && (
            <View style={S.notesBox}>
              <Text style={S.notesLabel}>Notas</Text>
              <Text style={S.notesText}>{invoice.notes}</Text>
            </View>
          )}

          {/* Cancel reason */}
          {invoice.cancelReason && (
            <View style={{ ...S.notesBox, backgroundColor: '#FEE2E2', marginTop: 8 }}>
              <Text style={{ ...S.notesLabel, color: '#DC2626' }}>Motivo de anulación</Text>
              <Text style={{ ...S.notesText, color: '#991B1B' }}>{invoice.cancelReason}</Text>
            </View>
          )}
        </View>

        <PDFFooter text="MEDI ONE — Documento tributario" />
      </Page>
    </Document>
  )
}
