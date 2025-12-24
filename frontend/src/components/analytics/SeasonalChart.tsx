import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SeasonalPoint } from '@/lib/types'

interface SeasonalChartProps {
  data: SeasonalPoint[]
  isLoading?: boolean
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function SeasonalChart({ data, isLoading }: SeasonalChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Patterns</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </CardContent>
      </Card>
    )
  }

  // Fill in missing months with 0
  const fullData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const existing = data.find(d => d.month === month)
    return existing || { month, detections: 0, species: 0 }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seasonal Patterns</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={fullData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7a9e9e" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#7a9e9e" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorSpecies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#80a8b8" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#80a8b8" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => MONTH_NAMES[value - 1]}
              className="text-muted-foreground"
            />
            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              labelFormatter={(value) => MONTH_NAMES[value - 1]}
            />
            <Area
              type="monotone"
              dataKey="detections"
              stroke="var(--chart-1)"
              fillOpacity={1}
              fill="url(#colorDetections)"
              name="Detections"
            />
            <Area
              type="monotone"
              dataKey="species"
              stroke="var(--chart-2)"
              fillOpacity={1}
              fill="url(#colorSpecies)"
              name="Species"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
