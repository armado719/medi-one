import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProductoForm } from '@/components/modules/inventario/ProductoForm'

export default function NuevoProductoPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/inventario"
          className="flex items-center gap-1 text-sm text-content-muted hover:text-content transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-content">Nuevo Producto</h1>
          <p className="text-sm text-content-muted mt-0.5">Registre un nuevo producto en el inventario</p>
        </div>
      </div>

      <div className="bg-bg-surface border border-border rounded-xl shadow-sm p-6">
        <ProductoForm />
      </div>
    </div>
  )
}
