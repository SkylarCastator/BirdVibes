import { Link } from 'react-router'
import { useSpeciesList } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bird, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { SpeciesDetail, BirdImage } from '@/lib/types'

interface BirdWithImage {
  sci_name: string
  com_name: string
  count: number
  image?: BirdImage | null
}

export function RecentBirdsGrid() {
  const { data: species } = useSpeciesList({ sort: 'recent' })
  const [birdsWithImages, setBirdsWithImages] = useState<BirdWithImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchImages() {
      if (!species?.length) return

      const recentSpecies = species.slice(0, 8)
      const results = await Promise.all(
        recentSpecies.map(async (s) => {
          try {
            const detail: SpeciesDetail = await api.getSpeciesDetail(s.sci_name)
            return { ...s, image: detail.image }
          } catch {
            return { ...s, image: null }
          }
        })
      )
      setBirdsWithImages(results)
      setLoading(false)
    }

    fetchImages()
  }, [species])

  if (loading) {
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
          {birdsWithImages.map((bird) => (
            <Link
              key={bird.sci_name}
              to={`/species/${encodeURIComponent(bird.sci_name)}`}
              className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
            >
              {bird.image?.image_url ? (
                <img
                  src={bird.image.image_url}
                  alt={bird.com_name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Bird className="h-12 w-12 text-muted-foreground/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-white text-sm font-medium truncate">{bird.com_name}</p>
                <p className="text-white/70 text-xs">{bird.count} detections</p>
              </div>
              <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {bird.count}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
