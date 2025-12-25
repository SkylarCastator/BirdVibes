import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Volume2, Play, Pause, ExternalLink, Loader2 } from 'lucide-react'

interface AudioSource {
  url: string
  title?: string
  recordist?: string
  source: 'xeno-canto' | 'macaulay' | 'other'
  sourceUrl?: string
  duration?: string
  quality?: string
}

interface ReferenceCallsProps {
  sources: AudioSource[]
  isLoading?: boolean
}

function SourceBadge({ source }: { source: AudioSource['source'] }) {
  const colors = {
    'xeno-canto': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'macaulay': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'other': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
  const labels = {
    'xeno-canto': 'XC',
    'macaulay': 'ML',
    'other': 'Other'
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[source]}`}>
      {labels[source]}
    </span>
  )
}

function AudioPlayer({ source }: { source: AudioSource }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio] = useState(() => new Audio(source.url))
  const [error, setError] = useState(false)

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(() => setError(true))
      setIsPlaying(true)
    }
  }

  audio.onended = () => setIsPlaying(false)
  audio.onerror = () => setError(true)

  if (error) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className="shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">Audio unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <SourceBadge source={source.source} />
          {source.quality && (
            <span className="text-[10px] text-muted-foreground">
              {source.quality}
            </span>
          )}
        </div>
        <p className="text-sm truncate mt-0.5">
          {source.title || 'Recording'}
        </p>
        {source.recordist && (
          <p className="text-xs text-muted-foreground truncate">
            by {source.recordist}
          </p>
        )}
      </div>
      {source.sourceUrl && (
        <a
          href={source.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-2 text-muted-foreground hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}

export function ReferenceCalls({ sources, isLoading }: ReferenceCallsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Reference Calls
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[150px] flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!sources || sources.length === 0) {
    return null
  }

  // Sort by quality (A > B > C > D > E)
  const sortedSources = [...sources].sort((a, b) => {
    const qa = a.quality || 'Z'
    const qb = b.quality || 'Z'
    return qa.localeCompare(qb)
  })

  // Limit to top 5
  const displaySources = sortedSources.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Reference Calls
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            {sources.length} recording{sources.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displaySources.map((source, idx) => (
          <AudioPlayer key={idx} source={source} />
        ))}
        {sources.length > 5 && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            + {sources.length - 5} more recordings
          </p>
        )}
      </CardContent>
    </Card>
  )
}
