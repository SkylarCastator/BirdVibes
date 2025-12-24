import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BirdInfoPanelProps {
  comName: string
  sciName: string
  infoUrl: string
  infoSite: string
  className?: string
}

export function BirdInfoPanel({
  comName,
  sciName,
  infoUrl,
  infoSite,
  className,
}: BirdInfoPanelProps) {
  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg">{comName}</h3>
          <p className="text-sm text-muted-foreground italic">{sciName}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          asChild
        >
          <a href={infoUrl} target="_blank" rel="noopener noreferrer">
            {infoSite}
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </Button>
      </div>
    </div>
  )
}
