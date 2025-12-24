import { useRecentDetections } from '@/hooks/useApi'
import { DetectionCard } from './DetectionCard'
import { cn } from '@/lib/utils'

interface DetectionFeedProps {
  limit?: number
  compact?: boolean
  showSpectrogram?: boolean
  className?: string
}

export function DetectionFeed({
  limit = 10,
  compact = false,
  showSpectrogram = true,
  className,
}: DetectionFeedProps) {
  const { data: detections, isLoading, error } = useRecentDetections(limit)

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-muted rounded-xl animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        Failed to load detections
      </div>
    )
  }

  if (!detections?.length) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No recent detections
      </div>
    )
  }

  if (compact) {
    return (
      <div className={cn('space-y-1', className)}>
        {detections.map((detection, index) => (
          <DetectionCard
            key={`${detection.Date}-${detection.Time}-${detection.Sci_Name}-${index}`}
            detection={detection}
            compact
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {detections.map((detection, index) => (
        <DetectionCard
          key={`${detection.Date}-${detection.Time}-${detection.Sci_Name}-${index}`}
          detection={detection}
          showSpectrogram={showSpectrogram}
        />
      ))}
    </div>
  )
}
