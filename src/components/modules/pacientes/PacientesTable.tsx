'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Eye, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Patient, PaginatedResponse } from '@/types'

interface PacientesTableProps {
  search: string
}

const DOCUMENT_LABELS: Record<string, string> = {
  CC: 'CC',
  CE: 'CE',
  PA: 'PA',
  TI: 'TI',
}

export function PacientesTable({ search }: PacientesTableProps) {
  const [data, setData] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPatients = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        pageSize: '20',
      })
      const response = await fetch(`/api/pacientes?${params}`)
      const result: PaginatedResponse<Patient> = await response.json()
      setData(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setIsLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre completo',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-content">
            {row.original.firstName} {row.original.lastName}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'document',
      header: 'Documento',
      cell: ({ row }) => (
        <span className="text-sm text-content-muted">
          {DOCUMENT_LABELS[row.original.documentType]} {row.original.documentNumber}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => (
        <span className="text-sm text-content">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: 'eps',
      header: 'EPS',
      cell: ({ row }) => (
        <span className="text-sm text-content-muted">
          {row.original.eps || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === 'ACTIVO' ? 'success' : 'destructive'}
        >
          {row.original.status === 'ACTIVO' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link href={`/pacientes/${row.original.id}`}>
            <Button variant="ghost" size="icon" title="Ver paciente">
              <Eye className="w-4 h-4 text-content-muted" />
            </Button>
          </Link>
          <Link href={`/pacientes/${row.original.id}?edit=true`}>
            <Button variant="ghost" size="icon" title="Editar paciente">
              <Pencil className="w-4 h-4 text-content-muted" />
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-content-muted">
        <p className="text-lg font-medium">No se encontraron pacientes</p>
        {search && (
          <p className="text-sm mt-1">
            No hay resultados para &ldquo;{search}&rdquo;
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border overflow-hidden bg-bg-surface">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-bg-base hover:bg-bg-base">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-content-muted">
          Mostrando {data.length} de {total} pacientes
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-content">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
