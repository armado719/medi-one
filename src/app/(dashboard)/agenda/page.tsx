'use client'

import dynamic from 'next/dynamic'

// Dynamically import the calendar to avoid SSR issues
const AgendaCalendar = dynamic(
  () =>
    import('@/components/modules/agenda/AgendaCalendar').then(
      (mod) => mod.AgendaCalendar
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[680px] bg-bg-surface border border-border rounded-xl flex items-center justify-center">
        <p className="text-content-muted">Cargando calendario...</p>
      </div>
    ),
  }
)

export default function AgendaPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-content">
          Agenda
        </h1>
        <p className="text-sm text-content-muted mt-1">
          Gestión de citas y programación. Haga clic en un horario para crear una cita.
        </p>
      </div>

      {/* Calendar */}
      <AgendaCalendar />
    </div>
  )
}
