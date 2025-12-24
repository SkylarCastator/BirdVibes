import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HourlyPoint } from '@/lib/types'

interface HourlyChartProps {
  data: HourlyPoint[]
  isLoading?: boolean
}

export function HourlyChart({ data, isLoading }: HourlyChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity by Hour</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </CardContent>
      </Card>
    )
  }

  // Fill in missing hours with 0
  const fullData = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    const existing = data.find(d => d.hour === hour)
    return existing || { hour, detections: 0, species: 0 }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity by Hour</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={fullData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `${parseInt(value)}:00`}
              className="text-muted-foreground"
            />
            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              labelFormatter={(value) => `${parseInt(value)}:00 - ${parseInt(value) + 1}:00`}
            />
            <Bar
              dataKey="detections"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              name="Detections"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
