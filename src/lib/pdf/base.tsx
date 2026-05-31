import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// Color palette
const C = {
  brand:   '#C8857A',
  brandDk: '#9B5E58',
  bg:      '#F8F4F3',
  text:    '#3D1F1C',
  muted:   '#7A5A58',
  border:  '#E8D5D3',
  white:   '#FFFFFF',
}

export const baseStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  // Header strip
  header: {
    backgroundColor: C.brand,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  headerClinic: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    letterSpacing: 2,
  },
  headerDoctor: {
    fontSize: 10,
    color: C.white,
    marginTop: 2,
  },
  headerSpecialties: {
    fontSize: 8,
    color: '#F5D5D0',
    marginTop: 2,
  },
  headerRight: {
    position: 'absolute',
    right: 32,
    top: 16,
    alignItems: 'flex-end',
  },
  headerRightText: {
    fontSize: 8,
    color: '#F5D5D0',
  },
  // Body
  body: {
    paddingHorizontal: 32,
  },
  // Title bar
  titleBar: {
    backgroundColor: C.bg,
    borderLeft: `4px solid ${C.brand}`,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  titleBarText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: C.brandDk,
  },
  // Sections
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    borderBottom: `1px solid ${C.border}`,
    paddingBottom: 3,
    marginBottom: 8,
  },
  // Grid rows
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  col2: {
    width: '50%',
  },
  col3: {
    width: '33.33%',
  },
  col4: {
    width: '25%',
  },
  // Field
  fieldLabel: {
    fontSize: 7,
    color: C.muted,
    marginBottom: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 9,
    color: C.text,
    borderBottom: `1px solid ${C.border}`,
    paddingBottom: 2,
    minHeight: 14,
  },
  // Text block
  textBlock: {
    fontSize: 9,
    color: C.text,
    backgroundColor: C.bg,
    padding: 8,
    borderRadius: 4,
    lineHeight: 1.5,
    minHeight: 24,
  },
  // Table
  table: {
    width: '100%',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.brand,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: `1px solid ${C.border}`,
  },
  tableRowAlt: {
    backgroundColor: C.bg,
  },
  tableCell: {
    fontSize: 8,
    color: C.text,
    flex: 1,
  },
  // Signature block
  signatureBlock: {
    marginTop: 32,
    borderTop: `1px solid ${C.border}`,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureBox: {
    width: 200,
    alignItems: 'center',
  },
  signatureLine: {
    borderBottom: `1px solid ${C.text}`,
    width: 180,
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.text,
  },
  signatureRole: {
    fontSize: 8,
    color: C.muted,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: `1px solid ${C.border}`,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: C.muted,
  },
  // Badge aptitud
  badgeApto: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  badgeRestriccion: {
    backgroundColor: '#FEF9C3',
    color: '#854D0E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  badgeNoApto: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
})

interface HeaderProps {
  documentType: string
  date: string
  pageNumber?: string
}

export function PDFHeader({ documentType, date, pageNumber }: HeaderProps) {
  return (
    <View style={baseStyles.header} fixed>
      <Text style={baseStyles.headerClinic}>MEDI ONE</Text>
      <Text style={baseStyles.headerDoctor}>Dra. Alejandra Bárcenas</Text>
      <Text style={baseStyles.headerSpecialties}>
        Medicina Laboral | Medicina Estética | Riesgo Cardiovascular
      </Text>
      <View style={baseStyles.headerRight}>
        <Text style={baseStyles.headerRightText}>{documentType}</Text>
        <Text style={baseStyles.headerRightText}>{date}</Text>
        {pageNumber && (
          <Text style={baseStyles.headerRightText}>Pág. {pageNumber}</Text>
        )}
      </View>
    </View>
  )
}

export function PDFFooter({ text }: { text?: string }) {
  return (
    <View style={baseStyles.footer} fixed>
      <Text style={baseStyles.footerText}>
        {text ?? 'Documento generado por MEDI ONE — Confidencial'}
      </Text>
      <Text
        style={baseStyles.footerText}
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  )
}

interface FieldProps {
  label: string
  value?: string | number | null
  style?: object
}

export function PDFField({ label, value, style }: FieldProps) {
  return (
    <View style={style}>
      <Text style={baseStyles.fieldLabel}>{label}</Text>
      <Text style={baseStyles.fieldValue}>{value ?? '—'}</Text>
    </View>
  )
}

export { Document, Page, Text, View, StyleSheet, C }
