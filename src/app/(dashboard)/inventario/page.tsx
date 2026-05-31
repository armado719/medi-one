'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Package, AlertTriangle, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { InventarioTable } from '@/components/modules/inventario/InventarioTable'
import { useDebounce } from '@/hooks/useDebounce'
import { formatCurrency } from '@/lib/utils'

interface Stats {
  total: number
  lowStockCount: number
  totalValue: number
}

export default function InventarioPage() {
  const [searchInput, setSearchInput] = useState('')
  const [stats, setStats] = useState<Stats>({ total: 0, lowStockCount: 0, totalValue: 0 })
  const [refreshKey, setRefreshKey] = useState(0)
  const search = useDebounce(searchInput, 300)

  const handleStatsUpdate = useCallback((newStats: Stats) => {
    setStats(newStats)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-content">Inventario</h1>
          <p className="text-sm text-content-muted mt-1">Control de productos y stock</p>
        </div>
        <Link href="/inventario/nuevo">
          <Button>
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      {/* Low stock alert */}
      {stats.lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            {stats.lowStockCount} producto{stats.lowStockCount > 1 ? 's' : ''} con stock igual o por debajo del mínimo.
            Revise y registre entradas cuando sea necesario.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-content-muted uppercase font-medium">Total productos</p>
              <p className="text-2xl font-bold text-content">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-content-muted uppercase font-medium">Stock bajo</p>
              <p className="text-2xl font-bold text-content">{stats.lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-content-muted uppercase font-medium">Valor total</p>
              <p className="text-xl font-bold text-content">{formatCurrency(stats.totalValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
        <Input
          className="pl-9"
          placeholder="Buscar producto..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <InventarioTable
        key={refreshKey}
        search={search}
        onStatsUpdate={handleStatsUpdate}
        onMovimientoSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
