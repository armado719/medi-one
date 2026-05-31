'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import type { Prescription } from '@/types'

interface PrescriptionRow extends Prescription {
  patient: { firstName: string; lastName: string; documentNumber: string }
  user: { name: string }
}

function PrescriptionsList({ search }: { search: string }) {
  const [data, setData] = useState<PrescriptionRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ ...(search && { search }) })
    try {
      const res = await fetch(`/api/formulas?${params}`)
      const json = await res.json()
      setData(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDownload = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/pdf/formula/${id}`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `formula-${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-content-muted">
        <FileText className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No hay fórmulas registradas</p>
      </div>
    )
  }

  return (
    <div className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Médico</TableHead>
            <TableHead>Diagnóstico</TableHead>
            <TableHead>Medicamentos</TableHead>
            <TableHead className="w-24">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="text-sm text-content-muted whitespace-nowrap">
                {formatDate(p.createdAt, 'd MMM yyyy')}
              </TableCell>
              <TableCell>
                <div className="font-medium text-content">{p.patient.firstName} {p.patient.lastName}</div>
                <div className="text-xs text-content-muted">{p.patient.documentNumber}</div>
              </TableCell>
              <TableCell className="text-sm">{p.user.name}</TableCell>
              <TableCell className="text-sm text-content-muted max-w-[160px] truncate">
                {p.diagnosis ?? '—'}
              </TableCell>
              <TableCell className="text-sm text-center">
                {(p.items ?? []).length}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Link href={`/documentos/formulas/${p.id}`}>
                    <Button variant="ghost" size="icon" title="Ver detalle">
                      <FileText className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" title="Descargar PDF" onClick={(e) => handleDownload(p.id, e)}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function FormulasPage() {
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 300)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-content">Fórmulas Médicas</h1>
          <p className="text-sm text-content-muted mt-1">Prescripciones médicas emitidas</p>
        </div>
        <Link href="/documentos/formulas/nueva">
          <Button>
            <Plus className="w-4 h-4" />
            Nueva Fórmula
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
        <Input
          className="pl-9"
          placeholder="Buscar por nombre de paciente..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <PrescriptionsList search={search} />
    </div>
  )
}
