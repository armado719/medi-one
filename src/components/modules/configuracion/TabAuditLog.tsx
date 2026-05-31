'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface AuditEntry {
  id: string
  action: string
  entity: string
  entityId: string
  createdAt: string
  user: { name: string }
}

const ACTION_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'destructive',
  VIEW: 'secondary',
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Edición',
  DELETE: 'Eliminación',
  VIEW: 'Consulta',
}

export function TabAuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/audit')
        if (res.ok) setLogs(await res.json())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand/10 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-brand" />
          </div>
          <div>
            <CardTitle className="text-lg">Registro de auditoría</CardTitle>
            <p className="text-xs text-content-muted mt-0.5">
              Últimas 100 acciones críticas del sistema
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-content-muted text-center py-8">Cargando registros...</p>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="w-10 h-10 text-content-muted/40 mb-2" />
            <p className="text-sm text-content-muted">No hay registros de auditoría</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-2 font-medium text-content-muted">Fecha</th>
                  <th className="text-left py-2 font-medium text-content-muted">Usuario</th>
                  <th className="text-left py-2 font-medium text-content-muted">Acción</th>
                  <th className="text-left py-2 font-medium text-content-muted">Entidad</th>
                  <th className="text-left py-2 font-medium text-content-muted">ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-bg-surface">
                    <td className="py-2 text-content-muted whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-2 font-medium text-content">{log.user.name}</td>
                    <td className="py-2">
                      <Badge variant={ACTION_VARIANT[log.action] ?? 'secondary'}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </td>
                    <td className="py-2 text-content">{log.entity}</td>
                    <td className="py-2 text-content-muted font-mono text-xs truncate max-w-[120px]">
                      {log.entityId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
