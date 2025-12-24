import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router'
import type { TopSpecies } from '@/lib/types'

interface TopSpeciesChartProps {
  data: TopSpecies[]
  isLoading?: boolean
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function TopSpeciesChart({ data, isLoading }: TopSpeciesChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Species</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Species</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: 100 }}
          >
            <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <YAxis
              type="category"
              dataKey="com_name"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              width={95}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              formatter={(value) => [value, 'Detections']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} name="count">
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Species list with links */}
        <div className="mt-4 space-y-2">
          {data.slice(0, 5).map((species, i) => (
            <Link
              key={species.sci_name}
              to={`/species/${encodeURIComponent(species.sci_name)}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-sm font-medium">{species.com_name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {species.count} ({Math.round(species.avg_confidence * 100)}% avg)
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
