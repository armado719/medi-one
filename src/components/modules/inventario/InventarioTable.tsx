'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Package, Eye, Plus } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'
import { MovimientoModal } from './MovimientoModal'

interface ProductRow extends Product {
  isLowStock?: boolean
}

interface Stats {
  total: number
  lowStockCount: number
  totalValue: number
}

interface Props {
  search: string
  onStatsUpdate?: (stats: Stats) => void
  onMovimientoSuccess?: () => void
}

export function InventarioTable({ search, onStatsUpdate, onMovimientoSuccess }: Props) {
  const [data, setData] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showMovimiento, setShowMovimiento] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ ...(search && { search }) })
    try {
      const res = await fetch(`/api/productos?${params}`)
      const json = await res.json()
      const products = (json.data ?? []) as Product[]
      setData(products.map((p) => ({
        ...p,
        isLowStock: Number(p.stockCurrent) <= Number(p.stockMinimum),
      })))
      if (onStatsUpdate && json.stats) onStatsUpdate(json.stats)
    } finally {
      setLoading(false)
    }
  }, [search, onStatsUpdate])

  useEffect(() => { fetchData() }, [fetchData])

  const handleMovimientoSuccess = () => {
    fetchData()
    onMovimientoSuccess?.()
    setShowMovimiento(false)
    setSelectedProduct(null)
  }

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
        <Package className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No hay productos registrados</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Stock Actual</TableHead>
              <TableHead className="text-right">Stock Mínimo</TableHead>
              <TableHead className="text-right">Precio Unit.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((product) => (
              <TableRow
                key={product.id}
                className={product.isLowStock ? 'border-l-2 border-l-red-400' : ''}
              >
                <TableCell>
                  <div className="font-medium text-content">{product.name}</div>
                  {product.description && (
                    <div className="text-xs text-content-muted truncate max-w-[200px]">{product.description}</div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-content-muted">{product.unit}</TableCell>
                <TableCell className={`text-right font-medium ${product.isLowStock ? 'text-red-600' : 'text-content'}`}>
                  {Number(product.stockCurrent).toLocaleString('es-CO')}
                </TableCell>
                <TableCell className="text-right text-sm text-content-muted">
                  {Number(product.stockMinimum).toLocaleString('es-CO')}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatCurrency(Number(product.unitPrice))}
                </TableCell>
                <TableCell>
                  {product.isLowStock ? (
                    <Badge variant="destructive">Stock bajo</Badge>
                  ) : (
                    <Badge variant="success">En stock</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Link href={`/inventario/${product.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setSelectedProduct(product); setShowMovimiento(true) }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedProduct && (
        <MovimientoModal
          product={selectedProduct}
          open={showMovimiento}
          onClose={() => { setShowMovimiento(false); setSelectedProduct(null) }}
          onSuccess={handleMovimientoSuccess}
        />
      )}
    </>
  )
}
