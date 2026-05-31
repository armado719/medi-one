'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProcedimientoData {
  nombre: string
  total: number
}

interface ProcedimientosChartProps {
  data: ProcedimientoData[]
}

const BRAND_COLORS = ['#C8857A', '#D9A09A', '#A06058', '#E8C0BB', '#7A453F']

const TYPE_LABELS: Record<string, string> = {
  LABORAL: 'Medicina Laboral',
  ESTETICA: 'Estética',
  CARDIOVASCULAR: 'Cardiovascular',
  CONTROL: 'Control',
}

export function ProcedimientosChart({ data }: ProcedimientosChartProps) {
  const chartData = data.map((d) => ({
    name: TYPE_LABELS[d.nombre] ?? d.nombre,
    value: d.total,
  }))

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Procedimientos más realizados</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-content-muted text-sm">No hay datos para mostrar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Procedimientos más realizados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BRAND_COLORS[index % BRAND_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value, 'Procedimientos']}
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.75rem',
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
