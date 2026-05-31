import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HistoriaLaboral } from '@/components/modules/historias/HistoriaLaboral'

export default function NuevaHistoriaLaboralPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/pacientes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-content">
            Nueva Historia Laboral
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Examen médico ocupacional
          </p>
        </div>
      </div>

      <HistoriaLaboral />
    </div>
  )
}
