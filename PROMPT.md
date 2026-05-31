# MEDI ONE — Software Médico Integral
## Cliente: Dra. Alejandra Bárcenas
## Especialidades: Medicina Laboral | Medicina Estética | Riesgo Cardiovascular
## Slogan: Salud Integral con Excelencia y Confianza

---

## INSTRUCCIONES GENERALES PARA LA IA

- Todo el sistema, incluyendo UI, mensajes de error, validaciones, tooltips, PDFs y comentarios de código, debe estar **100% en español**.
- Los nombres de variables, funciones, tipos y tablas de base de datos van en **inglés** (convención de código).
- Antes de crear un archivo nuevo, verificar si ya existe uno reutilizable.
- Confirmar con el usuario antes de eliminar cualquier registro (modal de confirmación).
- Validar todos los formularios con Zod antes de enviar al backend.
- Nunca eliminar registros físicamente — usar **soft delete** (`deletedAt: DateTime?`).
- Usar **Server Actions de Next.js 14** para mutaciones simples y **API Routes** para operaciones complejas o con archivos.
- Mensajes de error al usuario: tono neutral y directo. Ejemplo: `"El documento ya está registrado"`, no `"Error 409"`.

---

## STACK TECNOLÓGICO

### Frontend
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui (componentes base)
- React Hook Form + Zod (validación)
- Recharts (gráficas clínicas)
- TanStack Table v8 (tablas con paginación server-side)
- @react-pdf/renderer (generación de PDFs)
- SheetJS / xlsx (exportar Excel)
- Lucide Icons
- Sonner (toast notifications)
- date-fns (manejo de fechas, locale es)

### Backend
- Next.js API Routes
- Prisma ORM 5.x
- MySQL 8.x (via XAMPP)
- Multer o formidable (upload de archivos)

### Auth
- NextAuth.js v4 con CredentialsProvider
- Roles: `MEDICO`, `RECEPCIONISTA`, `ADMINISTRADOR`
- Sesión expira a las 8 horas
- Middleware de protección por ruta según rol

### Almacenamiento
- Fotos clínicas: carpeta `/public/uploads/pacientes/[id]/` en servidor local
- Archivos PDF generados: carpeta `/public/pdfs/` (temporal, se regeneran)

---

## VARIABLES DE ENTORNO (.env.example)

```env
# Base de datos
DATABASE_URL="mysql://root:@localhost:3306/medione"

# NextAuth
NEXTAUTH_SECRET="cambia-esta-clave-en-produccion"
NEXTAUTH_URL="http://localhost:3000"

# Almacenamiento
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE_MB=5

# App
APP_NAME="MEDI ONE"
APP_URL="http://localhost:3000"
```

---

## ESTRUCTURA DE CARPETAS

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Layout con sidebar
│   │   ├── dashboard/
│   │   ├── pacientes/
│   │   ├── agenda/
│   │   ├── historias/
│   │   │   ├── laboral/
│   │   │   ├── estetica/
│   │   │   └── cardiovascular/
│   │   ├── documentos/
│   │   │   ├── consentimientos/
│   │   │   └── formulas/
│   │   ├── facturacion/
│   │   ├── contabilidad/
│   │   ├── inventario/
│   │   └── configuracion/
│   └── api/
│       ├── auth/
│       ├── pacientes/
│       ├── citas/
│       ├── historias/
│       ├── facturas/
│       ├── inventario/
│       └── uploads/
├── components/
│   ├── ui/                     # shadcn/ui sin modificar
│   ├── shared/                 # Header, Sidebar, PageHeader, etc.
│   └── modules/                # Componentes por módulo
│       ├── pacientes/
│       ├── agenda/
│       ├── historias/
│       ├── facturacion/
│       └── ...
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── prisma.ts               # Singleton del cliente Prisma
│   ├── utils.ts                # cn(), formatCurrency(), etc.
│   ├── validations/            # Esquemas Zod por módulo
│   └── pdf/                    # Plantillas PDF por documento
├── hooks/                      # Custom hooks (useDebounce, usePaciente, etc.)
├── types/                      # TypeScript types e interfaces globales
└── prisma/
    ├── schema.prisma
    ├── migrations/
    └── seed.ts
```

---

## SISTEMA DE DISEÑO

### Paleta de colores (definir en tailwind.config.ts)

```ts
colors: {
  brand: {
    DEFAULT: '#C8857A',   // rose gold principal
    light:   '#E8B4AD',
    dark:    '#9B5E58',
  },
  bg: {
    base:    '#F8F4F3',   // fondo general
    surface: '#FDF0EE',   // tarjetas y paneles
  },
  content: {
    DEFAULT: '#3D1F1C',   // texto principal
    muted:   '#7A5A58',   // texto secundario
  },
  border:    '#E8D5D3',
}
```

### Tipografía (next/font)
- Títulos: `Cormorant_Garamond` — pesos 400, 600
- Cuerpo: `Plus_Jakarta_Sans` — pesos 400, 500, 600

### Estilo general
- Bordes redondeados: `rounded-xl` por defecto
- Sombras suaves: `shadow-sm`
- Sin bordes duros ni esquinas cuadradas
- Iconos: Lucide, tamaño base 18px
- Espaciado base: 4px (escala Tailwind estándar)

### Componentes base a configurar en shadcn/ui
- Button, Input, Select, Textarea, Checkbox, Switch
- Dialog (modales de confirmación y formularios)
- Table (base para TanStack)
- Badge (estados de citas, facturas)
- Card (dashboard, resúmenes)
- Tabs (historias clínicas con secciones)
- Calendar (agenda)
- Skeleton (loading states)
- Sonner (notificaciones toast)

---

## ESQUEMA DE BASE DE DATOS (Prisma)

### Relaciones principales
```
User (1) ──────── (N) AuditLog
Patient (1) ────── (N) Appointment
Patient (1) ────── (N) ClinicalRecord (tipo: LABORAL | ESTETICA | CARDIOVASCULAR)
Patient (1) ────── (N) Invoice
Patient (1) ────── (1) ProfilePhoto
ClinicalRecord (1) ─── (N) ClinicalPhoto (solo ESTETICA)
ClinicalRecord (1) ─── (1) Invoice (opcional)
ClinicalRecord (1) ─── (N) ConsentForm
Invoice (1) ──────── (N) InvoiceItem
Invoice (1) ──────── (1) Payment
Product (1) ──────── (N) InventoryMovement
ClinicalRecord (N) ── (N) Product (uso de insumos)
```

### Campos obligatorios en todos los modelos
```prisma
id        String   @id @default(cuid())
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
deletedAt DateTime?   // soft delete — nunca borrar físicamente
```

### Enums
```prisma
enum Role             { MEDICO RECEPCIONISTA ADMINISTRADOR }
enum AppointmentStatus { CONFIRMADA PENDIENTE CANCELADA NO_ASISTIO }
enum RecordType       { LABORAL ESTETICA CARDIOVASCULAR }
enum AptitudResult    { APTO APTO_CON_RESTRICCIONES NO_APTO }
enum InvoiceStatus    { PENDIENTE PAGADO ANULADO }
enum PaymentMethod    { EFECTIVO TRANSFERENCIA TARJETA }
enum MovementType     { ENTRADA SALIDA AJUSTE }
```

---

## MÓDULOS DEL SISTEMA

### 1. PACIENTES

**Campos del formulario** *(actualizado v2 — basado en referencias visuales de software médico colombiano)*:

| Campo | Tipo | Validación |
|-------|------|-----------|
| Primer nombre | text | requerido, mín 2 caracteres |
| Segundo nombre | text | opcional |
| Primer apellido | text | requerido, mín 2 caracteres |
| Segundo apellido | text | opcional |
| Tipo documento | select (CC, CE, PA, TI, RC) | requerido |
| Número documento | text | requerido, único, solo números, 6-12 dígitos |
| Fecha de nacimiento | date | requerido, no puede ser futura |
| Edad | calculada automáticamente | solo lectura |
| Sexo | select (Masculino, Femenino, Otro) | requerido |
| Estado civil | select (Soltero/a, Casado/a, Unión libre, Divorciado/a, Viudo/a) | opcional |
| Teléfono | text | requerido, formato colombiano: 10 dígitos, empieza en 3 |
| Teléfono alternativo | text | opcional |
| Email | email | opcional, formato válido |
| Zona | select (Urbana, Rural) | opcional |
| Departamento | select (listado departamentos Colombia) | opcional |
| Municipio | text (dependiente del departamento) | opcional |
| Dirección | text | opcional |
| EPS | text | opcional |
| Ocupación | text | opcional |
| Religión | text | opcional |
| Responsable / Contacto de emergencia | text | opcional |
| Parentesco del responsable | select | opcional |
| Teléfono del responsable | text | opcional |
| Observaciones generales | textarea | opcional |
| Estado | toggle (Activo/Inactivo) | default: Activo |

**Vista de detalle del paciente** *(mejorada v2)*:
- Tarjetas de alerta destacadas al tope del perfil:
  - 🟡 **Observaciones importantes** — resaltadas en amarillo
  - 🔴 **Alergias** — resaltadas en rosa/rojo
  - 🔵 **Medicamentos actuales** — resaltadas en azul claro
- Timeline visual de consultas: íconos por tipo (L=Laboral, E=Estética, C=Cardiovascular) en línea horizontal con fecha y médico — al hacer clic se despliega el resumen
- Sidebar derecho en el detalle: listado de citas con fecha, código y valor (como referencia visual)

**Comportamiento:**
- Búsqueda en tiempo real por nombre o documento (debounce 300ms)
- Paginación: 20 registros por página (server-side)
- Al desactivar un paciente, sus citas futuras se cancelan automáticamente con aviso
- Foto de perfil: JPG/PNG, máx 2MB, se recorta a cuadrado

**Errores esperados:**
- Documento duplicado → `"Ya existe un paciente con este número de documento"`
- Foto muy grande → `"La imagen no puede superar 2MB"`

---

### 2. AGENDA DE CITAS

**Vistas:** Mes / Semana / Día (usando react-big-calendar o similar compatible con shadcn)

**Campos de cita** *(actualizado v2)*:
| Campo | Validación |
|-------|-----------|
| Paciente | requerido, buscar por nombre/documento |
| Fecha y hora | requerido, no puede ser en el pasado |
| Duración | select: 15, 30, 45, 60, 90 min |
| Tipo de consulta | select: Laboral, Estética, Cardiovascular, Control |
| Médico asignado | requerido |
| Primera vez | checkbox (paciente nuevo vs recurrente) |
| Valor de la consulta | número, opcional (pre-llena factura) |
| Descuento | número, opcional |
| Consulta prioritaria | checkbox (para triaje) |
| Notas | opcional, máx 500 caracteres |

**Comportamiento:**
- Validar que no haya citas solapadas para el mismo médico
- Si hay solapamiento → `"El médico ya tiene una cita en ese horario"`
- **Panel lateral derecho** al seleccionar cita: muestra detalle sin cerrar el calendario (Paciente, Médico, Fecha, Hora, Estado, Valor) con botones de acción
- Filtros encima del calendario: por médico, por tipo de consulta
- Botones de vista: Mes / Semana / Día / Lista
- Cambio de estado con un clic desde el panel lateral
- Campo "recordatorio WhatsApp" guardado pero sin lógica de envío (placeholder para integración futura)

---

### 3. HISTORIAS CLÍNICAS

**Regla general:** Solo el rol `MEDICO` y `ADMINISTRADOR` pueden crear/editar/ver historias clínicas.

Cada historia queda vinculada a: `pacienteId`, `medicoId`, `fecha`, `tipo`.

#### 3.1 Historia Médica Laboral

**Secciones (usar Tabs):**
1. **Datos laborales:** empresa, NIT empresa, cargo, área, tiempo laborando
2. **Tipo de examen:** Ingreso / Periódico / Retiro / Post-incapacidad
3. **Riesgos ocupacionales:** checkboxes múltiples (físico, químico, biológico, ergonómico, psicosocial, mecánico, eléctrico) + campo de descripción por riesgo marcado
4. **Antecedentes:** personales (patológicos, quirúrgicos, traumáticos, tóxicos, farmacológicos) y familiares — campos de texto libre
5. **Revisión por sistemas:** checkbox + textarea por sistema (cardiovascular, respiratorio, digestivo, neurológico, osteomuscular, genitourinario, piel)
6. **Examen físico:** campos numéricos para signos vitales + textarea por sistema examinado
7. **Paraclínicos:** tabla dinámica (nombre del examen, resultado, valor referencia, anormal: sí/no)
8. **Diagnóstico:** buscador CIE-10 con autocompletado + campo de descripción libre
9. **Conclusión:** select (Apto / Apto con restricciones / No apto) + textarea de restricciones + textarea de recomendaciones
10. **Firma:** nombre del médico, registro médico, fecha — generado desde configuración del sistema

**PDF generado debe incluir:** membrete, todos los campos, sello de aptitud destacado, firma.

#### 3.2 Historia Médica Estética

**Secciones:**
1. **Motivo de consulta:** textarea libre
2. **Antecedentes:** alergias conocidas, medicamentos actuales, cirugías previas, enfermedades crónicas
3. **Zonas a tratar:** checkboxes (rostro, cuello, escote, abdomen, brazos, piernas, glúteos, otro) + descripción
4. **Procedimiento:** nombre del procedimiento, técnica utilizada, duración
5. **Materiales usados:** tabla dinámica (producto, marca, lote, cantidad usada) — descuenta automáticamente del inventario al guardar
6. **Fotografías clínicas:** upload múltiple categorizado (Antes / Durante / Después), máx 5 fotos por categoría, JPG/PNG, máx 3MB c/u
7. **Evolución:** textarea, campo de próxima cita recomendada (fecha)
8. **Consentimiento informado:** selector de plantilla + estado (Firmado / Pendiente)
9. **Firma:** igual que laboral

#### 3.3 Historia Riesgo Cardiovascular

**Campos con validación numérica:**
| Campo | Unidad | Rango válido |
|-------|--------|-------------|
| Peso | kg | 20 – 300 |
| Talla | cm | 100 – 220 |
| IMC | calculado automático | solo lectura |
| TA Sistólica | mmHg | 60 – 250 |
| TA Diastólica | mmHg | 40 – 150 |
| Frecuencia cardíaca | lpm | 30 – 220 |
| Glucosa en ayunas | mg/dL | 50 – 600 |
| Colesterol total | mg/dL | 50 – 600 |
| HDL | mg/dL | 10 – 200 |
| LDL | mg/dL | 10 – 400 |
| Triglicéridos | mg/dL | 30 – 3000 |
| Perímetro abdominal | cm | 40 – 200 |

**Score de Framingham (calcular automáticamente):**
Usar la ecuación de Framingham 1998 (Wilson et al.):
- Variables: edad, sexo, colesterol total, HDL, TA sistólica, tabaquismo (sí/no), diabetes (sí/no)
- Resultado: porcentaje de riesgo a 10 años
- Categorías: Bajo (<10%), Moderado (10–20%), Alto (>20%)
- Mostrar resultado con color: verde / amarillo / rojo

**Gráficas de evolución** (Recharts, LineChart):
- Mostrar histórico de todas las consultas cardiovasculares del paciente
- Gráficas separadas para: Peso, IMC, TA Sistólica/Diastólica (en la misma gráfica), Glucosa, Colesterol total

---

### 4. DOCUMENTOS

#### 4.1 Consentimientos Informados
- Plantillas editables almacenadas en BD (campo `content` tipo TEXT con HTML simple)
- Al generar PDF, se reemplazan variables: `{{nombre_paciente}}`, `{{fecha}}`, `{{procedimiento}}`, `{{medico}}`
- Estado: Pendiente firma / Firmado (checkbox de confirmación digital)
- Vinculado a historia estética

#### 4.2 Fórmulas Médicas
**Campos:**
- Tabla dinámica de medicamentos: nombre, concentración, forma farmacéutica, dosis, frecuencia, duración, vía de administración
- Indicaciones generales (textarea)
- Diagnóstico relacionado

**PDF:** membrete completo, tabla de medicamentos, indicaciones, firma del médico.

---

### 5. FACTURACIÓN

**Numeración:** `FAC-YYYY-NNNN` (ej: `FAC-2025-0001`), consecutivo automático por año.

**Campos:**
- Paciente vinculado (requerido)
- Consulta/procedimiento vinculado (opcional)
- Fecha de emisión
- Tabla de ítems: descripción, cantidad, valor unitario, % IVA (0%, 5%, 19%), subtotal
- Descuento global (% o valor fijo)
- Total calculado automáticamente
- Método de pago
- Notas

**Comportamiento:**
- No se puede editar una factura en estado `PAGADO` o `ANULADO`
- Anular factura requiere motivo de anulación (campo obligatorio al anular)
- Al marcar como pagado, registra automáticamente en Contabilidad como ingreso

**PDFs:**
- Factura: membrete, ítems, totales, método de pago
- Recibo de pago: más simple, confirma el pago

---

### 6. CONTABILIDAD

**Solo rol `ADMINISTRADOR` tiene acceso.**

**Movimientos se generan automáticamente desde:**
- Factura pagada → Ingreso
- Egreso manual registrado directamente en este módulo

**Vista principal:** tabla con filtros:
- Rango de fechas (date picker)
- Tipo: Ingreso / Egreso
- Estado
- Médico

**Resumen siempre visible:** tarjetas con Total Ingresos, Total Egresos, Utilidad Neta del período filtrado.

**Exportar Excel:** columnas → Fecha, Tipo, Descripción, Paciente, Médico, Monto, Estado.

---

### 7. INVENTARIO

**Alertas:** si `stockActual <= stockMinimo` → badge rojo visible en sidebar y en la tabla.

**Descuento automático:** al guardar una Historia Estética con materiales usados, descontar de stock. Si el stock resultante quedaría negativo → advertencia al médico (no bloquear, solo advertir).

**Movimientos:** cada entrada/salida/ajuste queda registrada con: fecha, tipo, cantidad, motivo, usuario que registró.

---

### 8. DASHBOARD

**Rol `RECEPCIONISTA` ve solo:** próximas citas del día + resumen de citas (no ingresos ni datos financieros).

**Rol `MEDICO` ve:** citas del día + pacientes atendidos + últimas historias creadas.

**Rol `ADMINISTRADOR` ve:** todo el dashboard completo.

**Widgets:**
- Citas de hoy (lista con estado + botón acción rápida)
- Ingresos del mes (número + comparativa con mes anterior)
- Pacientes nuevos este mes
- Gráfica de ingresos últimos 6 meses (Recharts BarChart)
- Procedimientos más realizados (top 5, Recharts PieChart)
- Alertas activas: inventario bajo, facturas pendientes >7 días

---

## ROLES Y PERMISOS (detallado)

| Módulo | MEDICO | RECEPCIONISTA | ADMINISTRADOR |
|--------|--------|---------------|---------------|
| Pacientes — ver | ✅ | ✅ | ✅ |
| Pacientes — crear/editar | ✅ | ✅ | ✅ |
| Pacientes — desactivar | ❌ | ❌ | ✅ |
| Agenda — ver/crear/editar | ✅ | ✅ | ✅ |
| Agenda — cancelar cita | ✅ | ✅ | ✅ |
| Historias — ver | ✅ | ❌ | ✅ |
| Historias — crear/editar | ✅ | ❌ | ✅ |
| Documentos — ver/generar | ✅ | ❌ | ✅ |
| Facturación — ver | ❌ | ✅ | ✅ |
| Facturación — crear/editar | ❌ | ✅ | ✅ |
| Facturación — anular | ❌ | ❌ | ✅ |
| Contabilidad — todo | ❌ | ❌ | ✅ |
| Inventario — ver | ❌ | ✅ | ✅ |
| Inventario — crear/editar | ❌ | ✅ | ✅ |
| Configuración — todo | ❌ | ❌ | ✅ |
| Dashboard — completo | ❌ | ❌ | ✅ |
| Dashboard — citas del día | ✅ | ✅ | ✅ |
| Dashboard — finanzas | ❌ | ❌ | ✅ |

---

## MANEJO DE ERRORES Y CASOS LÍMITE

| Situación | Comportamiento |
|-----------|---------------|
| Cita solapada con otra del mismo médico | Bloquear y mostrar `"El médico ya tiene una cita de HH:mm a HH:mm"` |
| Documento de paciente duplicado | Bloquear y mostrar `"Ya existe un paciente con este documento"` |
| Stock de producto en negativo al usar en historia | Advertir pero permitir guardar |
| Eliminar paciente con historial | Bloquear: `"No se puede eliminar un paciente con registros clínicos"` |
| Sesión expirada | Redirigir a `/login` con mensaje `"Tu sesión ha expirado"` |
| Archivo de foto muy grande | `"La imagen no puede superar XMB"` |
| Factura pagada siendo editada | Bloquear todos los campos, solo permitir ver |
| Anular factura sin motivo | Bloquear hasta ingresar motivo |
| Campo numérico fuera de rango | `"El valor debe estar entre X y Y"` |
| Sin conexión a la BD | Página de error con `"Error de conexión. Contacta al administrador"` |

---

## CONFIGURACIÓN DEL SISTEMA

Accesible solo para `ADMINISTRADOR`. Secciones:

1. **Datos del consultorio:** nombre, dirección, teléfono, NIT, ciudad
2. **Datos de la doctora:** nombre completo, especialidades, registro médico, imagen de firma (PNG con fondo transparente)
3. **Logo:** imagen del consultorio (usada en PDFs y sidebar)
4. **Usuarios:** listar, crear, editar, activar/desactivar usuarios del sistema
5. **Tarifas:** lista de procedimientos con nombre y precio base
6. **Plantillas de consentimientos:** editor de texto HTML básico
7. **Backup:** botón que genera enlace de descarga de instrucciones para exportar desde phpMyAdmin

---

## AUDITORÍA

Tabla `AuditLog` con campos:
```
userId, action (CREATE|UPDATE|DELETE|VIEW), entity, entityId, changes (JSON diff), ip, timestamp
```
Registrar automáticamente: toda creación/edición de historia clínica, toda factura creada/anulada, todo acceso a historia clínica.

---

## INFRAESTRUCTURA LOCAL (XAMPP)

- Puerto Next.js: `3000`
- Puerto MySQL: `3306`
- DB name: `medione`
- Acceso en red local: `http://[IP-DEL-SERVIDOR]:3000`
- Fotos: `/public/uploads/pacientes/[patientId]/`
- Backup: manual desde phpMyAdmin → exportar `.sql`
- Backup automático sugerido: script Node.js con `mysqldump` ejecutado con `node-cron` cada noche a las 2am, guardando en `/backups/`

---

## FASE DE DESARROLLO

### Fase 1 — MVP ✅ COMPLETADA
- [x] Setup completo: Next.js + Prisma + MySQL + NextAuth funcionando
- [x] Login con 3 roles, redirección según rol
- [x] CRUD completo de Pacientes con búsqueda y paginación
- [x] Los 3 formularios de Historia Clínica guardando en BD
- [x] Agenda con calendario visual, crear y editar citas
- [x] Layout con sidebar, colores y tipografía del sistema de diseño
- [x] Sistema de PDF e impresión con membrete en historias clínicas

### Fase 2 — EN PROGRESO
- [ ] Facturación con PDF y numeración consecutiva (FAC-YYYY-NNNN)
- [ ] Consentimientos informados con PDF y variables dinámicas
- [ ] Fórmulas médicas con PDF membretado
- [ ] Módulo de Inventario con alertas y descuento automático

### Fase 3
- [ ] Contabilidad con filtros y exportar Excel
- [ ] Dashboard con todos los widgets y gráficas
- [ ] Módulo de Configuración completo
- [ ] AuditLog implementado
- [ ] Script de backup automático nocturno

---

## MEJORAS UX/UI — REFERENCIAS VISUALES (v2)

Identificadas analizando software médico colombiano de referencia:

### Formulario de Paciente
- Dividir nombres/apellidos en 4 campos separados: Primer nombre, Segundo nombre, Primer apellido, Segundo apellido (estándar Colombia)
- Agregar campo **Zona** (Urbana / Rural)
- Agregar selector **Departamento → Municipio** en cascada
- Agregar **Responsable / Contacto de emergencia** con parentesco y teléfono
- Agregar campo **Estado civil**
- Agregar campo **Religión** (opcional)

### Perfil del Paciente (vista detalle)
- **3 tarjetas de alerta** siempre visibles al tope: Observaciones (amarillo), Alergias (rosa), Medicamentos actuales (azul)
- **Timeline horizontal** de consultas con íconos por tipo y fechas — al hacer clic se expande el resumen de esa consulta
- **Panel lateral** de citas con historial de fechas y valores

### Agenda
- **Panel lateral derecho** al seleccionar cita (sin modal) — muestra detalle completo con botones de acción
- **Filtros encima del calendario**: por médico, por tipo de consulta
- **Vista Lista** además de Mes/Semana/Día
- En el formulario de cita: agregar **Primera vez** (checkbox), **Valor de consulta**, **Prioridad**

### Historias Clínicas
- Tabs numerados tipo "1 de 9", "2 de 9" — el usuario sabe cuántas secciones quedan
- Sección de **hábitos** (tabaco, alcohol, actividad física) con botones visuales tipo toggle, no solo checkbox
- Botones **Imprimir** y **Descargar PDF** siempre visibles en la barra superior de cada historia ✅ (ya implementado)

### Dashboard
- 4 tarjetas de color grande con número + ícono + título (estilo SuitePsy)
- Accesos directos rápidos a módulos principales desde la pantalla de inicio

### PDFs
- Todos los PDFs llevan membrete MEDI ONE con colores rose gold ✅ (ya implementado)
- Fórmula médica: pie de página "Válida por 30 días desde la fecha de emisión"
- Factura: sello "PAGADO" en verde cuando el estado es pagado

---

**Empezar siempre por la Fase 1 en el orden listado. No avanzar a la siguiente fase sin completar los criterios de aceptación de la anterior.**
