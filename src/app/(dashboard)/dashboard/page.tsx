'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { StatsCards } from '@/components/modules/dashboard/StatsCards'
import { CitasHoyList } from '@/components/modules/dashboard/CitasHoyList'
import { AlertasCard } from '@/components/modules/dashboard/AlertasCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import type { Role, ClinicalRecordType } from '@/types'

const IngresosChart = dynamic(
  () => import('@/components/modules/dashboard/IngresosChart').then((m) => m.IngresosChart),
  { ssr: false }
)
const ProcedimientosChart = dynamic(
  () =>
    import('@/components/modules/dashboard/ProcedimientosChart').then(
      (m) => m.ProcedimientosChart
    ),
  { ssr: false }
)
const PacientesChart = dynamic(
  () =>
    import('@/components/modules/dashboard/PacientesChart').then((m) => m.PacientesChart),
  { ssr: false }
)

interface DashboardData {
  citasHoy: number
  pacientesAtendidos: number
  ingresosMes: number
  facturasPendientes: number
  ingresosUltimos6Meses: { mes: string; total: number }[]
  procedimientosTop: { nombre: string; total: number }[]
  citasHoyDetalle: Array<{
    id: string
    patientName: string
    patientId: string
    date: string
    type: string
    status: string
  }>
  alertas: {
    stockBajo: Array<{ id: string; name: string; stockCurrent: number; stockMinimum: number }>
    facturasPendientes: Array<{ id: string; number: string; total: number; createdAt: string }>
  }
  pacientesNuevosVsRecurrentes: { mes: string; nuevos: number; recurrentes: number }[]
  ultimasHistorias: Array<{
    id: string
    patientName: string
    type: string
    createdAt: string
    doctorName: string
  }>
  userRole: string
}

const TYPE_RECORD_LABELS: Record<ClinicalRecordType, string> = {
  LABORAL: 'Laboral',
  ESTETICA: 'Estética',
  CARDIOVASCULAR: 'Cardiovascular',
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const userRole = session?.user?.role as Role | undefined
  const firstName = session?.user?.name?.split(' ')[0] || 'Usuario'
  const isAdmin = userRole === 'ADMINISTRADOR'
  const isMedico = userRole === 'MEDICO'

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/dashboard')
        .then((r) => r.json())
        .then(setData)
        .catch(() => null)
        .finally(() => setLoading(false))
    }
  }, [status])

  if (status === 'loading' || loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-content">
          Bienvenido, {firstName}
        </h1>
        <p className="text-content-muted mt-1 text-sm">
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Row 1: Stats */}
      <StatsCards
        citasHoy={data?.citasHoy ?? 0}
        pacientesAtendidos={data?.pacientesAtendidos ?? 0}
        ingresosMes={data?.ingresosMes ?? 0}
        facturasPendientes={data?.facturasPendientes ?? 0}
        userRole={userRole ?? ''}
      />

      {/* Row 2: Charts (ADMINISTRADOR only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IngresosChart data={data?.ingresosUltimos6Meses ?? []} />
          <ProcedimientosChart data={data?.procedimientosTop ?? []} />
        </div>
      )}

      {/* Row 3: Today's appointments + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CitasHoyList citas={data?.citasHoyDetalle ?? []} />
        {isAdmin && (
          <AlertasCard
            alertas={data?.alertas ?? { stockBajo: [], facturasPendientes: [] }}
          />
        )}
        {(isMedico || userRole === 'RECEPCIONISTA') && !isAdmin && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Acceso rápido</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link
                href="/pacientes/nuevo"
                className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium bg-brand/10 text-brand hover:bg-brand hover:text-white transition-all text-center"
              >
                Nuevo Paciente
              </Link>
              <Link
                href="/agenda"
                className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-all text-center"
              >
                Nueva Cita
              </Link>
              {isMedico && (
                <>
                  <Link
                    href="/historias/laboral/nueva"
                    className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-all text-center"
                  >
                    Historia Laboral
                  </Link>
                  <Link
                    href="/historias/estetica/nueva"
                    className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium bg-purple-50 text-purple-600 hover:bg-purple-500 hover:text-white transition-all text-center"
                  >
                    Historia Estética
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 4: Charts + Recent clinical records (ADMIN & MEDICO) */}
      {(isAdmin || isMedico) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isAdmin && <PacientesChart data={data?.pacientesNuevosVsRecurrentes ?? []} />}

          {/* Últimas historias clínicas */}
          <Card className={isAdmin ? '' : 'lg:col-span-2'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Últimas historias clínicas</CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.ultimasHistorias || data.ultimasHistorias.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-content-muted">No hay historias recientes</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-content-muted font-medium">
                          Paciente
                        </th>
                        <th className="text-left py-2 text-content-muted font-medium">Tipo</th>
                        <th className="text-left py-2 text-content-muted font-medium">Fecha</th>
                        <th className="text-left py-2 text-content-muted font-medium">Médico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ultimasHistorias.map((h) => (
                        <tr
                          key={h.id}
                          className="border-b border-border/50 hover:bg-bg-surface"
                        >
                          <td className="py-2 font-medium text-content">{h.patientName}</td>
                          <td className="py-2">
                            <Badge variant="secondary">
                              {TYPE_RECORD_LABELS[h.type as ClinicalRecordType] ?? h.type}
                            </Badge>
                          </td>
                          <td className="py-2 text-content-muted">
                            {formatDate(h.createdAt, 'd MMM yyyy')}
                          </td>
                          <td className="py-2 text-content-muted">{h.doctorName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
