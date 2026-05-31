'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import type { ClinicalRecord } from '@/types'

export default function HistoriaEsteticaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [record, setRecord] = useState<ClinicalRecord & { user: { name: string }; patient: { firstName: string; lastName: string } } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await fetch(`/api/historias/${id}`)
        if (!response.ok) {
          toast.error('Historia no encontrada')
          router.push('/pacientes')
          return
        }
        const data = await response.json()
        setRecord(data)
      } catch {
        toast.error('Error al cargar la historia')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecord()
  }, [id, router])

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (!record) return null

  const data = record.data as Record<string, unknown>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-semibold text-content">
            Historia Estética
          </h1>
          <p className="text-sm text-content-muted">
            {record.patient?.firstName} {record.patient?.lastName} —{' '}
            {formatDate(record.createdAt)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-bg-base rounded-lg p-4 overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
