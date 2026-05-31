'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { historiaCardiovascularSchema, type HistoriaCardiovascularFormData } from '@/validations/historia'
import { calculateIMC, getIMCCategory } from '@/lib/utils'
import { calculateFramingham } from '@/lib/framingham'
import type { ClinicalRecord } from '@/types'

interface HistoricalDataPoint {
  date: string
  peso: number | null
  tas: number | null
  glucosa: number | null
}

const TABS = [
  'signos',
  'lipidico',
  'habitos',
  'antecedentes',
  'framingham',
  'diagnostico',
  'graficas',
  'firma',
] as const

type TabValue = typeof TABS[number]

const TOTAL_TABS = TABS.length

export function HistoriaCardiovascular() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pacienteId = searchParams.get('pacienteId') || ''
  const [activeTab, setActiveTab] = useState<TabValue>('signos')
  const [framinghamResult, setFraminghamResult] = useState<{
    score: number
    riesgo: 'Bajo' | 'Moderado' | 'Alto'
    porcentaje: number
  } | null>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([])

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
    formState: { errors, isSubmitting },
  } = useForm<HistoriaCardiovascularFormData>({
    resolver: zodResolver(historiaCardiovascularSchema),
    defaultValues: {
      patientId: pacienteId,
      signosVitales: {
        tas: null,
        tad: null,
        fc: null,
        fr: null,
        temp: null,
        peso: null,
        talla: null,
        imc: null,
        glucosa: null,
      },
      perfilLipidico: {
        colesterolTotal: null,
        hdl: null,
        ldl: null,
        trigliceridos: null,
      },
      habitos: {
        tabaquismo: false,
        tabaquismoCuantos: '',
        alcohol: false,
        alcoholFrecuencia: '',
        actividadFisica: false,
        actividadFisicaTipo: '',
      },
      antecedentesFamiliares: {
        hta: false,
        dm: false,
        iam: false,
        acv: false,
        otros: '',
      },
      antecedentesPersonales: '',
      framingham: null,
      diagnostico: '',
      plan: '',
    },
  })

  const peso = watch('signosVitales.peso')
  const talla = watch('signosVitales.talla')
  const imc = peso && talla ? calculateIMC(peso, talla) : null

  const tabaquismo = watch('habitos.tabaquismo')
  const alcohol = watch('habitos.alcohol')
  const actividadFisica = watch('habitos.actividadFisica')

  // Fetch historical cardiovascular records for the patient
  const fetchHistorical = useCallback(async () => {
    if (!pacienteId) return
    try {
      const response = await fetch(
        `/api/historias?patientId=${pacienteId}&type=CARDIOVASCULAR`
      )
      if (!response.ok) return
      const records: ClinicalRecord[] = await response.json()
      const data: HistoricalDataPoint[] = records.map((r) => {
        const d = r.data as { signosVitales?: { tas?: number; peso?: number; glucosa?: number } }
        return {
          date: new Date(r.createdAt).toLocaleDateString('es-CO'),
          tas: d.signosVitales?.tas || null,
          peso: d.signosVitales?.peso || null,
          glucosa: d.signosVitales?.glucosa || null,
        }
      })
      setHistoricalData(data)
    } catch (error) {
      console.error('Error fetching historical data:', error)
    }
  }, [pacienteId])

  useEffect(() => {
    fetchHistorical()
  }, [fetchHistorical])

  const handleCalculateFramingham = () => {
    const values = watch()
    const colesterolTotal = values.perfilLipidico.colesterolTotal
    const hdl = values.perfilLipidico.hdl
    const tas = values.signosVitales.tas
    const smoker = values.habitos.tabaquismo
    const diabetes = values.antecedentesFamiliares.dm

    if (!colesterolTotal || !hdl || !tas) {
      toast.error('Complete colesterol total, HDL y TAS para calcular el score')
      return
    }

    // Use patient age 50 and sex MASCULINO as defaults if not available
    const result = calculateFramingham({
      age: 50,
      sex: 'MASCULINO',
      totalCholesterol: colesterolTotal,
      hdl,
      systolicBP: tas,
      smoker,
      diabetes,
    })

    setFraminghamResult(result)
    setValue('framingham', result)
    toast.success('Score Framingham calculado')
  }

  const onSubmit = async (data: HistoriaCardiovascularFormData) => {
    try {
      if (imc) {
        data.signosVitales.imc = imc
      }
      if (framinghamResult) {
        data.framingham = framinghamResult
      }

      const response = await fetch('/api/historias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: data.patientId,
          type: 'CARDIOVASCULAR',
          data,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Error al guardar la historia')
        return
      }

      toast.success('Historia cardiovascular guardada exitosamente')
      router.push(`/pacientes/${data.patientId}`)
    } catch {
      toast.error('Ocurrió un error inesperado')
    }
  }

  const riskBadgeVariant = framinghamResult
    ? framinghamResult.riesgo === 'Bajo'
      ? 'success'
      : framinghamResult.riesgo === 'Moderado'
      ? 'warning'
      : 'destructive'
    : 'secondary'

  /** Progress bar shown above the tab list */
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
      {/* Patient ID */}
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
          <TabsTrigger value="signos">1. Signos Vitales</TabsTrigger>
          <TabsTrigger value="lipidico">2. Perfil Lipídico</TabsTrigger>
          <TabsTrigger value="habitos">3. Hábitos</TabsTrigger>
          <TabsTrigger value="antecedentes">4. Antecedentes</TabsTrigger>
          <TabsTrigger value="framingham">5. Framingham</TabsTrigger>
          <TabsTrigger value="diagnostico">6. Diagnóstico</TabsTrigger>
          <TabsTrigger value="graficas">7. Gráficas</TabsTrigger>
          <TabsTrigger value="firma">8. Firma</TabsTrigger>
        </TabsList>

        {/* Tab 1: Signos Vitales */}
        <TabsContent value="signos">
          <Card>
            <CardHeader>
              <CardTitle>Signos Vitales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>TAS - Sistólica (mmHg)</Label>
                <Input
                  type="number"
                  min={60}
                  max={300}
                  placeholder="120"
                  {...register('signosVitales.tas', { valueAsNumber: true })}
                />
                {errors.signosVitales?.tas && (
                  <p className="text-xs text-red-500">{errors.signosVitales.tas.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>TAD - Diastólica (mmHg)</Label>
                <Input
                  type="number"
                  min={40}
                  max={200}
                  placeholder="80"
                  {...register('signosVitales.tad', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>FC (lpm)</Label>
                <Input
                  type="number"
                  min={30}
                  max={300}
                  placeholder="75"
                  {...register('signosVitales.fc', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>FR (rpm)</Label>
                <Input
                  type="number"
                  min={8}
                  max={60}
                  placeholder="16"
                  {...register('signosVitales.fr', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Temperatura (°C)</Label>
                <Input
                  type="number"
                  min={34}
                  max={42}
                  step="0.1"
                  placeholder="36.6"
                  {...register('signosVitales.temp', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Glucosa (mg/dL)</Label>
                <Input
                  type="number"
                  min={50}
                  max={600}
                  placeholder="90"
                  {...register('signosVitales.glucosa', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  step="0.1"
                  placeholder="70"
                  {...register('signosVitales.peso', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Talla (cm)</Label>
                <Input
                  type="number"
                  min={50}
                  max={250}
                  placeholder="170"
                  {...register('signosVitales.talla', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>IMC (auto-calculado)</Label>
                <div className="h-9 px-3 py-2 rounded-lg border border-border bg-bg-base text-sm flex items-center gap-2">
                  {imc ? (
                    <>
                      <span className="font-medium">{imc}</span>
                      <span className="text-content-muted text-xs">
                        {getIMCCategory(imc)}
                      </span>
                    </>
                  ) : (
                    <span className="text-content-muted">Auto-calculado</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 2: Perfil Lipídico */}
        <TabsContent value="lipidico">
          <Card>
            <CardHeader>
              <CardTitle>Perfil Lipídico</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Colesterol Total (mg/dL)</Label>
                <Input
                  type="number"
                  placeholder="200"
                  {...register('perfilLipidico.colesterolTotal', { valueAsNumber: true })}
                />
                <p className="text-xs text-content-muted">Deseable: &lt;200</p>
              </div>
              <div className="space-y-1.5">
                <Label>HDL (mg/dL)</Label>
                <Input
                  type="number"
                  placeholder="50"
                  {...register('perfilLipidico.hdl', { valueAsNumber: true })}
                />
                <p className="text-xs text-content-muted">Deseable: &gt;60</p>
              </div>
              <div className="space-y-1.5">
                <Label>LDL (mg/dL)</Label>
                <Input
                  type="number"
                  placeholder="130"
                  {...register('perfilLipidico.ldl', { valueAsNumber: true })}
                />
                <p className="text-xs text-content-muted">Óptimo: &lt;100</p>
              </div>
              <div className="space-y-1.5">
                <Label>Triglicéridos (mg/dL)</Label>
                <Input
                  type="number"
                  placeholder="150"
                  {...register('perfilLipidico.trigliceridos', { valueAsNumber: true })}
                />
                <p className="text-xs text-content-muted">Normal: &lt;150</p>
              </div>
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 3: Hábitos */}
        <TabsContent value="habitos">
          <Card>
            <CardHeader>
              <CardTitle>Hábitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tabaquismo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="tabaquismo"
                    checked={tabaquismo}
                    onCheckedChange={(checked) =>
                      setValue('habitos.tabaquismo', checked as boolean)
                    }
                  />
                  <Label htmlFor="tabaquismo" className="font-medium">
                    Tabaquismo
                  </Label>
                </div>
                {tabaquismo && (
                  <div className="ml-6 space-y-1.5">
                    <Label className="text-sm">¿Cuántos cigarrillos/día?</Label>
                    <Input
                      placeholder="Ej. 10 al día"
                      {...register('habitos.tabaquismoCuantos')}
                    />
                  </div>
                )}
              </div>

              {/* Alcohol */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="alcohol"
                    checked={alcohol}
                    onCheckedChange={(checked) =>
                      setValue('habitos.alcohol', checked as boolean)
                    }
                  />
                  <Label htmlFor="alcohol" className="font-medium">
                    Consumo de alcohol
                  </Label>
                </div>
                {alcohol && (
                  <div className="ml-6 space-y-1.5">
                    <Label className="text-sm">Frecuencia</Label>
                    <Input
                      placeholder="Ej. Ocasional, fines de semana..."
                      {...register('habitos.alcoholFrecuencia')}
                    />
                  </div>
                )}
              </div>

              {/* Actividad física */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="actividadFisica"
                    checked={actividadFisica}
                    onCheckedChange={(checked) =>
                      setValue('habitos.actividadFisica', checked as boolean)
                    }
                  />
                  <Label htmlFor="actividadFisica" className="font-medium">
                    Actividad física regular
                  </Label>
                </div>
                {actividadFisica && (
                  <div className="ml-6 space-y-1.5">
                    <Label className="text-sm">Tipo y frecuencia</Label>
                    <Input
                      placeholder="Ej. Caminar 30min, 3 veces/semana"
                      {...register('habitos.actividadFisicaTipo')}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 4: Antecedentes */}
        <TabsContent value="antecedentes">
          <Card>
            <CardHeader>
              <CardTitle>Antecedentes Cardiovasculares Familiares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'hta', label: 'HTA (Hipertensión)' },
                  { key: 'dm', label: 'DM (Diabetes)' },
                  { key: 'iam', label: 'IAM (Infarto)' },
                  { key: 'acv', label: 'ACV (Derrame cerebral)' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`af-${key}`}
                      onCheckedChange={(checked) => {
                        const afKey = key as 'hta' | 'dm' | 'iam' | 'acv'
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setValue(`antecedentesFamiliares.${afKey}` as any, checked as boolean)
                      }}
                    />
                    <Label htmlFor={`af-${key}`}>{label}</Label>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Otros antecedentes familiares</Label>
                <Textarea
                  placeholder="Otros antecedentes cardiovasculares familiares..."
                  {...register('antecedentesFamiliares.otros')}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Antecedentes Personales</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Antecedentes cardiovasculares personales, enfermedades previas..."
                rows={5}
                {...register('antecedentesPersonales')}
              />
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 5: Score Framingham */}
        <TabsContent value="framingham">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Score de Framingham</CardTitle>
              <Button
                type="button"
                variant="outline"
                onClick={handleCalculateFramingham}
              >
                Calcular Score
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-content-muted">
                Requiere: colesterol total, HDL y TAS (de las pestañas anteriores).
                El score calcula el riesgo de evento cardiovascular a 10 años.
              </p>

              {framinghamResult ? (
                <div className="p-6 rounded-xl bg-bg-base border border-border">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-4xl font-display font-bold text-content">
                        {framinghamResult.porcentaje}%
                      </p>
                      <p className="text-sm text-content-muted mt-1">
                        Riesgo a 10 años
                      </p>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-content">
                          Categoría de riesgo:
                        </span>
                        <Badge variant={riskBadgeVariant}>
                          {framinghamResult.riesgo}
                        </Badge>
                      </div>
                      <p className="text-sm text-content-muted">
                        Puntuación total: {framinghamResult.score} puntos
                      </p>
                      <div className="mt-2 text-xs text-content-muted">
                        <span className="inline-flex items-center gap-1 mr-3">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Bajo: &lt;10%
                        </span>
                        <span className="inline-flex items-center gap-1 mr-3">
                          <span className="w-2 h-2 rounded-full bg-yellow-500" />
                          Moderado: 10-20%
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Alto: &gt;20%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-bg-base border-2 border-dashed border-border text-center">
                  <p className="text-content-muted">
                    Complete el perfil lipídico y los signos vitales, luego presione
                    &quot;Calcular Score&quot;
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 6: Diagnóstico y Plan */}
        <TabsContent value="diagnostico">
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico y Plan de Manejo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Diagnóstico</Label>
                <Textarea
                  placeholder="Diagnóstico cardiovascular..."
                  rows={4}
                  {...register('diagnostico')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Plan de manejo</Label>
                <Textarea
                  placeholder="Plan de tratamiento, metas terapéuticas, seguimiento..."
                  rows={6}
                  {...register('plan')}
                />
              </div>
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 7: Gráficas de Evolución */}
        <TabsContent value="graficas">
          <Card>
            <CardHeader>
              <CardTitle>Evolución Histórica</CardTitle>
            </CardHeader>
            <CardContent>
              {historicalData.length < 2 ? (
                <div className="py-12 text-center">
                  <p className="text-content-muted">
                    Se necesitan al menos 2 registros históricos para mostrar la
                    gráfica de evolución.
                  </p>
                  <p className="text-sm text-content-muted mt-1">
                    Registros disponibles: {historicalData.length}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-content-muted mb-2">
                      Tensión Arterial Sistólica (mmHg)
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D5D3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="tas"
                          stroke="#C8857A"
                          strokeWidth={2}
                          dot={{ fill: '#C8857A' }}
                          name="TAS"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-content-muted mb-2">
                      Peso (kg) y Glucosa (mg/dL)
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D5D3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="peso"
                          stroke="#9B5E58"
                          strokeWidth={2}
                          dot={{ fill: '#9B5E58' }}
                          name="Peso (kg)"
                        />
                        <Line
                          type="monotone"
                          dataKey="glucosa"
                          stroke="#E8B4AD"
                          strokeWidth={2}
                          dot={{ fill: '#E8B4AD' }}
                          name="Glucosa (mg/dL)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 8: Firma */}
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
                  <p className="text-content-muted">Médico — Cardiovascular</p>
                  <p className="text-content-muted text-sm">Reg. Médico: XXXXX</p>
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
