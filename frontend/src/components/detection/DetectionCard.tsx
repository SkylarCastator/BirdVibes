import { useState } from 'react'
import { Bird, Clock, Percent, Play } from 'lucide-react'
import { Link } from 'react-router'
import type { Detection } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SpectrogramPlayer } from '@/components/audio/SpectrogramPlayer'
import { DetectionModal } from './DetectionModal'

interface DetectionCardProps {
  detection: Detection
  showSpectrogram?: boolean
  compact?: boolean
  className?: string
}

function getAudioUrl(detection: Detection): string {
  return `/By_Date/${detection.Date}/${detection.Com_Name.replace(/ /g, '_')}/${detection.File_Name}`
}

function getSpectrogramUrl(detection: Detection): string {
  return `${getAudioUrl(detection)}.png`
}

export function DetectionCard({
  detection,
  showSpectrogram = true,
  compact = false,
  className,
}: DetectionCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const confidencePercent = Math.round(detection.Confidence * 100)

  if (compact) {
    return (
      <>
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-muted/50 cursor-pointer transition-colors',
            className
          )}
          onClick={() => setModalOpen(true)}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bird className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/species/${encodeURIComponent(detection.Sci_Name)}`}
              className="font-medium hover:underline block truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {detection.Com_Name}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{detection.Time}</span>
              <span>·</span>
              <span>{confidencePercent}%</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 w-8 h-8"
            onClick={(e) => { e.stopPropagation(); setModalOpen(true) }}
          >
            <Play className="w-4 h-4" />
          </Button>
        </div>
        <DetectionModal
          detection={detection}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      </>
    )
  }

  return (
    <>
      <Card
        className={cn('overflow-hidden cursor-pointer hover:shadow-md transition-shadow', className)}
        onClick={() => setModalOpen(true)}
      >
        {showSpectrogram && (
          <div onClick={(e) => e.stopPropagation()}>
            <SpectrogramPlayer
              audioUrl={getAudioUrl(detection)}
              spectrogramUrl={getSpectrogramUrl(detection)}
              size="sm"
              className="rounded-t-xl rounded-b-none"
            />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to={`/species/${encodeURIComponent(detection.Sci_Name)}`}
                className="font-semibold hover:underline block truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {detection.Com_Name}
              </Link>
              <p className="text-xs text-muted-foreground italic truncate">
                {detection.Sci_Name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-sm font-medium text-primary">
                <Percent className="w-3 h-3" />
                {confidencePercent}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {detection.Time}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <DetectionModal
        detection={detection}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}
