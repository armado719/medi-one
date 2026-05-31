import { Calendar, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface StatsCardsProps {
  citasHoy: number
  pacientesAtendidos: number
  ingresosMes: number
  facturasPendientes: number
  userRole: string
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
}

function StatCard({ title, value, subtitle, icon: Icon, iconBg }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-content-muted font-medium">{title}</p>
            <p className="font-display text-3xl font-semibold text-content mt-1">{value}</p>
            <p className="text-xs text-content-muted mt-1">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards({
  citasHoy,
  pacientesAtendidos,
  ingresosMes,
  facturasPendientes,
  userRole,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Citas hoy"
        value={citasHoy}
        subtitle="Total programadas"
        icon={Calendar}
        iconBg="bg-brand"
      />
      <StatCard
        title="Pacientes atendidos hoy"
        value={pacientesAtendidos}
        subtitle="Citas confirmadas"
        icon={Users}
        iconBg="bg-blue-500"
      />
      {userRole === 'ADMINISTRADOR' && (
        <>
          <StatCard
            title="Ingresos del mes"
            value={formatCurrency(ingresosMes)}
            subtitle="Pagos recibidos"
            icon={TrendingUp}
            iconBg="bg-green-500"
          />
          <StatCard
            title="Facturas pendientes"
            value={facturasPendientes}
            subtitle="Por cobrar"
            icon={AlertCircle}
            iconBg="bg-orange-500"
          />
        </>
      )}
    </div>
  )
}
