'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TabConsultorio } from '@/components/modules/configuracion/TabConsultorio'
import { TabMedico } from '@/components/modules/configuracion/TabMedico'
import { TabUsuarios } from '@/components/modules/configuracion/TabUsuarios'
import { TabTarifas } from '@/components/modules/configuracion/TabTarifas'
import { TabBackup } from '@/components/modules/configuracion/TabBackup'
import { TabAuditLog } from '@/components/modules/configuracion/TabAuditLog'

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-content">Configuración</h1>
        <p className="text-content-muted text-sm mt-1">
          Administra la información del consultorio y el sistema
        </p>
      </div>

      <Tabs defaultValue="consultorio">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="consultorio">Consultorio</TabsTrigger>
          <TabsTrigger value="medico">Médico / Doctora</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
          <TabsTrigger value="auditlog">Auditoría</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="consultorio">
          <TabConsultorio />
        </TabsContent>

        <TabsContent value="medico">
          <TabMedico />
        </TabsContent>

        <TabsContent value="usuarios">
          <TabUsuarios />
        </TabsContent>

        <TabsContent value="tarifas">
          <TabTarifas />
        </TabsContent>

        <TabsContent value="auditlog">
          <TabAuditLog />
        </TabsContent>

        <TabsContent value="backup">
          <TabBackup />
        </TabsContent>
      </Tabs>
    </div>
  )
}
