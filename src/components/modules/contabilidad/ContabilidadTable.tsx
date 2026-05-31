'use client'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

export interface ContabilidadEntry {
  id: string
  type: 'INGRESO' | 'EGRESO'
  amount: number
  description: string
  date: string
  invoiceNumber: string | null
  patientName: string | null
  createdBy: string
}

const columnHelper = createColumnHelper<ContabilidadEntry>()

const columns = [
  columnHelper.accessor('date', {
    header: 'Fecha',
    cell: (info) => (
      <span className="text-sm text-content">{formatDate(info.getValue(), 'd MMM yyyy')}</span>
    ),
  }),
  columnHelper.accessor('type', {
    header: 'Tipo',
    cell: (info) => (
      <Badge variant={info.getValue() === 'INGRESO' ? 'success' : 'destructive'}>
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor('description', {
    header: 'Descripción',
    cell: (info) => (
      <span className="text-sm text-content max-w-xs truncate block">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('patientName', {
    header: 'Paciente',
    cell: (info) => (
      <span className="text-sm text-content-muted">{info.getValue() ?? '—'}</span>
    ),
  }),
  columnHelper.accessor('amount', {
    header: 'Monto',
    cell: (info) => (
      <span
        className={`text-sm font-semibold ${
          info.row.original.type === 'INGRESO' ? 'text-green-700' : 'text-red-700'
        }`}
      >
        {info.row.original.type === 'INGRESO' ? '+' : '-'}
        {formatCurrency(info.getValue())}
      </span>
    ),
  }),
]

interface ContabilidadTableProps {
  data: ContabilidadEntry[]
}

export function ContabilidadTable({ data }: ContabilidadTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-content-muted text-sm">No hay movimientos para mostrar</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-bg-surface border-b border-border">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="text-left py-3 px-4 font-medium text-content-muted"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border/50 hover:bg-bg-surface transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="py-3 px-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
