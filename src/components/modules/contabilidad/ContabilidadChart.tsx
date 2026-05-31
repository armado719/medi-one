'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { ContabilidadEntry } from './ContabilidadTable'
import { formatDate } from '@/lib/utils'

interface ContabilidadChartProps {
  entries: ContabilidadEntry[]
}

function buildChartData(entries: ContabilidadEntry[]) {
  // Group by date (day)
  const map = new Map<string, { label: string; ingresos: number; egresos: number }>()

  entries.forEach((e) => {
    const day = formatDate(e.date, 'd MMM')
    if (!map.has(day)) {
      map.set(day, { label: day, ingresos: 0, egresos: 0 })
    }
    const item = map.get(day)!
    if (e.type === 'INGRESO') item.ingresos += e.amount
    else item.egresos += e.amount
  })

  return Array.from(map.values()).reverse()
}

export function ContabilidadChart({ entries }: ContabilidadChartProps) {
  const data = buildChartData(entries)

  if (data.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evolución ingresos vs egresos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="gradIngreso" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradEgreso" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000000
                    ? `$${(v / 1000000).toFixed(1)}M`
                    : v >= 1000
                    ? `$${(v / 1000).toFixed(0)}K`
                    : `$${v}`
                }
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
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
                    {value === 'ingresos' ? 'Ingresos' : 'Egresos'}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#gradIngreso)"
              />
              <Area
                type="monotone"
                dataKey="egresos"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#gradEgreso)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
