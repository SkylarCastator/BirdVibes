import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { EBirdSpeciesHotspot, EBirdHotspot } from '@/lib/types'
import { MapPin, ExternalLink, Bird } from 'lucide-react'

interface HotspotsListProps {
  hotspots: EBirdSpeciesHotspot[] | EBirdHotspot[]
  isLoading?: boolean
  error?: Error | null
  forSpecies?: boolean
  speciesName?: string
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function isSpeciesHotspot(h: EBirdSpeciesHotspot | EBirdHotspot): h is EBirdSpeciesHotspot {
  return 'lastSeen' in h
}

export function HotspotsList({
  hotspots,
  isLoading,
  error,
  forSpecies = false,
  speciesName,
}: HotspotsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {forSpecies ? 'Where to Find' : 'Nearby Hotspots'}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Loading hotspots...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {forSpecies ? 'Where to Find' : 'Nearby Hotspots'}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Unable to load hotspots</span>
        </CardContent>
      </Card>
    )
  }

  const displayHotspots = hotspots.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {forSpecies ? 'Where to Find' : 'Nearby Hotspots'}
        </CardTitle>
        <CardDescription className="text-xs">
          {forSpecies && speciesName
            ? `Best locations to see ${speciesName}`
            : 'Popular birding locations near you'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayHotspots.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            No hotspots found
          </div>
        ) : (
          <div className="space-y-2">
            {displayHotspots.map((hotspot, index) => (
              <a
                key={hotspot.locId || index}
                href={hotspot.locId ? `https://ebird.org/hotspot/${hotspot.locId}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-primary">
                      {hotspot.locName || 'Unknown location'}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      {isSpeciesHotspot(hotspot) ? (
                        <>
                          {hotspot.lastSeen && (
                            <span>Last seen: {formatDate(hotspot.lastSeen)}</span>
                          )}
                          {hotspot.count && hotspot.count > 1 && (
                            <span className="flex items-center gap-1">
                              <Bird className="h-3 w-3" />
                              {hotspot.count}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {'numSpeciesAllTime' in hotspot && hotspot.numSpeciesAllTime > 0 && (
                            <span>{hotspot.numSpeciesAllTime} species</span>
                          )}
                          {'latestObsDt' in hotspot && hotspot.latestObsDt && (
                            <span>Active: {formatDate(hotspot.latestObsDt)}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
