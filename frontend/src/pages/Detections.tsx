import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useTodayDetections } from '@/hooks/useApi'
import { DetectionCard } from '@/components/detection/DetectionCard'
import { Search } from 'lucide-react'

export function Detections() {
  const [search, setSearch] = useState('')
  const { data: detections, isLoading } = useTodayDetections({ limit: 100 })

  const filtered = detections?.filter((d) =>
    d.Com_Name.toLowerCase().includes(search.toLowerCase()) ||
    d.Sci_Name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Today's Detections</h1>
        <p className="text-muted-foreground">
          {filtered?.length ?? 0} detections found
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search species..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Detection grid */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !filtered?.length ? (
        <p className="py-8 text-center text-muted-foreground">
          {search ? 'No matching detections' : 'No detections today'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((detection, i) => (
            <DetectionCard
              key={`${detection.Time}-${detection.Sci_Name}-${i}`}
              detection={detection}
              showSpectrogram
            />
          ))}
        </div>
      )}
    </div>
  )
}
