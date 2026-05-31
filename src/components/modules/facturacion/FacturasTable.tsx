'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Eye, FileText } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice, InvoiceStatus } from '@/types'

interface InvoiceRow extends Invoice {
  patient: { firstName: string; lastName: string; documentNumber: string }
  _count: { items: number }
}

interface Props {
  search: string
  status: string
  dateFrom: string
  dateTo: string
  page: number
  onPageChange: (p: number) => void
  onStatsUpdate?: (stats: { pendingCount: number; paidToday: number; monthTotal: number }) => void
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === 'PAGADO') return <Badge variant="success">Pagado</Badge>
  if (status === 'ANULADO') return <Badge variant="outline" className="text-content-muted line-through">Anulado</Badge>
  return <Badge variant="warning">Pendiente</Badge>
}

export function FacturasTable({ search, status, dateFrom, dateTo, page, onPageChange, onStatsUpdate }: Props) {
  const [data, setData] = useState<InvoiceRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: '20',
      ...(search && { search }),
      ...(status && { status }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    })

    try {
      const res = await fetch(`/api/facturas?${params}`)
      const json = await res.json()
      setData(json.data ?? [])
      setTotal(json.total ?? 0)
      setTotalPages(json.totalPages ?? 1)
      if (onStatsUpdate && json.stats) onStatsUpdate(json.stats)
    } finally {
      setLoading(false)
    }
  }, [search, status, dateFrom, dateTo, page, onStatsUpdate])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-content-muted">
        <FileText className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No hay facturas registradas</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Ítems</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((inv) => (
              <TableRow key={inv.id} className={inv.status === 'ANULADO' ? 'opacity-60' : ''}>
                <TableCell className="font-mono text-xs font-medium text-brand">{inv.number}</TableCell>
                <TableCell>
                  <div className="font-medium text-content">
                    {inv.patient.firstName} {inv.patient.lastName}
                  </div>
                  <div className="text-xs text-content-muted">{inv.patient.documentNumber}</div>
                </TableCell>
                <TableCell className="text-sm text-content-muted">
                  {formatDate(inv.createdAt, 'd MMM yyyy')}
                </TableCell>
                <TableCell className="text-sm text-center">{inv._count.items}</TableCell>
                <TableCell className="text-right font-medium">
                  <span className={inv.status === 'ANULADO' ? 'line-through text-content-muted' : ''}>
                    {formatCurrency(Number(inv.total))}
                  </span>
                </TableCell>
                <TableCell><StatusBadge status={inv.status} /></TableCell>
                <TableCell>
                  <Link href={`/facturacion/${inv.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-content-muted">
          <span>Total: {total} facturas</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              Anterior
            </Button>
            <span className="px-3 py-1 text-content">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function FacturasTableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
    </div>
  )
}
