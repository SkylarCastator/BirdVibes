import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { EBirdNotableObservation } from '@/lib/types'
import { Sparkles, ExternalLink, MapPin, User, Calendar } from 'lucide-react'

interface NotableSightingsProps {
  observations: EBirdNotableObservation[]
  isLoading?: boolean
  error?: Error | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function NotableSightings({
  observations,
  isLoading,
  error,
}: NotableSightingsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Notable Sightings
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Loading rare birds...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Notable Sightings
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Unable to load sightings</span>
        </CardContent>
      </Card>
    )
  }

  const displayObs = observations.slice(0, 6)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Notable Sightings
        </CardTitle>
        <CardDescription className="text-xs">
          Rare or unusual birds reported nearby
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayObs.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            No notable sightings recently
          </div>
        ) : (
          <div className="space-y-3">
            {displayObs.map((obs, index) => (
              <div
                key={obs.subId || index}
                className="p-2 rounded-md border border-amber-500/20 bg-amber-500/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {obs.comName || 'Unknown species'}
                    </div>
                    <div className="text-xs text-muted-foreground italic">
                      {obs.sciName}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {obs.locName || 'Unknown location'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(obs.obsDt)}
                      </span>
                      {obs.userDisplayName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {obs.userDisplayName}
                        </span>
                      )}
                    </div>
                  </div>
                  {obs.subId && (
                    <a
                      href={`https://ebird.org/checklist/${obs.subId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-1 hover:bg-muted rounded"
                      title="View on eBird"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
