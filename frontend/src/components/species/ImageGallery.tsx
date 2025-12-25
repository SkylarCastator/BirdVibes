import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Images, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GalleryImage {
  url: string
  title?: string
  source?: string
  sourceUrl?: string
}

interface ImageGalleryProps {
  images: GalleryImage[]
  isLoading?: boolean
}

function fixImageUrl(url: string): string {
  // Fix protocol-relative URLs
  if (url.startsWith('//')) {
    return 'https:' + url
  }
  return url
}

export function ImageGallery({ images, isLoading }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Images className="h-4 w-4" />
            Photo Gallery
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Loading images...</span>
        </CardContent>
      </Card>
    )
  }

  // Filter out invalid images
  const validImages = images.filter(img =>
    img.url &&
    !img.url.includes('Status_iucn') && // Filter out IUCN status icons
    !img.url.includes('Distribution_') // Filter out distribution maps (keep those separate)
  )

  if (validImages.length === 0) {
    return null // Don't show empty gallery
  }

  const currentImage = validImages[currentIndex]

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Images className="h-4 w-4" />
            Photo Gallery
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {currentIndex + 1} / {validImages.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Main image */}
            <div
              className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer flex items-center justify-center"
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={fixImageUrl(currentImage.url)}
                alt={currentImage.title || 'Bird photo'}
                className="max-w-full max-h-full object-contain hover:scale-105 transition-transform"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>

            {/* Navigation arrows */}
            {validImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); goToPrev() }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); goToNext() }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Caption */}
          {currentImage.title && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {currentImage.title}
              {currentImage.sourceUrl && (
                <a
                  href={currentImage.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </p>
          )}

          {/* Thumbnail strip */}
          {validImages.length > 1 && (
            <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
              {validImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
                    idx === currentIndex ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
                  }`}
                >
                  <img
                    src={fixImageUrl(img.url)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.parentElement!.style.display = 'none'
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
          >
            ×
          </Button>

          {validImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={(e) => { e.stopPropagation(); goToPrev() }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={(e) => { e.stopPropagation(); goToNext() }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          <img
            src={fixImageUrl(currentImage.url)}
            alt={currentImage.title || 'Bird photo'}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {currentImage.title && <span>{currentImage.title}</span>}
            <span className="ml-2 text-white/60">
              {currentIndex + 1} / {validImages.length}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
