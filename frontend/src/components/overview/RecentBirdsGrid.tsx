import { Link } from 'react-router'
import { useSpeciesList, useSpeciesDetail } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bird, ChevronRight } from 'lucide-react'
import type { Species } from '@/lib/types'

// Individual bird card that fetches its own image via React Query (cached)
function BirdCard({ species }: { species: Species }) {
  const { data: detail } = useSpeciesDetail(species.sci_name)
  const imageUrl = detail?.image?.image_url

  return (
    <Link
      to={`/species/${encodeURIComponent(species.sci_name)}`}
      className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={species.com_name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Bird className="h-12 w-12 text-muted-foreground/40" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-sm font-medium truncate">{species.com_name}</p>
        <p className="text-white/70 text-xs">{species.count} detections</p>
      </div>
      <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs px-2 py-0.5 rounded-full">
        {species.count}
      </div>
    </Link>
  )
}

export function RecentBirdsGrid() {
  const { data: species, isLoading } = useSpeciesList({ sort: 'recent' })
  const recentSpecies = species?.slice(0, 8) ?? []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bird className="h-5 w-5" />
            Recent Visitors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bird className="h-5 w-5" />
          Recent Visitors
        </CardTitle>
        <Link to="/species" className="text-sm text-primary hover:underline flex items-center gap-1">
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {recentSpecies.map((bird) => (
            <BirdCard key={bird.sci_name} species={bird} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
