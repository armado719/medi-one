'use client'

import { useState, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Upload, X, Image } from 'lucide-react'
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
import { historiaEsteticaSchema, type HistoriaEsteticaFormData } from '@/validations/historia'

const ZONAS = [
  { key: 'rostro', label: 'Rostro' },
  { key: 'cuello', label: 'Cuello' },
  { key: 'escote', label: 'Escote' },
  { key: 'abdomen', label: 'Abdomen' },
  { key: 'brazos', label: 'Brazos' },
  { key: 'piernas', label: 'Piernas' },
  { key: 'gluteos', label: 'Glúteos' },
  { key: 'otro', label: 'Otro' },
]

type FotoCategoria = 'Antes' | 'Durante' | 'Después'
const FOTO_CATEGORIAS: FotoCategoria[] = ['Antes', 'Durante', 'Después']

interface PreviewPhoto {
  url: string
  categoria: FotoCategoria
  nombre: string
  file?: File
}

const TABS = [
  'motivo',
  'antecedentes',
  'zonas',
  'procedimiento',
  'materiales',
  'fotografias',
  'evolucion',
  'consentimiento',
  'firma',
] as const

type TabValue = typeof TABS[number]

const TOTAL_TABS = TABS.length

export function HistoriaEstetica() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pacienteId = searchParams.get('pacienteId') || ''
  const [activeTab, setActiveTab] = useState<TabValue>('motivo')
  const [photos, setPhotos] = useState<PreviewPhoto[]>([])
  const [selectedCategory, setSelectedCategory] = useState<FotoCategoria>('Antes')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  } = useForm<HistoriaEsteticaFormData>({
    resolver: zodResolver(historiaEsteticaSchema),
    defaultValues: {
      patientId: pacienteId,
      motivoConsulta: '',
      antecedentes: {
        alergias: '',
        medicamentosActuales: '',
        cirugiasPrevias: '',
        enfermedadesCronicas: '',
      },
      zonasTratar: {
        rostro: false,
        cuello: false,
        escote: false,
        abdomen: false,
        brazos: false,
        piernas: false,
        gluteos: false,
        otro: false,
        descripcion: '',
      },
      procedimiento: { nombre: '', tecnica: '', duracion: '' },
      materialesUsados: [],
      fotografias: [],
      evolucion: { descripcion: '', proximaCita: '' },
      consentimiento: { estado: 'Pendiente' },
    },
  })

  const { fields: matFields, append: matAppend, remove: matRemove } = useFieldArray({
    control,
    name: 'materialesUsados',
  })

  const zonasWatched = watch('zonasTratar')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newPhotos: PreviewPhoto[] = files.map((file) => ({
      url: URL.createObjectURL(file),
      categoria: selectedCategory,
      nombre: file.name,
      file,
    }))
    setPhotos((prev) => [...prev, ...newPhotos])
    setValue(
      'fotografias',
      [...photos, ...newPhotos].map((p) => ({
        url: p.url,
        categoria: p.categoria,
        nombre: p.nombre,
      }))
    )
  }

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index)
    setPhotos(updated)
    setValue(
      'fotografias',
      updated.map((p) => ({ url: p.url, categoria: p.categoria, nombre: p.nombre }))
    )
  }

  const onSubmit = async (data: HistoriaEsteticaFormData) => {
    try {
      const response = await fetch('/api/historias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: data.patientId,
          type: 'ESTETICA',
          data,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Error al guardar la historia')
        return
      }

      toast.success('Historia estética guardada exitosamente')
      router.push(`/pacientes/${data.patientId}`)
    } catch {
      toast.error('Ocurrió un error inesperado')
    }
  }

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
          <TabsTrigger value="motivo">1. Motivo</TabsTrigger>
          <TabsTrigger value="antecedentes">2. Antecedentes</TabsTrigger>
          <TabsTrigger value="zonas">3. Zonas</TabsTrigger>
          <TabsTrigger value="procedimiento">4. Procedimiento</TabsTrigger>
          <TabsTrigger value="materiales">5. Materiales</TabsTrigger>
          <TabsTrigger value="fotografias">6. Fotografías</TabsTrigger>
          <TabsTrigger value="evolucion">7. Evolución</TabsTrigger>
          <TabsTrigger value="consentimiento">8. Consentimiento</TabsTrigger>
          <TabsTrigger value="firma">9. Firma</TabsTrigger>
        </TabsList>

        {/* Tab 1: Motivo de consulta */}
        <TabsContent value="motivo">
          <Card>
            <CardHeader>
              <CardTitle>Motivo de Consulta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label>
                  Motivo de consulta <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="Describa el motivo de consulta del paciente..."
                  rows={6}
                  {...register('motivoConsulta')}
                />
                {errors.motivoConsulta && (
                  <p className="text-xs text-red-500">{errors.motivoConsulta.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 2: Antecedentes */}
        <TabsContent value="antecedentes">
          <Card>
            <CardHeader>
              <CardTitle>Antecedentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Alergias</Label>
                <Textarea
                  placeholder="Alergias conocidas..."
                  {...register('antecedentes.alergias')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Medicamentos actuales</Label>
                <Textarea
                  placeholder="Medicamentos que toma actualmente..."
                  {...register('antecedentes.medicamentosActuales')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cirugías previas</Label>
                <Textarea
                  placeholder="Cirugías previas relevantes..."
                  {...register('antecedentes.cirugiasPrevias')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Enfermedades crónicas</Label>
                <Textarea
                  placeholder="Diabetes, hipertensión, etc..."
                  {...register('antecedentes.enfermedadesCronicas')}
                />
              </div>
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 3: Zonas a Tratar */}
        <TabsContent value="zonas">
          <Card>
            <CardHeader>
              <CardTitle>Zonas a Tratar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ZONAS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`zona-${key}`}
                      checked={zonasWatched?.[key as keyof typeof zonasWatched] === true}
                      onCheckedChange={(checked) => {
                        const zonaKey = key as 'rostro' | 'cuello' | 'escote' | 'abdomen' | 'brazos' | 'piernas' | 'gluteos' | 'otro'
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setValue(`zonasTratar.${zonaKey}` as any, checked as boolean)
                      }}
                    />
                    <Label htmlFor={`zona-${key}`}>{label}</Label>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Descripción adicional</Label>
                <Textarea
                  placeholder="Describa las zonas específicas a tratar..."
                  {...register('zonasTratar.descripcion')}
                />
              </div>
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 4: Procedimiento */}
        <TabsContent value="procedimiento">
          <Card>
            <CardHeader>
              <CardTitle>Procedimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre del procedimiento</Label>
                <Input
                  placeholder="Ej. Toxina botulínica, Ácido hialurónico..."
                  {...register('procedimiento.nombre')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Técnica utilizada</Label>
                <Textarea
                  placeholder="Descripción de la técnica..."
                  {...register('procedimiento.tecnica')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duración del procedimiento</Label>
                <Input
                  placeholder="Ej. 45 minutos"
                  {...register('procedimiento.duracion')}
                />
              </div>
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 5: Materiales */}
        <TabsContent value="materiales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Materiales Usados</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  matAppend({ producto: '', marca: '', lote: '', cantidad: '' })
                }
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar material
              </Button>
            </CardHeader>
            <CardContent>
              {matFields.length === 0 ? (
                <p className="text-sm text-content-muted text-center py-6">
                  No hay materiales registrados.
                </p>
              ) : (
                <div className="space-y-3">
                  {matFields.map((field, i) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-xl bg-bg-base"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs">Producto</Label>
                        <Input
                          placeholder="Nombre del producto"
                          {...register(`materialesUsados.${i}.producto`)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Marca</Label>
                        <Input
                          placeholder="Marca"
                          {...register(`materialesUsados.${i}.marca`)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Lote</Label>
                        <Input
                          placeholder="# Lote"
                          {...register(`materialesUsados.${i}.lote`)}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Cantidad</Label>
                          <Input
                            placeholder="Cantidad"
                            {...register(`materialesUsados.${i}.cantidad`)}
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => matRemove(i)}
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

        {/* Tab 6: Fotografías */}
        <TabsContent value="fotografias">
          <Card>
            <CardHeader>
              <CardTitle>Fotografías Clínicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload area */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label>Categoría</Label>
                  <div className="flex gap-2">
                    {FOTO_CATEGORIAS.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedCategory === cat
                            ? 'bg-brand text-white'
                            : 'bg-bg-base text-content-muted hover:bg-bg-surface'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-brand transition-colors"
                >
                  <Upload className="w-8 h-8 text-content-muted mx-auto mb-2" />
                  <p className="text-sm text-content-muted">
                    Haga clic para seleccionar fotos
                  </p>
                  <p className="text-xs text-content-muted mt-1">
                    Categoría: <strong>{selectedCategory}</strong>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Photos by category */}
              {FOTO_CATEGORIAS.map((cat) => {
                const catPhotos = photos.filter((p) => p.categoria === cat)
                if (catPhotos.length === 0) return null
                return (
                  <div key={cat}>
                    <p className="text-sm font-medium text-content-muted mb-2">{cat}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {catPhotos.map((photo, idx) => {
                        const globalIdx = photos.indexOf(photo)
                        return (
                          <div
                            key={idx}
                            className="relative rounded-xl overflow-hidden border border-border aspect-square"
                          >
                            <img
                              src={photo.url}
                              alt={photo.nombre}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(globalIdx)}
                              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                              {photo.nombre}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {photos.length === 0 && (
                <div className="flex items-center justify-center gap-2 py-4 text-content-muted">
                  <Image className="w-5 h-5" />
                  <p className="text-sm">Sin fotografías adjuntas</p>
                </div>
              )}
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 7: Evolución */}
        <TabsContent value="evolucion">
          <Card>
            <CardHeader>
              <CardTitle>Evolución</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Descripción de la evolución</Label>
                <Textarea
                  placeholder="Evolución post-procedimiento..."
                  rows={5}
                  {...register('evolucion.descripcion')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Próxima cita recomendada</Label>
                <Input
                  type="date"
                  {...register('evolucion.proximaCita')}
                />
              </div>
            </CardContent>
          </Card>
          <NavButtons />
        </TabsContent>

        {/* Tab 8: Consentimiento */}
        <TabsContent value="consentimiento">
          <Card>
            <CardHeader>
              <CardTitle>Consentimiento Informado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-bg-base border border-border">
                <p className="text-sm text-content-muted">
                  Plantilla de consentimiento — [TODO: Seleccionar plantilla]
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Estado del consentimiento</Label>
                <Select
                  defaultValue="Pendiente"
                  onValueChange={(val) =>
                    setValue(
                      'consentimiento.estado',
                      val as HistoriaEsteticaFormData['consentimiento']['estado']
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Firmado">Firmado</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
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
                  <p className="text-content-muted">Médico — Estética</p>
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
