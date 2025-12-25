import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Bird, Star, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RarityBadge } from './RarityBadge'
import { useSpeciesDetail } from '@/hooks/useApi'
import type { CollectionSpecies } from '@/lib/types'

interface CollectionCardProps {
  species: CollectionSpecies
  isFavorite: boolean
  onToggleFavorite: () => void
}

export function CollectionCard({ species, isFavorite, onToggleFavorite }: CollectionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Lazy load image only when visible and discovered
  useEffect(() => {
    if (!species.discovered) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [species.discovered])

  const { data: detail } = useSpeciesDetail(
    species.discovered && isVisible ? species.sci_name : ''
  )

  const imageUrl = detail?.image?.image_url

  // Undiscovered card
  if (!species.discovered) {
    return (
      <div
        ref={cardRef}
        className={cn(
          'relative aspect-square rounded-xl overflow-hidden',
          'bg-muted/30 border-2 border-dashed border-muted-foreground/20'
        )}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <Lock className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm font-medium text-muted-foreground/50">???</p>
          <p className="text-xs text-muted-foreground/30 mt-1">Undiscovered</p>
        </div>

        {/* Rarity badge still visible */}
        <div className="absolute top-2 left-2">
          <RarityBadge rarity={species.rarity} />
        </div>
      </div>
    )
  }

  // Discovered card
  return (
    <Link
      to={`/species/${encodeURIComponent(species.sci_name)}`}
      className="block"
    >
      <div
        ref={cardRef}
        className={cn(
          'relative aspect-square rounded-xl overflow-hidden group',
          'bg-muted transition-all hover:scale-[1.02] hover:shadow-xl'
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={species.com_name ?? species.sci_name}
            className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
            style={{ objectFit: 'cover', imageRendering: 'auto' }}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
            <Bird className="w-12 h-12 text-primary/30" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Rarity badge */}
        <div className="absolute top-2 left-2">
          <RarityBadge rarity={species.rarity} />
        </div>

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFavorite()
          }}
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded-full transition-colors',
            isFavorite
              ? 'bg-yellow-500 text-white'
              : 'bg-black/30 text-white/70 hover:bg-black/50 hover:text-white'
          )}
        >
          <Star className={cn('w-4 h-4', isFavorite && 'fill-current')} />
        </button>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <h3 className="font-semibold text-sm leading-tight truncate">
            {species.com_name ?? species.sci_name}
          </h3>
          {species.com_name && (
            <p className="text-xs text-white/60 italic truncate">
              {species.sci_name}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
              {species.count} seen
            </span>
            {species.max_confidence && (
              <span className="text-xs text-white/60">
                {Math.round(species.max_confidence * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
