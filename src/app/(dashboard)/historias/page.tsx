'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, Stethoscope, Heart, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

interface Historia {
  id: string
  type: 'LABORAL' | 'ESTETICA' | 'CARDIOVASCULAR'
  createdAt: string
  patient: { firstName: string; lastName: string; documentNumber: string }
  user: { name: string }
}

const tipoConfig = {
  LABORAL: {
    label: 'Laboral',
    icon: Stethoscope,
    color: 'bg-brand/10 text-brand',
    href: (id: string) => `/historias/laboral/${id}`,
    nuevaHref: '/historias/laboral/nueva',
  },
  ESTETICA: {
    label: 'Estética',
    icon: Sparkles,
    color: 'bg-purple-100 text-purple-700',
    href: (id: string) => `/historias/estetica/${id}`,
    nuevaHref: '/historias/estetica/nueva',
  },
  CARDIOVASCULAR: {
    label: 'Cardiovascular',
    icon: Heart,
    color: 'bg-red-100 text-red-700',
    href: (id: string) => `/historias/cardiovascular/${id}`,
    nuevaHref: '/historias/cardiovascular/nueva',
  },
}

export default function HistoriasPage() {
  const [historias, setHistorias] = useState<Historia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/historias?limit=50')
      .then((r) => r.json())
      .then((d) => setHistorias(d.records ?? d ?? []))
      .catch(() => setHistorias([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-content">Historias Clínicas</h1>
          <p className="text-sm text-content-muted mt-1">Crea o consulta historias por tipo</p>
        </div>
      </div>

      {/* Nueva historia — 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(tipoConfig).map(([tipo, cfg]) => {
          const Icon = cfg.icon
          return (
            <Link key={tipo} href={cfg.nuevaHref}>
              <Card className="hover:shadow-md hover:border-brand/40 transition-all cursor-pointer group">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.color} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-content">Historia {cfg.label}</p>
                    <p className="text-xs text-content-muted flex items-center gap-1 mt-0.5">
                      <Plus className="w-3 h-3" /> Nueva historia
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Listado reciente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand" />
            Historias recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : historias.length === 0 ? (
            <div className="text-center py-12 text-content-muted">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay historias clínicas aún</p>
              <p className="text-sm mt-1">Crea la primera usando los botones de arriba</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {historias.map((h) => {
                const cfg = tipoConfig[h.type]
                const Icon = cfg.icon
                return (
                  <Link
                    key={h.id}
                    href={cfg.href(h.id)}
                    className="flex items-center gap-4 py-3 hover:bg-bg-base px-2 rounded-lg transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-content truncate">
                        {h.patient.firstName} {h.patient.lastName}
                      </p>
                      <p className="text-xs text-content-muted">{h.patient.documentNumber}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">{cfg.label}</Badge>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-content-muted">{formatDate(h.createdAt)}</p>
                      <p className="text-xs text-content-muted">{h.user?.name}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
