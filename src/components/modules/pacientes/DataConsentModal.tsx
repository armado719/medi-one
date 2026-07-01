'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DATA_CONSENT_TEXT, DATA_CONSENT_VERSION } from '@/lib/legal/dataConsentContent'
import type { DataConsent } from '@/types'

interface DataConsentModalProps {
  patientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccepted: (consent: DataConsent) => void
}

export function DataConsentModal({
  patientId,
  open,
  onOpenChange,
  onAccepted,
}: DataConsentModalProps) {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false)
  const [checked, setChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const reachedEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 8
    if (reachedEnd) setHasScrolledToEnd(true)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setHasScrolledToEnd(false)
      setChecked(false)
    }
    onOpenChange(next)
  }

  const handleAccept = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/pacientes/${patientId}/consentimiento-datos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: DATA_CONSENT_VERSION, accepted: true }),
      })
      const result = await response.json()
      if (!response.ok) {
        toast.error(result.error || 'Error al registrar el consentimiento')
        return
      }
      toast.success('Consentimiento registrado')
      onAccepted(result)
      handleOpenChange(false)
    } catch {
      toast.error('Error al registrar el consentimiento')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Autorización de tratamiento de datos</DialogTitle>
          <DialogDescription>
            Lea el documento completo antes de continuar. Es requerido para crear historias
            clínicas del paciente.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-80 overflow-y-auto rounded-xl border border-border bg-bg-base p-4 text-sm text-content whitespace-pre-wrap"
        >
          {DATA_CONSENT_TEXT}
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="data-consent-checkbox"
            checked={checked}
            disabled={!hasScrolledToEnd}
            onCheckedChange={(value) => setChecked(value === true)}
            className="mt-0.5"
          />
          <label htmlFor="data-consent-checkbox" className="text-sm text-content">
            He leído y autorizo el tratamiento de mis datos personales y datos sensibles de
            salud conforme a lo descrito
            {!hasScrolledToEnd && (
              <span className="block text-xs text-content-muted mt-1">
                Debe desplazarse hasta el final del documento para continuar.
              </span>
            )}
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAccept} disabled={!checked || isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Aceptar y continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
