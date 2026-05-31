'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Download, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, calculateAge } from '@/lib/utils'
import type { Prescription, PrescriptionItem, Patient } from '@/types'

interface PrescriptionDetail extends Prescription {
  patient: Patient
  user: { name: string }
  items: PrescriptionItem[]
}

export default function FormulaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/formulas/${id}`)
      .then((r) => r.json())
      .then(setPrescription)
      .finally(() => setLoading(false))
  }, [id])

  const handleDownload = async () => {
    const res = await fetch(`/api/pdf/formula/${id}`)
    if (!res.ok) { toast.error('Error al generar PDF'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `formula-${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="max-w-4xl">
        <p className="text-content-muted">Fórmula no encontrada.</p>
        <Link href="/documentos/formulas"><Button variant="outline" className="mt-4">Volver</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/documentos/formulas" className="flex items-center gap-1 text-sm text-content-muted hover:text-content">
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold text-content">Fórmula Médica</h1>
            <p className="text-sm text-content-muted mt-0.5">Emitida el {formatDate(prescription.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Descargar PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Patient info */}
      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-content-muted uppercase font-medium mb-1">Paciente</p>
            <p className="font-semibold text-content">{prescription.patient.firstName} {prescription.patient.lastName}</p>
            <p className="text-sm text-content-muted">{prescription.patient.documentType}: {prescription.patient.documentNumber}</p>
            <p className="text-sm text-content-muted">{calculateAge(prescription.patient.birthDate)} años</p>
          </div>
          <div>
            <p className="text-xs text-content-muted uppercase font-medium mb-1">Médico</p>
            <p className="text-sm text-content">{prescription.user.name}</p>
            <p className="text-xs text-content-muted uppercase font-medium mb-1 mt-3">Fecha</p>
            <p className="text-sm text-content">{formatDate(prescription.createdAt)}</p>
          </div>
          {prescription.diagnosis && (
            <div>
              <p className="text-xs text-content-muted uppercase font-medium mb-1">Diagnóstico</p>
              <p className="text-sm text-content">{prescription.diagnosis}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <CardTitle>Medicamentos prescritos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicamento</TableHead>
                <TableHead>Concentración</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Dosis</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Vía</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescription.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.medication}</TableCell>
                  <TableCell className="text-sm text-content-muted">{item.concentration ?? '—'}</TableCell>
                  <TableCell className="text-sm">{item.form ?? '—'}</TableCell>
                  <TableCell className="text-sm">{item.dose}</TableCell>
                  <TableCell className="text-sm">{item.frequency}</TableCell>
                  <TableCell className="text-sm">{item.duration}</TableCell>
                  <TableCell className="text-sm">{item.route ?? 'Oral'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Instructions */}
      {prescription.instructions && (
        <Card>
          <CardHeader>
            <CardTitle>Indicaciones generales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-content leading-relaxed">{prescription.instructions}</p>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-sm text-content-muted border-t border-border pt-4">
        Válida por 30 días desde la fecha de emisión — {formatDate(prescription.createdAt)}
      </div>
    </div>
  )
}
