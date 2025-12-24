import { Link } from 'react-router'
import { Calendar, Clock, ExternalLink, Percent } from 'lucide-react'
import type { Detection } from '@/lib/types'
import { useSpeciesDetail } from '@/hooks/useApi'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { SpectrogramPlayer } from '@/components/audio/SpectrogramPlayer'
import { Button } from '@/components/ui/button'

interface DetectionModalProps {
  detection: Detection | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getAudioUrl(detection: Detection): string {
  return `/By_Date/${detection.Date}/${detection.Com_Name.replace(/ /g, '_')}/${detection.File_Name}`
}

function getSpectrogramUrl(detection: Detection): string {
  return `${getAudioUrl(detection)}.png`
}

export function DetectionModal({ detection, open, onOpenChange }: DetectionModalProps) {
  const { data: speciesDetail } = useSpeciesDetail(detection?.Sci_Name || '')

  if (!detection) return null

  const confidencePercent = Math.round(detection.Confidence * 100)

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div className="p-6">
        {/* Spectrogram player - large */}
        <SpectrogramPlayer
          audioUrl={getAudioUrl(detection)}
          spectrogramUrl={getSpectrogramUrl(detection)}
          size="lg"
          className="mb-6"
        />

        {/* Info section */}
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Bird image */}
          {speciesDetail?.image && (
            <div className="sm:w-48 shrink-0">
              <img
                src={speciesDetail.image.image_url}
                alt={detection.Com_Name}
                className="w-full aspect-square object-cover rounded-xl"
              />
              {speciesDetail.image.author_url && (
                <a
                  href={speciesDetail.image.author_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:underline mt-1 block truncate"
                >
                  Photo: {speciesDetail.image.title || 'Source'}
                </a>
              )}
            </div>
          )}

          {/* Details */}
          <div className="flex-1 min-w-0">
            <ModalTitle className="mb-1">{detection.Com_Name}</ModalTitle>
            <ModalDescription className="italic mb-4">
              {detection.Sci_Name}
            </ModalDescription>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Percent className="w-4 h-4 mx-auto mb-1 text-primary" />
                <div className="font-semibold">{confidencePercent}%</div>
                <div className="text-xs text-muted-foreground">Confidence</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Calendar className="w-4 h-4 mx-auto mb-1 text-primary" />
                <div className="font-semibold text-sm">{detection.Date}</div>
                <div className="text-xs text-muted-foreground">Date</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Clock className="w-4 h-4 mx-auto mb-1 text-primary" />
                <div className="font-semibold">{detection.Time}</div>
                <div className="text-xs text-muted-foreground">Time</div>
              </div>
            </div>

            {/* Description */}
            {speciesDetail?.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {speciesDetail.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="default">
                <Link to={`/species/${encodeURIComponent(detection.Sci_Name)}`}>
                  View Species
                </Link>
              </Button>
              {speciesDetail?.info_url && (
                <Button asChild variant="outline">
                  <a
                    href={speciesDetail.info_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {speciesDetail.info_site || 'Learn More'}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
