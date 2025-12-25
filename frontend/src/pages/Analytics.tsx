import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  useAnalyticsTimeline,
  useAnalyticsHourly,
  useAnalyticsTopSpecies,
  useAnalyticsSeasonal,
  useAnalyticsSummary,
  useConfig,
  useEBirdNotable,
  useEBirdHotspots,
} from '@/hooks/useApi'
import { TimelineChart } from '@/components/analytics/TimelineChart'
import { HourlyChart } from '@/components/analytics/HourlyChart'
import { TopSpeciesChart } from '@/components/analytics/TopSpeciesChart'
import { SeasonalChart } from '@/components/analytics/SeasonalChart'
import { NotableSightings, HotspotsList } from '@/components/ebird'
import { Bird, Calendar, TrendingUp, Clock } from 'lucide-react'

type TimeRange = 30 | 90 | 365

function StatCard({ title, value, icon: Icon, subtitle }: {
  title: string
  value: string | number
  icon: React.ElementType
  subtitle?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Analytics() {
  const [days, setDays] = useState<TimeRange>(30)

  const { data: config } = useConfig()
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary()
  const { data: timeline, isLoading: timelineLoading } = useAnalyticsTimeline(days)
  const { data: hourly, isLoading: hourlyLoading } = useAnalyticsHourly(days)
  const { data: topSpecies, isLoading: topSpeciesLoading } = useAnalyticsTopSpecies(days)
  const { data: seasonal, isLoading: seasonalLoading } = useAnalyticsSeasonal()

  // eBird data
  const { data: ebirdNotable, isLoading: notableLoading, error: notableError } = useEBirdNotable()
  const { data: ebirdHotspots, isLoading: hotspotsLoading, error: hotspotsError } = useEBirdHotspots()

  const formatHour = (hour: string) => {
    const h = parseInt(hour)
    if (h === 0) return '12 AM'
    if (h === 12) return '12 PM'
    return h < 12 ? `${h} AM` : `${h - 12} PM`
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header with time range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Bird detection insights and trends</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={days === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(30)}
          >
            30 days
          </Button>
          <Button
            variant={days === 90 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(90)}
          >
            90 days
          </Button>
          <Button
            variant={days === 365 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(365)}
          >
            1 year
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Species"
          value={summaryLoading ? '...' : summary?.total_species ?? 0}
          icon={Bird}
        />
        <StatCard
          title="Total Detections"
          value={summaryLoading ? '...' : summary?.total_detections?.toLocaleString() ?? 0}
          icon={TrendingUp}
        />
        <StatCard
          title="New This Week"
          value={summaryLoading ? '...' : summary?.new_this_week ?? 0}
          icon={Calendar}
          subtitle="species"
        />
        <StatCard
          title="Peak Activity"
          value={summaryLoading ? '...' : formatHour(summary?.busiest_hour ?? '12')}
          icon={Clock}
        />
      </div>

      {/* Timeline chart - full width */}
      <TimelineChart data={timeline ?? []} isLoading={timelineLoading} />

      {/* Two column layout for hourly and top species */}
      <div className="grid gap-6 lg:grid-cols-2">
        <HourlyChart data={hourly ?? []} isLoading={hourlyLoading} />
        <TopSpeciesChart data={topSpecies ?? []} isLoading={topSpeciesLoading} />
      </div>

      {/* Seasonal chart - full width */}
      <SeasonalChart data={seasonal ?? []} isLoading={seasonalLoading} />

      {/* eBird regional data */}
      {config?.ebird_enabled && (
        <div className="grid gap-6 lg:grid-cols-2">
          <NotableSightings
            observations={ebirdNotable ?? []}
            isLoading={notableLoading}
            error={notableError}
          />
          <HotspotsList
            hotspots={ebirdHotspots ?? []}
            isLoading={hotspotsLoading}
            error={hotspotsError}
          />
        </div>
      )}

      {/* Additional insights */}
      {summary && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Quick Insights</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Recording Since</p>
                <p className="text-lg font-medium">
                  {new Date(summary.first_detection).toLocaleDateString()}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Active Streak</p>
                <p className="text-lg font-medium">{summary.streak_days} days</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Avg Detections/Day</p>
                <p className="text-lg font-medium">
                  {summary.streak_days > 0
                    ? Math.round(summary.total_detections / summary.streak_days)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
