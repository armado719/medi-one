'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { MovimientoModal } from '@/components/modules/inventario/MovimientoModal'
import { ProductoForm } from '@/components/modules/inventario/ProductoForm'
import type { Product, InventoryMovement } from '@/types'

interface ProductDetail {
  id: string
  name: string
  description?: string | null
  unit: string
  stockCurrent: number
  stockMinimum: number
  unitPrice: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  movements: (InventoryMovement & { user: { name: string } })[]
}

const movementColors: Record<string, string> = {
  ENTRADA: 'success',
  SALIDA: 'destructive',
  AJUSTE: 'default',
}

export default function ProductoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMovimiento, setShowMovimiento] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const loadProduct = () => {
    setLoading(true)
    fetch(`/api/productos/${id}`)
      .then((r) => r.json())
      .then(setProduct)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProduct() }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-4xl">
        <p className="text-content-muted">Producto no encontrado.</p>
        <Link href="/inventario"><Button variant="outline" className="mt-4">Volver</Button></Link>
      </div>
    )
  }

  const isLowStock = Number(product.stockCurrent) <= Number(product.stockMinimum)

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/inventario" className="flex items-center gap-1 text-sm text-content-muted hover:text-content">
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-content">{product.name}</h1>
              {isLowStock
                ? <Badge variant="destructive">Stock bajo</Badge>
                : <Badge variant="success">En stock</Badge>
              }
            </div>
            {product.description && (
              <p className="text-sm text-content-muted mt-0.5">{product.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(!showEdit)}>
            {showEdit ? 'Cancelar edición' : 'Editar producto'}
          </Button>
          <Button size="sm" onClick={() => setShowMovimiento(true)}>
            <Plus className="w-4 h-4" />
            Registrar movimiento
          </Button>
        </div>
      </div>

      {/* Edit form */}
      {showEdit && (
        <div className="bg-bg-surface border border-border rounded-xl shadow-sm p-6">
          <h2 className="font-display text-lg font-semibold text-content mb-4">Editar producto</h2>
          <ProductoForm
            product={product}
            onSuccess={(updated) => {
              setProduct((prev) => prev ? { ...prev, ...updated } : prev)
              setShowEdit(false)
            }}
          />
        </div>
      )}

      {/* Product info */}
      <Card>
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-content-muted uppercase font-medium mb-1">Unidad</p>
            <p className="font-semibold text-content">{product.unit}</p>
          </div>
          <div>
            <p className="text-xs text-content-muted uppercase font-medium mb-1">Stock actual</p>
            <p className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
              {Number(product.stockCurrent).toLocaleString('es-CO')}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-muted uppercase font-medium mb-1">Stock mínimo</p>
            <p className="text-lg font-semibold text-content-muted">
              {Number(product.stockMinimum).toLocaleString('es-CO')}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-muted uppercase font-medium mb-1">Precio unitario</p>
            <p className="text-lg font-semibold text-content">{formatCurrency(Number(product.unitPrice))}</p>
          </div>
        </CardContent>
      </Card>

      {/* Movement history */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de movimientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {product.movements.length === 0 ? (
            <div className="py-10 text-center text-content-muted text-sm">
              No hay movimientos registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Razón</TableHead>
                  <TableHead>Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.movements.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="text-sm text-content-muted">
                      {formatDateTime(mov.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={movementColors[mov.type] as 'success' | 'destructive' | 'default'}>
                        {mov.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${mov.type === 'SALIDA' ? 'text-red-600' : mov.type === 'ENTRADA' ? 'text-green-600' : 'text-blue-600'}`}>
                      {mov.type === 'SALIDA' ? '-' : mov.type === 'ENTRADA' ? '+' : '='}{Number(mov.quantity).toLocaleString('es-CO')}
                    </TableCell>
                    <TableCell className="text-sm">{mov.reason ?? '—'}</TableCell>
                    <TableCell className="text-sm text-content-muted">{mov.user.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MovimientoModal
        product={product}
        open={showMovimiento}
        onClose={() => setShowMovimiento(false)}
        onSuccess={() => { setShowMovimiento(false); loadProduct() }}
      />
    </div>
  )
}
