'use client'

import { useState } from 'react'
import { Download, Printer, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  downloadUrl: string
  filename?: string
  printUrl?: string
}

export function DownloadPrintButtons({ downloadUrl, filename, printUrl }: Props) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(downloadUrl)
      if (!res.ok) throw new Error('Error al generar el PDF')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename ?? 'documento.pdf'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF descargado correctamente')
    } catch {
      toast.error('No se pudo descargar el PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => {
    const url = printUrl ?? downloadUrl
    const win = window.open(url, '_blank')
    if (win) {
      win.addEventListener('load', () => {
        win.focus()
        win.print()
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="gap-2"
      >
        <Printer className="w-4 h-4" />
        Imprimir
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={downloading}
        className="gap-2"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {downloading ? 'Generando...' : 'Descargar PDF'}
      </Button>
    </div>
  )
}
