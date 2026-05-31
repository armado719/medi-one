'use client'

import { useSession } from 'next-auth/react'
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Role } from '@/types'

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

function StatCard({ title, value, subtitle, icon: Icon, iconColor }: StatCardProps) {
  return (
    <Card className="bg-bg-surface border border-border rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-content-muted font-medium">{title}</p>
            <p className="font-display text-3xl font-semibold text-content mt-1">{value}</p>
            <p className="text-xs text-content-muted mt-1">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-xl ${iconColor}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card className="bg-bg-surface border border-border rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const userRole = session?.user?.role as Role | undefined
  const isAdmin = userRole === 'ADMINISTRADOR'

  const firstName = session?.user?.name?.split(' ')[0] || 'Usuario'

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-content">
          Bienvenido, {firstName}
        </h1>
        <p className="text-content-muted mt-1 text-sm">
          Aquí tienes un resumen de tu día —{' '}
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Citas hoy"
          value="8"
          subtitle="2 pendientes de confirmar"
          icon={Calendar}
          iconColor="bg-brand"
        />
        <StatCard
          title="Pacientes atendidos"
          value="5"
          subtitle="de 8 programados"
          icon={Users}
          iconColor="bg-blue-500"
        />
        {isAdmin && (
          <StatCard
            title="Ingresos del día"
            value="$480.000"
            subtitle="COP — estimado"
            icon={TrendingUp}
            iconColor="bg-green-500"
          />
        )}
        <StatCard
          title="Próximas citas"
          value="3"
          subtitle="en las próximas 2 horas"
          icon={Clock}
          iconColor="bg-purple-500"
        />
      </div>

      {/* Quick Actions + Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <Card className="bg-bg-surface border border-border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Próximas citas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { time: '10:30', patient: 'María García', type: 'Estética', status: 'Confirmada' },
              { time: '11:00', patient: 'Carlos López', type: 'Laboral', status: 'Pendiente' },
              { time: '11:30', patient: 'Ana Martínez', type: 'Cardiovascular', status: 'Confirmada' },
            ].map((apt, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-xl bg-bg-base hover:bg-bg-surface transition-colors cursor-default"
              >
                <div className="text-center w-12">
                  <p className="text-sm font-semibold text-brand">{apt.time}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-content">{apt.patient}</p>
                  <p className="text-xs text-content-muted">{apt.type}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    apt.status === 'Confirmada'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {apt.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick access */}
        <Card className="bg-bg-surface border border-border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Acceso rápido</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: 'Nuevo Paciente', href: '/pacientes/nuevo', icon: Users, color: 'bg-brand/10 text-brand hover:bg-brand hover:text-white' },
              { label: 'Nueva Cita', href: '/agenda', icon: Calendar, color: 'bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white' },
              { label: 'Historia Laboral', href: '/historias/laboral/nueva', icon: TrendingUp, color: 'bg-green-50 text-green-600 hover:bg-green-500 hover:text-white' },
              { label: 'Historia Estética', href: '/historias/estetica/nueva', icon: Clock, color: 'bg-purple-50 text-purple-600 hover:bg-purple-500 hover:text-white' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <a
                  key={i}
                  href={item.href}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all ${item.color}`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-center leading-tight">{item.label}</span>
                </a>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
