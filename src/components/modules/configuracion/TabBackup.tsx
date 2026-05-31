'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, ExternalLink, CheckCircle } from 'lucide-react'

const steps = [
  'Abra phpMyAdmin haciendo clic en el botón de abajo.',
  'En el panel izquierdo, seleccione la base de datos "medione".',
  'Haga clic en la pestaña "Exportar" en la barra superior.',
  'Seleccione el método "Rápido" y el formato "SQL".',
  'Haga clic en "Continuar" para descargar el archivo .sql.',
  'Guarde el archivo en un lugar seguro (disco externo, nube, etc.).',
  'Se recomienda realizar este proceso al menos una vez por semana.',
]

export function TabBackup() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand/10 rounded-xl">
              <Database className="w-5 h-5 text-brand" />
            </div>
            <div>
              <CardTitle className="text-lg">Respaldo de la base de datos</CardTitle>
              <p className="text-sm text-content-muted mt-0.5">
                Realice copias de seguridad periódicas para proteger la información del consultorio
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <div>
            <h3 className="text-sm font-semibold text-content mb-3">
              Cómo hacer un backup con phpMyAdmin
            </h3>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-semibold mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-content">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Recommendations */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Recomendaciones de seguridad
            </h3>
            <ul className="space-y-1 text-sm text-green-700">
              <li>• Realice backups al menos una vez por semana</li>
              <li>• Guarde las copias en múltiples ubicaciones (local + nube)</li>
              <li>• Verifique periódicamente que los backups se puedan restaurar</li>
              <li>• Nombre los archivos con la fecha: medione-backup-2025-01-15.sql</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => window.open('http://localhost/phpmyadmin', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir phpMyAdmin
            </Button>
          </div>

          {/* Info card */}
          <div className="bg-brand/5 border border-brand/20 rounded-xl p-4">
            <p className="text-sm text-content">
              <strong>Información técnica:</strong> La base de datos del sistema se llama{' '}
              <code className="bg-brand/10 px-1 rounded text-brand">medione</code> y utiliza
              MySQL. El archivo de backup tendrá extensión <code className="bg-brand/10 px-1 rounded text-brand">.sql</code>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
