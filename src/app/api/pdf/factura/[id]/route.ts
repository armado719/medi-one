import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { FacturaPDF } from '@/lib/pdf/templates/FacturaPDF'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      patient: true,
      user: { select: { name: true } },
      items: true,
    },
  })

  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })

  const typedInvoice = {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    discount: Number(invoice.discount),
    taxAmount: Number(invoice.taxAmount),
    total: Number(invoice.total),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    paidAt: invoice.paidAt?.toISOString() ?? null,
    patient: {
      ...invoice.patient,
      birthDate: invoice.patient.birthDate.toISOString(),
      createdAt: invoice.patient.createdAt.toISOString(),
      updatedAt: invoice.patient.updatedAt.toISOString(),
    },
    items: invoice.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate),
      subtotal: Number(item.subtotal),
      createdAt: item.createdAt.toISOString(),
    })),
    user: { name: invoice.user?.name ?? 'Médico' },
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(FacturaPDF, { invoice: typedInvoice as any }) as any)
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factura-${invoice.number}.pdf"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}
