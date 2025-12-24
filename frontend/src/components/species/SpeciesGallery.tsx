import type { Species } from '@/lib/types'
import { SpeciesGalleryCard } from './SpeciesGalleryCard'
import { cn } from '@/lib/utils'

interface SpeciesGalleryProps {
  species: Species[]
  className?: string
}

export function SpeciesGallery({ species, className }: SpeciesGalleryProps) {
  if (!species.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No species found
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {species.map((sp) => (
        <SpeciesGalleryCard key={sp.sci_name} species={sp} />
      ))}
    </div>
  )
}
