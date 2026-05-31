import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  C,
} from '@/lib/pdf/base'
import { PDFHeader, PDFFooter } from '@/lib/pdf/base'
import type { Invoice, Patient } from '@/types'

const S = StyleSheet.create({
  body: { paddingHorizontal: 32, paddingTop: 8 },
  stamp: {
    position: 'absolute',
    top: 160,
    right: 60,
    width: 100,
    height: 100,
    borderRadius: 50,
    border: `3px solid #16A34A`,
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(-20deg)',
  },
  stampText: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#16A34A',
    textAlign: 'center' as const,
  },
  titleBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: C.brandDk,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 9,
    color: C.muted,
    marginTop: 2,
  },
  divider: {
    borderBottom: `2px solid ${C.brand}`,
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  infoBlock: {
    width: '45%',
    backgroundColor: C.bg,
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  infoLabel: { fontSize: 7, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 10, color: C.text, fontFamily: 'Helvetica-Bold' },
  amountBox: {
    backgroundColor: C.brand,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: { fontSize: 9, color: '#F5D5D0', marginBottom: 4 },
  amountValue: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.white },
})

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

const paymentLabels: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia Bancaria',
  TARJETA: 'Tarjeta',
}

interface ReciboPDFProps {
  invoice: Invoice & { patient: Patient }
}

export function ReciboPDF({ invoice }: ReciboPDFProps) {
  const patientName = `${invoice.patient.firstName} ${invoice.patient.lastName}`

  return (
    <Document>
      <Page size="A4" style={{ fontFamily: 'Helvetica', fontSize: 9, color: C.text, paddingBottom: 50 }}>
        <PDFHeader documentType="RECIBO DE PAGO" date={fmtDate(invoice.paidAt ?? invoice.createdAt)} />

        <View style={S.body}>
          <View style={S.titleBox}>
            <Text style={S.title}>RECIBO DE PAGO</Text>
            <Text style={S.subtitle}>Comprobante de pago — {invoice.number}</Text>
          </View>

          <View style={S.divider} />

          {/* Stamp */}
          <View style={S.stamp}>
            <Text style={S.stampText}>PAGADO</Text>
          </View>

          {/* Info grid */}
          <View style={S.infoGrid}>
            <View style={S.infoBlock}>
              <Text style={S.infoLabel}>Paciente</Text>
              <Text style={S.infoValue}>{patientName}</Text>
            </View>
            <View style={S.infoBlock}>
              <Text style={S.infoLabel}>Documento</Text>
              <Text style={S.infoValue}>{invoice.patient.documentType} {invoice.patient.documentNumber}</Text>
            </View>
            <View style={S.infoBlock}>
              <Text style={S.infoLabel}>Número de factura</Text>
              <Text style={S.infoValue}>{invoice.number}</Text>
            </View>
            <View style={S.infoBlock}>
              <Text style={S.infoLabel}>Fecha de pago</Text>
              <Text style={S.infoValue}>{fmtDate(invoice.paidAt)}</Text>
            </View>
            <View style={S.infoBlock}>
              <Text style={S.infoLabel}>Método de pago</Text>
              <Text style={S.infoValue}>{invoice.paymentMethod ? paymentLabels[invoice.paymentMethod] : '—'}</Text>
            </View>
          </View>

          {/* Amount */}
          <View style={S.amountBox}>
            <Text style={S.amountLabel}>TOTAL PAGADO</Text>
            <Text style={S.amountValue}>{fmtCurrency(Number(invoice.total))}</Text>
          </View>
        </View>

        <PDFFooter text="Este documento sirve como comprobante de pago — MEDI ONE" />
      </Page>
    </Document>
  )
}
