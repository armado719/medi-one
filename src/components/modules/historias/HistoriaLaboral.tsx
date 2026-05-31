'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { historiaLaboralSchema, type HistoriaLaboralFormData } from '@/validations/historia'
import { calculateIMC, getIMCCategory } from '@/lib/utils'

const SISTEMAS = [
  'cardiovascular',
  'respiratorio',
  'digestivo',
  'neurológico',
  'osteomuscular',
  'genitourinario',
  'piel',
]

const RIESGOS = [
  { key: 'fisico', label: 'Físico' },
  { key: 'quimico', label: 'Químico' },
  { key: 'biologico', label: 'Biológico' },
  { key: 'ergonomico', label: 'Ergonómico' },
  { key: 'psicosocial', label: 'Psicosocial' },
  { key: 'mecanico', label: 'Mecánico' },
  { key: 'electrico', label: 'Eléctrico' },
]

const TABS = [
  'laboral',
  'riesgos',
  'antecedentes',
  'revision',
  'examen',
  'paraclínicos',
  'diagnostico',
  'conclusion',
  'firma',
] as const

type TabValue = typeof TABS[number]

const TOTAL_TABS = TABS.length

export function HistoriaLaboral() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pacienteId = searchParams.get('pacienteId') || ''
  const [activeTab, setActiveTab] = useState<TabValue>('laboral')

  const currentTabIndex = TABS.indexOf(activeTab)

  const goToNextTab = () => {
    if (currentTabIndex < TOTAL_TABS - 1) {
      setActiveTab(TABS[currentTabIndex + 1])
    }
  }

  const goToPrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(TABS[currentTabIndex - 1])
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<HistoriaLaboralFormData>({
    resolver: zodResolver(historiaLaboralSchema),
    defaultValues: {
      patientId: pacienteId,
      tipoExamen: 'Ingreso',
      riesgos: {
        fisico: false,
        quimico: false,
        biologico: false,
        ergonomico: false,
        psicosocial: false,
        mecanico: false,
        electrico: false,
        descripcion: {},
      },
      antecedentesPer: {
        patologicos: '',
        quirurgicos: '',
        traumaticos: '',
        toxicos: '',
        farmacologicos: '',
      },
      antecedentesFam: '',
      revisionSistemas: Object.fromEntries(
        SISTEMAS.map((s) => [s, { presente: false, descripcion: '' }])
      ),
      examenFisico: {
        ta: '',
        fc: null,
        fr: null,
        temp: null,
        peso: null,
        talla: null,
        imc: null,
        hallazgos: Object.fromEntries(SISTEMAS.map((s) => [s, ''])),
      },
      paraclínicos: [],
      diagnostico: { cie10: '', descripcion: '' },
      conclusion: {
        aptitud: 'Apto',
        restricciones: '',
        recomendaciones: '',
      },
    },
  })

  const { fields: paraFields, append: paraAppend, remove: paraRemove } = useFieldArray({
    control,
    name: 'paraclínicos',
  })

  const peso = watch('examenFisico.peso')
  const talla = watch('examenFisico.talla')
  const imc = peso && talla ? calculateIMC(peso, talla) : null

  const riesgosWatched = watch('riesgos')

  const onSubmit = async (data: HistoriaLaboralFormData) => {
    try {
      if (imc) {
        data.examenFisico.imc = imc
      }

      const response = await fetch('/api/historias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: data.patientId,
          type: 'LABORAL',
          data,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Error al guardar la historia')
        return
      }

      toast.success('Historia laboral guardada exitosamente')
      router.push(`/pacientes/${data.patientId}`)
    } catch {
      toast.error('Ocurrió un error inesperado')
    }
  }

  /** Progress bar + step counter shown above the tab list */
  const ProgressHeader = () => (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-content-muted">
        Sección <strong>{currentTabIndex + 1}</strong> de {TOTAL_TABS}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: TOTAL_TABS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i <= currentTabIndex ? 'bg-brand' : 'bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  )

  /** Navigation buttons at the bottom of each tab */
  const NavButtons = ({ isLast = false }: { isLast?: boolean }) => (
    <div className="flex justify-between mt-6 pt-4 border-t border-border">
      <Button
        type="button"
        variant="outline"
        onClick={goToPrevTab}
        disabled={currentTabIndex === 0}
      >
        ← Anterior
      </Button>
      {isLast ? (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Historia'}
        </Button>
      ) : (
        <Button type="button" onClick={goToNextTab}>
          Siguiente →
        </Button>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="patientId">
              ID Paciente <span className="text-red-500">*</span>
            </Label>
            <Input
              id="patientId"
              placeholder="ID del paciente"
              {...register('patientId')}
              readOnly={!!pacienteId}
              className={pacienteId ? 'bg-bg-base' : ''}
            />
            {errors.patientId && (
              <p className="text-xs text-red-500">{errors.patientId.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <ProgressHeader />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-2">
          <TabsTrigger value="laboral">1. Datos Laborales</TabsTrigger>
          <TabsTrigger value="riesgos">2. Riesgos</TabsTrigger>
          <TabsTrigger value="antecedentes">3. Antecedentes</TabsTrigger>
          <TabsTrigger value="revision">4. Rev. Sistemas</TabsTrigger>
          <TabsTrigger value="examen">5. Examen Físico</TabsTrigger>
          <TabsTrigger value="paraclínicos">6. Paraclínicos</TabsTrigger>
          <TabsTrigger value="diagnostico">7. Diagnóstico</TabsTrigger>
          <TabsTrigger value="conclusion">8. Conclusión</TabsTrigger>
          <TabsTrigger value="firma">9. Firma</TabsTrigger>
        </TabsList>

        {/* Tab 1: Datos Laborales */}
        <TabsContent value="laboral">
          <Card>
            <CardHeader>
              <CardTitle>Datos Laborales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Empresa <span className="text-red-500">*</span></Label>
                <Input placeholder="Nombre de la empresa" {...register('empresa')} />
                {errors.empresa && <p className="text-xs text-red-500">{errors.empresa.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>NIT</Label>
                <Input placeholder="NIT de la empresa" {...register('nit')} />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo <span className="text-red-500">*</span></Label>
                <Input placeholder="Cargo del trabajador" {...register('cargo')} />
                {errors.cargo && <p className="text-xs text-red-500">{errors.cargo.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Área</Label>
                <Input placeholder="Área de trabajo" {...register('area')} />
              </div>
              <div className="space-y-1.5">
                <Label>Tiempo laborando</Label>
                <Input placeholder="Ej. 2 años 3 meses" {...register('tiempoLaborando')} />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de examen</Label>
                <Select
                  defaultValue="Ingreso"
                  onValueChange={(val) =>
                    setValue('tipoExamen', val as HistoriaLaboralFormData['tipoExamen'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ingreso">Ingreso</SelectItem>
                    <SelectItem value="Periódico">Periódico</SelectItem>
                    <SelectItem value="Retiro">Retiro</SelectItem>
                    <SelectItem value="Post-incapacidad">Post-incapacidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 2: Riesgos Ocupacionales */}
        <TabsContent value="riesgos">
          <Card>
            <CardHeader>
              <CardTitle>Riesgos Ocupacionales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {RIESGOS.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`riesgo-${key}`}
                      checked={riesgosWatched?.[key as keyof typeof riesgosWatched] === true}
                      onCheckedChange={(checked) => {
                        const riesgoKey = key as 'fisico' | 'quimico' | 'biologico' | 'ergonomico' | 'psicosocial' | 'mecanico' | 'electrico'
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setValue(`riesgos.${riesgoKey}` as any, checked as boolean)
                      }}
                    />
                    <Label htmlFor={`riesgo-${key}`}>{label}</Label>
                  </div>
                  {riesgosWatched?.[key as keyof typeof riesgosWatched] === true && (
                    <Textarea
                      placeholder={`Descripción del riesgo ${label.toLowerCase()}...`}
                      className="ml-6"
                      onChange={(e) =>
                        setValue(`riesgos.descripcion.${key}`, e.target.value)
                      }
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 3: Antecedentes */}
        <TabsContent value="antecedentes">
          <Card>
            <CardHeader>
              <CardTitle>Antecedentes Personales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'patologicos', label: 'Patológicos' },
                { key: 'quirurgicos', label: 'Quirúrgicos' },
                { key: 'traumaticos', label: 'Traumáticos' },
                { key: 'toxicos', label: 'Tóxicos' },
                { key: 'farmacologicos', label: 'Farmacológicos' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Textarea
                    placeholder={`Antecedentes ${label.toLowerCase()}...`}
                    {...register(`antecedentesPer.${key as keyof HistoriaLaboralFormData['antecedentesPer']}`)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Antecedentes Familiares</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Antecedentes familiares relevantes..."
                rows={4}
                {...register('antecedentesFam')}
              />
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 4: Revisión por Sistemas */}
        <TabsContent value="revision">
          <Card>
            <CardHeader>
              <CardTitle>Revisión por Sistemas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {SISTEMAS.map((sistema) => (
                <div key={sistema} className="space-y-2 p-3 rounded-xl bg-bg-base">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`sistema-${sistema}`}
                      onCheckedChange={(checked) =>
                        setValue(`revisionSistemas.${sistema}.presente`, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`sistema-${sistema}`}
                      className="capitalize font-medium"
                    >
                      {sistema}
                    </Label>
                  </div>
                  <Textarea
                    placeholder={`Hallazgos en sistema ${sistema}...`}
                    className="text-sm"
                    {...register(`revisionSistemas.${sistema}.descripcion`)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 5: Examen Físico */}
        <TabsContent value="examen">
          <Card>
            <CardHeader>
              <CardTitle>Signos Vitales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>TA (mmHg)</Label>
                <Input placeholder="120/80" {...register('examenFisico.ta')} />
              </div>
              <div className="space-y-1.5">
                <Label>FC (lpm)</Label>
                <Input
                  type="number"
                  placeholder="75"
                  {...register('examenFisico.fc', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>FR (rpm)</Label>
                <Input
                  type="number"
                  placeholder="16"
                  {...register('examenFisico.fr', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Temp (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="36.6"
                  {...register('examenFisico.temp', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="70"
                  {...register('examenFisico.peso', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Talla (cm)</Label>
                <Input
                  type="number"
                  placeholder="170"
                  {...register('examenFisico.talla', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>IMC</Label>
                <div className="h-9 px-3 py-2 rounded-lg border border-border bg-bg-base text-sm flex items-center">
                  {imc ? (
                    <span>
                      {imc} — <span className="text-content-muted">{getIMCCategory(imc)}</span>
                    </span>
                  ) : (
                    <span className="text-content-muted">Auto-calculado</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Hallazgos por Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {SISTEMAS.map((sistema) => (
                <div key={sistema} className="space-y-1.5">
                  <Label className="capitalize">{sistema}</Label>
                  <Textarea
                    placeholder={`Hallazgos ${sistema}...`}
                    {...register(`examenFisico.hallazgos.${sistema}`)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 6: Paraclínicos */}
        <TabsContent value="paraclínicos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Paraclínicos</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  paraAppend({ nombre: '', resultado: '', valorReferencia: '', anormal: false })
                }
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar examen
              </Button>
            </CardHeader>
            <CardContent>
              {paraFields.length === 0 ? (
                <p className="text-sm text-content-muted text-center py-6">
                  No hay paraclínicos. Agregue un examen.
                </p>
              ) : (
                <div className="space-y-3">
                  {paraFields.map((field, i) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-xl bg-bg-base"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs">Nombre examen</Label>
                        <Input
                          placeholder="Hemograma..."
                          {...register(`paraclínicos.${i}.nombre`)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Resultado</Label>
                        <Input
                          placeholder="Normal"
                          {...register(`paraclínicos.${i}.resultado`)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valor referencia</Label>
                        <Input
                          placeholder="4.5-11 x10³"
                          {...register(`paraclínicos.${i}.valorReferencia`)}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Checkbox
                            id={`anormal-${i}`}
                            onCheckedChange={(checked) =>
                              setValue(`paraclínicos.${i}.anormal`, checked as boolean)
                            }
                          />
                          <Label htmlFor={`anormal-${i}`} className="text-xs">
                            Anormal
                          </Label>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => paraRemove(i)}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 7: Diagnóstico */}
        <TabsContent value="diagnostico">
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Código CIE-10</Label>
                <Input
                  placeholder="Ej. Z00.0"
                  {...register('diagnostico.cie10')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción diagnóstica</Label>
                <Textarea
                  placeholder="Descripción del diagnóstico..."
                  rows={4}
                  {...register('diagnostico.descripcion')}
                />
              </div>
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 8: Conclusión */}
        <TabsContent value="conclusion">
          <Card>
            <CardHeader>
              <CardTitle>Conclusión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Aptitud laboral</Label>
                <Select
                  defaultValue="Apto"
                  onValueChange={(val) =>
                    setValue(
                      'conclusion.aptitud',
                      val as HistoriaLaboralFormData['conclusion']['aptitud']
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apto">Apto</SelectItem>
                    <SelectItem value="Apto con restricciones">
                      Apto con restricciones
                    </SelectItem>
                    <SelectItem value="No apto">No apto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Restricciones</Label>
                <Textarea
                  placeholder="Describa las restricciones si aplica..."
                  rows={3}
                  {...register('conclusion.restricciones')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Recomendaciones</Label>
                <Textarea
                  placeholder="Recomendaciones para el trabajador..."
                  rows={4}
                  {...register('conclusion.recomendaciones')}
                />
              </div>
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 9: Firma */}
        <TabsContent value="firma">
          <Card>
            <CardHeader>
              <CardTitle>Firma Médica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                <div className="space-y-2">
                  <p className="font-display text-2xl font-semibold text-content">
                    Dra. Alejandra Bárcenas
                  </p>
                  <p className="text-content-muted">Médico General</p>
                  <p className="text-content-muted text-sm">
                    Reg. Médico: XXXXX
                  </p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-content-muted">
                      Fecha:{' '}
                      {new Date().toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
          <NavButtons isLast />
        </TabsContent>
      </Tabs>
    </form>
  )
}
