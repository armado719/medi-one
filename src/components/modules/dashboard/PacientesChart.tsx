'use client'

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PacientesData {
  mes: string
  nuevos: number
  recurrentes: number
}

interface PacientesChartProps {
  data: PacientesData[]
}

export function PacientesChart({ data }: PacientesChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pacientes nuevos vs recurrentes</CardTitle>
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
        <CardTitle className="text-lg">Pacientes nuevos vs recurrentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
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
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {value === 'nuevos' ? 'Nuevos' : 'Recurrentes'}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="nuevos"
                stroke="#C8857A"
                strokeWidth={2}
                dot={{ r: 4, fill: '#C8857A' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="recurrentes"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
