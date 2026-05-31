'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Receipt, TrendingUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { FacturasTable } from '@/components/modules/facturacion/FacturasTable'
import { useDebounce } from '@/hooks/useDebounce'
import { formatCurrency } from '@/lib/utils'

interface Stats {
  pendingCount: number
  paidToday: number
  monthTotal: number
}

export default function FacturacionPage() {
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState<Stats>({ pendingCount: 0, paidToday: 0, monthTotal: 0 })
  const search = useDebounce(searchInput, 300)

  const handleStatsUpdate = useCallback((newStats: Stats) => {
    setStats(newStats)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-content">Facturación</h1>
          <p className="text-sm text-content-muted mt-1">Gestión de facturas y pagos</p>
        </div>
        <Link href="/facturacion/nueva">
          <Button>
            <Plus className="w-4 h-4" />
            Nueva Factura
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-content-muted uppercase font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-content">{stats.pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-content-muted uppercase font-medium">Pagado hoy</p>
              <p className="text-xl font-bold text-content">{formatCurrency(stats.paidToday)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-content-muted uppercase font-medium">Total del mes</p>
              <p className="text-xl font-bold text-content">{formatCurrency(stats.monthTotal)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
            <Input
              className="pl-9"
              placeholder="Buscar por paciente o número..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        <div className="w-40">
          <Select value={status} onValueChange={(v) => { setStatus(v === '_all' ? '' : v); setPage(1) }}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              <SelectItem value="PAGADO">Pagado</SelectItem>
              <SelectItem value="ANULADO">Anulado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs text-content-muted whitespace-nowrap">Desde</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="w-36"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs text-content-muted whitespace-nowrap">Hasta</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="w-36"
          />
        </div>
      </div>

      <FacturasTable
        search={search}
        status={status}
        dateFrom={dateFrom}
        dateTo={dateTo}
        page={page}
        onPageChange={setPage}
        onStatsUpdate={handleStatsUpdate}
      />
    </div>
  )
}
