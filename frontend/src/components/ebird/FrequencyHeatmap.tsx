import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { EBirdFrequencyPoint } from '@/lib/types'

interface FrequencyHeatmapProps {
  data: EBirdFrequencyPoint[]
  isLoading?: boolean
  error?: Error | null
}

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

// Color interpolation for heatmap effect
function getFrequencyColor(freq: number, isLocal: boolean): string {
  if (freq === 0) return 'transparent'
  const intensity = Math.min(freq, 1)
  if (isLocal) {
    // Green gradient for local detections
    const r = Math.round(34 + (1 - intensity) * 100)
    const g = Math.round(139 + (1 - intensity) * 60)
    const b = Math.round(34 + (1 - intensity) * 100)
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // Blue gradient for eBird regional data
    const r = Math.round(59 + (1 - intensity) * 100)
    const g = Math.round(130 + (1 - intensity) * 80)
    const b = Math.round(246 - (1 - intensity) * 50)
    return `rgb(${r}, ${g}, ${b})`
  }
}

export function FrequencyHeatmap({ data, isLoading, error }: FrequencyHeatmapProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Frequency</CardTitle>
          <CardDescription>When this species is typically seen</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <span className="text-muted-foreground">Loading frequency data...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Frequency</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex flex-col items-center justify-center gap-2">
          <span className="text-muted-foreground">Unable to load frequency data</span>
          <span className="text-xs text-muted-foreground/70">{error.message}</span>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Frequency</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <span className="text-muted-foreground">No frequency data available</span>
        </CardContent>
      </Card>
    )
  }

  // Group data by month for cleaner display
  const monthlyData = MONTH_LABELS.map((label, monthIndex) => {
    const weeksInMonth = data.filter(d => {
      const weekMonth = Math.floor((d.week - 1) / 4)
      return weekMonth === monthIndex
    })

    const avgLocal = weeksInMonth.length > 0
      ? weeksInMonth.reduce((sum, w) => sum + w.localFreq, 0) / weeksInMonth.length
      : 0
    const avgEbird = weeksInMonth.length > 0
      ? weeksInMonth.reduce((sum, w) => sum + w.ebirdFreq, 0) / weeksInMonth.length
      : 0

    return {
      month: label,
      monthIndex,
      localFreq: Math.round(avgLocal * 100),
      ebirdFreq: Math.round(avgEbird * 100),
    }
  })

  const hasLocalData = monthlyData.some(d => d.localFreq > 0)
  const hasEbirdData = monthlyData.some(d => d.ebirdFreq > 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Seasonal Frequency</CardTitle>
        <CardDescription className="text-xs">
          {hasLocalData && hasEbirdData
            ? 'Your detections vs regional eBird frequency'
            : hasLocalData
            ? 'Based on your detections'
            : hasEbirdData
            ? 'Based on eBird regional data'
            : 'No frequency data available'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value, name) => [
                `${value}%`,
                name === 'localFreq' ? 'Your detections' : 'eBird regional'
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              formatter={(value) => value === 'localFreq' ? 'Your Detections' : 'eBird Regional'}
            />
            {hasLocalData && (
              <Bar
                dataKey="localFreq"
                fill="#22c55e"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              >
                {monthlyData.map((entry, index) => (
                  <Cell
                    key={`local-${index}`}
                    fill={getFrequencyColor(entry.localFreq / 100, true)}
                  />
                ))}
              </Bar>
            )}
            {hasEbirdData && (
              <Bar
                dataKey="ebirdFreq"
                fill="#3b82f6"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              >
                {monthlyData.map((entry, index) => (
                  <Cell
                    key={`ebird-${index}`}
                    fill={getFrequencyColor(entry.ebirdFreq / 100, false)}
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
