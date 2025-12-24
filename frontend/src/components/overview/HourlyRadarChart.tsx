import { useAnalyticsHourly } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export function HourlyRadarChart() {
  const { data: hourlyData, isLoading } = useAnalyticsHourly(30)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity by Hour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transform hourly data for radar chart
  const radarData = Array.from({ length: 24 }, (_, i) => {
    const hourStr = i.toString().padStart(2, '0')
    const hourData = hourlyData?.find(h => h.hour === hourStr)
    return {
      hour: formatHourLabel(i),
      fullHour: hourStr,
      detections: hourData?.detections ?? 0,
      species: hourData?.species ?? 0,
    }
  })

  const maxDetections = Math.max(...radarData.map(d => d.detections), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity by Hour
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="hour"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, maxDetections]}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
                tickCount={4}
              />
              <Radar
                name="Detections"
                dataKey="detections"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.5}
                strokeWidth={2}
              />
              <Radar
                name="Species"
                dataKey="species"
                stroke="var(--chart-3)"
                fill="var(--chart-3)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-popover border rounded-lg p-2 shadow-lg text-sm">
                      <p className="font-medium">{data.fullHour}:00</p>
                      <p style={{ color: 'var(--chart-1)' }}>
                        {data.detections} detections
                      </p>
                      <p style={{ color: 'var(--chart-3)' }}>
                        {data.species} species
                      </p>
                    </div>
                  )
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--chart-1)' }} />
            <span className="text-muted-foreground">Detections</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--chart-3)' }} />
            <span className="text-muted-foreground">Species</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  if (hour < 12) return `${hour}am`
  return `${hour - 12}pm`
}
