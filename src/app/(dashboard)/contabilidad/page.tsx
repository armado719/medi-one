'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { TrendingUp, TrendingDown, DollarSign, Download, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ContabilidadTable } from '@/components/modules/contabilidad/ContabilidadTable'
import { EgresoModal } from '@/components/modules/contabilidad/EgresoModal'
import { formatCurrency } from '@/lib/utils'
import type { ContabilidadEntry } from '@/components/modules/contabilidad/ContabilidadTable'

const ContabilidadChart = dynamic(
  () =>
    import('@/components/modules/contabilidad/ContabilidadChart').then(
      (m) => m.ContabilidadChart
    ),
  { ssr: false }
)

interface Summary {
  totalIngresos: number
  totalEgresos: number
  utilidadNeta: number
}

type FilterType = 'Todos' | 'INGRESO' | 'EGRESO'
type QuickPeriod = 'hoy' | 'semana' | 'mes' | 'año'

function getDateRange(period: QuickPeriod): { from: string; to: string } {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  if (period === 'hoy') {
    return { from: today, to: today }
  }
  if (period === 'semana') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    return { from: start.toISOString().split('T')[0], to: today }
  }
  if (period === 'mes') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: start.toISOString().split('T')[0], to: today }
  }
  // año
  const start = new Date(now.getFullYear(), 0, 1)
  return { from: start.toISOString().split('T')[0], to: today }
}

export default function ContabilidadPage() {
  const [entries, setEntries] = useState<ContabilidadEntry[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalIngresos: 0,
    totalEgresos: 0,
    utilidadNeta: 0,
  })
  const [loading, setLoading] = useState(true)
  const [egresoOpen, setEgresoOpen] = useState(false)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('Todos')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (filterType !== 'Todos') params.set('type', filterType)

      const res = await fetch(`/api/contabilidad?${params.toString()}`)
      if (!res.ok) throw new Error('Error cargando datos')
      const json = await res.json()
      setEntries(json.entries)
      setSummary(json.summary)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, filterType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleQuickPeriod = (period: QuickPeriod) => {
    const { from, to } = getDateRange(period)
    setDateFrom(from)
    setDateTo(to)
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (filterType !== 'Todos') params.set('type', filterType)
    window.open(`/api/contabilidad/exportar?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-content">Contabilidad</h1>
          <p className="text-content-muted text-sm mt-1">
            Registro de ingresos y egresos del consultorio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={() => setEgresoOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Egreso
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-content-muted">Total Ingresos</p>
                <p className="font-display text-2xl font-semibold text-green-700">
                  {formatCurrency(summary.totalIngresos)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <TrendingDown className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <p className="text-sm text-content-muted">Total Egresos</p>
                <p className="font-display text-2xl font-semibold text-red-700">
                  {formatCurrency(summary.totalEgresos)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand/10 rounded-xl">
                <DollarSign className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-sm text-content-muted">Utilidad Neta</p>
                <p
                  className={`font-display text-2xl font-semibold ${
                    summary.utilidadNeta >= 0 ? 'text-brand' : 'text-red-700'
                  }`}
                >
                  {formatCurrency(summary.utilidadNeta)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Date range */}
            <div className="flex gap-2 items-center">
              <div>
                <label className="text-xs text-content-muted block mb-1">Desde</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-36"
                />
              </div>
              <span className="text-content-muted mt-5">—</span>
              <div>
                <label className="text-xs text-content-muted block mb-1">Hasta</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-36"
                />
              </div>
            </div>

            {/* Type filter */}
            <div>
              <label className="text-xs text-content-muted block mb-1">Tipo</label>
              <div className="flex gap-1">
                {(['Todos', 'INGRESO', 'EGRESO'] as FilterType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filterType === t
                        ? 'bg-brand text-white'
                        : 'bg-bg-surface text-content-muted hover:text-content border border-border'
                    }`}
                  >
                    {t === 'Todos' ? 'Todos' : t === 'INGRESO' ? 'Ingreso' : 'Egreso'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick periods */}
            <div>
              <label className="text-xs text-content-muted block mb-1">Período rápido</label>
              <div className="flex gap-1">
                {(
                  [
                    { key: 'hoy', label: 'Hoy' },
                    { key: 'semana', label: 'Esta semana' },
                    { key: 'mes', label: 'Este mes' },
                    { key: 'año', label: 'Este año' },
                  ] as { key: QuickPeriod; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleQuickPeriod(key)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-surface text-content-muted hover:text-content border border-border hover:border-brand transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear */}
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                setFilterType('Todos')
              }}
              className="text-xs text-content-muted hover:text-content mt-4"
            >
              Limpiar filtros
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {entries.length > 0 && <ContabilidadChart entries={entries} />}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-content-muted text-sm">Cargando movimientos...</div>
      ) : (
        <ContabilidadTable data={entries} />
      )}

      <EgresoModal
        open={egresoOpen}
        onClose={() => setEgresoOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  )
}
