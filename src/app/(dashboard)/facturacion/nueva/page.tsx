import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { FacturaForm } from '@/components/modules/facturacion/FacturaForm'

export default function NuevaFacturaPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/facturacion"
          className="flex items-center gap-1 text-sm text-content-muted hover:text-content transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-content">Nueva Factura</h1>
          <p className="text-sm text-content-muted mt-0.5">Complete el formulario para crear una nueva factura</p>
        </div>
      </div>

      <FacturaForm />
    </div>
  )
}
