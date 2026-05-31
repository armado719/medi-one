import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface StockBajoItem {
  id: string
  name: string
  stockCurrent: number
  stockMinimum: number
}

interface FacturaPendienteItem {
  id: string
  number: string
  total: number
  createdAt: string | Date
}

interface AlertasCardProps {
  alertas: {
    stockBajo: StockBajoItem[]
    facturasPendientes: FacturaPendienteItem[]
  }
}

export function AlertasCard({ alertas }: AlertasCardProps) {
  const totalAlertas = alertas.stockBajo.length + alertas.facturasPendientes.length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Alertas activas</CardTitle>
          {totalAlertas > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
              {totalAlertas}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {totalAlertas === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="w-10 h-10 text-content-muted/40 mb-2" />
            <p className="text-sm text-content-muted">Sin alertas activas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alertas.stockBajo.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-content truncate">{item.name}</p>
                  <p className="text-xs text-content-muted">
                    Stock: {item.stockCurrent} / Mínimo: {item.stockMinimum}
                  </p>
                </div>
                <Badge variant="destructive">Stock bajo</Badge>
              </div>
            ))}

            {alertas.facturasPendientes.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-content">Factura #{item.number}</p>
                  <p className="text-xs text-content-muted">
                    {formatCurrency(item.total)} — más de 7 días pendiente
                  </p>
                </div>
                <Badge variant="warning">Pago pendiente</Badge>
              </div>
            ))}

            <div className="pt-2">
              <Link
                href="/facturacion"
                className="text-xs text-brand hover:underline"
              >
                Ver todos →
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
