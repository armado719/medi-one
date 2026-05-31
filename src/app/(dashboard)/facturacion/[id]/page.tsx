'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Download, Printer, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import type { Invoice, InvoiceStatus, PaymentMethod } from '@/types'

interface InvoiceDetail extends Invoice {
  patient: {
    firstName: string
    lastName: string
    documentType: string
    documentNumber: string
    phone: string
    email?: string | null
  }
  user: { name: string }
  items: Invoice['items']
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const sizeClass = 'px-4 py-1.5 text-sm font-semibold rounded-full'
  if (status === 'PAGADO') return <span className={`${sizeClass} bg-green-100 text-green-700`}>PAGADO</span>
  if (status === 'ANULADO') return <span className={`${sizeClass} bg-gray-100 text-gray-600`}>ANULADO</span>
  return <span className={`${sizeClass} bg-yellow-100 text-yellow-700`}>PENDIENTE</span>
}

export default function FacturaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const router = useRouter()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPayDialog, setShowPayDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/facturas/${id}`)
      .then((r) => r.json())
      .then(setInvoice)
      .finally(() => setLoading(false))
  }, [id])

  const handleMarkPaid = async () => {
    if (!paymentMethod) { toast.error('Seleccione un método de pago'); return }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/facturas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'marcar_pagado', paymentMethod }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const updated = await res.json()
      setInvoice((prev) => prev ? { ...prev, ...updated } : prev)
      toast.success('Factura marcada como pagada')
      setShowPayDialog(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelReason || cancelReason.length < 5) {
      toast.error('La razón debe tener al menos 5 caracteres')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/facturas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'anular', cancelReason }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const updated = await res.json()
      setInvoice((prev) => prev ? { ...prev, ...updated } : prev)
      toast.success('Factura anulada')
      setShowCancelDialog(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al anular')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownload = async (type: 'factura' | 'recibo') => {
    const url = type === 'recibo' ? `/api/pdf/factura/${id}` : `/api/pdf/factura/${id}`
    const res = await fetch(url)
    if (!res.ok) { toast.error('Error al generar PDF'); return }
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `factura-${invoice?.number ?? id}.pdf`
    a.click()
    URL.revokeObjectURL(blobUrl)
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl">
        <p className="text-content-muted">Factura no encontrada.</p>
        <Link href="/facturacion"><Button variant="outline" className="mt-4">Volver</Button></Link>
      </div>
    )
  }

  const isAdmin = session?.user?.role === 'ADMINISTRADOR'

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/facturacion" className="flex items-center gap-1 text-sm text-content-muted hover:text-content">
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-content">{invoice.number}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-content-muted mt-0.5">
              Creada el {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleDownload('factura')}>
            <Download className="w-4 h-4" />
            Descargar PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Patient + metadata */}
      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-content-muted uppercase font-medium mb-1">Paciente</p>
            <p className="font-semibold text-content">{invoice.patient.firstName} {invoice.patient.lastName}</p>
            <p className="text-sm text-content-muted">{invoice.patient.documentType}: {invoice.patient.documentNumber}</p>
            {invoice.patient.phone && <p className="text-sm text-content-muted">{invoice.patient.phone}</p>}
          </div>
          <div>
            <p className="text-xs text-content-muted uppercase font-medium mb-1">Emitido por</p>
            <p className="text-sm text-content">{invoice.user.name}</p>
            {invoice.paymentMethod && (
              <>
                <p className="text-xs text-content-muted uppercase font-medium mb-1 mt-3">Método de pago</p>
                <p className="text-sm text-content">{invoice.paymentMethod}</p>
              </>
            )}
          </div>
          <div>
            {invoice.paidAt && (
              <>
                <p className="text-xs text-content-muted uppercase font-medium mb-1">Fecha de pago</p>
                <p className="text-sm text-content">{formatDate(invoice.paidAt)}</p>
              </>
            )}
            {invoice.notes && (
              <>
                <p className="text-xs text-content-muted uppercase font-medium mb-1 mt-3">Notas</p>
                <p className="text-sm text-content">{invoice.notes}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel reason */}
      {invoice.cancelReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-700 mb-1">Motivo de anulación</p>
          <p className="text-sm text-red-600">{invoice.cancelReason}</p>
        </div>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Ítems</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-center">IVA</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.items ?? []).map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell className="text-content-muted">{i + 1}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(item.unitPrice))}</TableCell>
                  <TableCell className="text-center">{Number(item.taxRate)}%</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(Number(item.subtotal))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-content-muted">Subtotal</span>
                <span>{formatCurrency(Number(invoice.subtotal))}</span>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-content-muted">Descuento</span>
                  <span className="text-red-600">- {formatCurrency(Number(invoice.discount))}</span>
                </div>
              )}
              {Number(invoice.taxAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-content-muted">IVA</span>
                  <span>{formatCurrency(Number(invoice.taxAmount))}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-display text-lg font-bold text-content">Total</span>
                <span className="font-display text-2xl font-bold text-brand">{formatCurrency(Number(invoice.total))}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {invoice.status === 'PENDIENTE' && (
        <div className="flex gap-3 justify-end">
          <Button onClick={() => setShowPayDialog(true)}>
            <CheckCircle className="w-4 h-4" />
            Marcar como pagado
          </Button>
          {isAdmin && (
            <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
              <XCircle className="w-4 h-4" />
              Anular factura
            </Button>
          )}
        </div>
      )}

      {/* Pay dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar factura como pagada</DialogTitle>
            <DialogDescription>
              La factura {invoice.number} será marcada como PAGADO y se registrará un ingreso contable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Método de pago *</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferencia Bancaria</SelectItem>
                <SelectItem value="TARJETA">Tarjeta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>Cancelar</Button>
            <Button onClick={handleMarkPaid} disabled={actionLoading}>
              {actionLoading ? 'Procesando...' : 'Confirmar pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular factura</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La factura {invoice.number} quedará como ANULADA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Motivo de anulación *</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ingrese el motivo de la anulación (mínimo 5 caracteres)..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
              {actionLoading ? 'Anulando...' : 'Confirmar anulación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
