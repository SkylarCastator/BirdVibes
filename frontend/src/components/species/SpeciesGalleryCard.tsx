import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Bird } from 'lucide-react'
import type { Species } from '@/lib/types'
import { useSpeciesDetail } from '@/hooks/useApi'
import { cn } from '@/lib/utils'

interface SpeciesGalleryCardProps {
  species: Species
  className?: string
}

export function SpeciesGalleryCard({ species, className }: SpeciesGalleryCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Lazy load detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Only fetch species detail (with image) when visible
  const { data: speciesDetail } = useSpeciesDetail(isVisible ? species.sci_name : '')

  const imageUrl = speciesDetail?.image?.image_url

  return (
    <Link
      ref={cardRef}
      to={`/species/${encodeURIComponent(species.sci_name)}`}
      className={cn(
        'relative block aspect-square rounded-xl overflow-hidden group',
        'bg-muted transition-transform hover:scale-[1.02] hover:shadow-xl',
        className
      )}
    >
      {/* Background image or placeholder */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={species.com_name}
          className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
          <Bird className="w-16 h-16 text-primary/30" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="font-semibold text-lg leading-tight truncate">
          {species.com_name}
        </h3>
        <p className="text-sm text-white/70 italic truncate">
          {species.sci_name}
        </p>
        <div className="flex items-center gap-3 mt-2 text-sm">
          <span className="bg-white/20 px-2 py-0.5 rounded">
            {species.count} {species.count === 1 ? 'detection' : 'detections'}
          </span>
          <span className="text-white/70">
            {Math.round(species.max_confidence * 100)}% max
          </span>
        </div>
      </div>

      {/* Detection count badge */}
      <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
        {species.count}
      </div>
    </Link>
  )
}
