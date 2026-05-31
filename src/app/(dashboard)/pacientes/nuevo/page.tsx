import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PacienteForm } from '@/components/modules/pacientes/PacienteForm'

export default function NuevoPacientePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/pacientes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-content">
            Nuevo Paciente
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Complete los datos para registrar un nuevo paciente
          </p>
        </div>
      </div>

      {/* Form */}
      <PacienteForm mode="create" />
    </div>
  )
}
