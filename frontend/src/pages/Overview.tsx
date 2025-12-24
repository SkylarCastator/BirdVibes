import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSummary, useDailyChart } from '@/hooks/useApi'
import { DetectionFeed } from '@/components/detection/DetectionFeed'
import { RecentBirdsGrid } from '@/components/overview/RecentBirdsGrid'
import { HourlyRadarChart } from '@/components/overview/HourlyRadarChart'
import { LocationMap } from '@/components/overview/LocationMap'
import { Bird, Calendar, Clock, TrendingUp } from 'lucide-react'
import { Link } from 'react-router'

function StatCard({ title, value, icon: Icon, subtitle }: {
  title: string
  value: number | string
  icon: React.ElementType
  subtitle?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

export function Overview() {
  const { data: summary, isLoading: summaryLoading } = useSummary()
  const { data: chart } = useDailyChart()

  if (summaryLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">Bird detection summary</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Detections"
          value={summary?.total_detections.toLocaleString() ?? 0}
          icon={Bird}
          subtitle={`${summary?.total_species ?? 0} species total`}
        />
        <StatCard
          title="Today"
          value={summary?.today_detections ?? 0}
          icon={Calendar}
          subtitle={`${summary?.today_species ?? 0} species today`}
        />
        <StatCard
          title="Last Hour"
          value={summary?.hour_detections ?? 0}
          icon={Clock}
        />
        <StatCard
          title="Species Today"
          value={summary?.today_species ?? 0}
          icon={TrendingUp}
        />
      </div>

      {/* Recent birds photo grid */}
      <RecentBirdsGrid />

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily chart */}
        {chart?.exists && chart.url && (
          <Card>
            <CardHeader>
              <CardTitle>Today's Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={chart.url}
                alt="Daily detection chart"
                className="w-full rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Hourly radar chart */}
        <HourlyRadarChart />

        {/* Location map */}
        <LocationMap />
      </div>

      {/* Recent detections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Detections</h2>
          <Link to="/detections" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <DetectionFeed limit={6} showSpectrogram />
      </div>
    </div>
  )
}
