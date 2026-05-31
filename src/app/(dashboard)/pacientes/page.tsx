'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PacientesTable } from '@/components/modules/pacientes/PacientesTable'
import { useDebounce } from '@/hooks/useDebounce'

export default function PacientesPage() {
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 300)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-content">
            Pacientes
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Gestión del registro de pacientes
          </p>
        </div>
        <Link href="/pacientes/nuevo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Paciente
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
        <Input
          className="pl-9"
          placeholder="Buscar por nombre o documento..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {/* Table */}
      <PacientesTable search={search} />
    </div>
  )
}
