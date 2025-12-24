import { useParams, Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSpeciesDetail, useSpeciesDetections, useBirdWeatherRecordings, useConfig, useOrnithophile } from '@/hooks/useApi'
import { SpectrogramPlayer } from '@/components/audio/SpectrogramPlayer'
import { AudioSpectrumPlayer } from '@/components/audio/AudioSpectrumPlayer'
import { ArrowLeft, ExternalLink, Calendar, TrendingUp, Bird, Clock, Percent, Cloud, Volume2, Shield, Feather } from 'lucide-react'
import type { Detection } from '@/lib/types'

function getAudioUrl(detection: Detection): string {
  return `/By_Date/${detection.Date}/${detection.Com_Name.replace(/ /g, '_')}/${detection.File_Name}`
}

function getSpectrogramUrl(detection: Detection): string {
  return `${getAudioUrl(detection)}.png`
}

export function SpeciesDetail() {
  const { sciName } = useParams<{ sciName: string }>()
  const { data: species, isLoading } = useSpeciesDetail(sciName ?? '')
  const { data: detections } = useSpeciesDetections(sciName ?? '', { limit: 20 })
  const { data: config } = useConfig()
  const { data: bwRecordings, isLoading: bwLoading } = useBirdWeatherRecordings(
    sciName ?? '',
    5
  )
  const { data: ornithophile } = useOrnithophile(sciName ?? '')

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  if (!species) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Bird className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Species Not Found</h2>
        <Link to="/species" className="mt-4 text-primary hover:underline">
          Back to species list
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Back button */}
      <Link to="/species">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to species
        </Button>
      </Link>

      {/* Header with image */}
      <div className="grid gap-6 md:grid-cols-2">
        {species.image && (
          <Card className="overflow-hidden">
            <img
              src={species.image.image_url}
              alt={species.com_name}
              className="aspect-square w-full object-cover"
            />
            <CardContent className="p-3 text-center text-xs text-muted-foreground">
              <a
                href={species.image.photos_url ?? species.image.author_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Photo: {species.image.title}
              </a>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{species.com_name}</h1>
            <p className="text-lg italic text-muted-foreground">{species.sci_name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{species.count}</p>
                <p className="text-sm text-muted-foreground">Total detections</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{Math.round(species.max_confidence * 100)}%</p>
                <p className="text-sm text-muted-foreground">Max confidence</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>First seen: {species.first_seen}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>Last seen: {species.last_seen}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <a
              href={species.info_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full">
                Learn more on {species.info_site}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
            {species.wikipedia_url && (
              <a
                href={species.wikipedia_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  View on Wikipedia
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* About this species */}
      {species.description && (
        <Card>
          <CardHeader>
            <CardTitle>About {species.com_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{species.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Reference call from Ornithophile */}
      {ornithophile?.sound && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Reference Call
            </CardTitle>
            <CardDescription>
              Typical vocalization for this species
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AudioSpectrumPlayer
              audioUrl={ornithophile.sound}
              title={species.com_name}
              subtitle="Reference recording"
            />
          </CardContent>
        </Card>
      )}

      {/* Conservation & Taxonomy from Ornithophile */}
      {ornithophile && (ornithophile.conservation_status || ornithophile.order) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Feather className="h-5 w-5" />
              Classification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {ornithophile.conservation_status && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Conservation Status</p>
                    <p className="font-medium">{ornithophile.conservation_status}</p>
                  </div>
                </div>
              )}
              {ornithophile.order && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Bird className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Order</p>
                    <p className="font-medium">{ornithophile.order}</p>
                  </div>
                </div>
              )}
              {ornithophile.family && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Feather className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Family</p>
                    <p className="font-medium">{ornithophile.family}</p>
                  </div>
                </div>
              )}
              {ornithophile.genus && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Feather className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Genus</p>
                    <p className="font-medium italic">{ornithophile.genus}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* BirdWeather Recordings */}
      {config?.birdweather_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              BirdWeather Recordings
            </CardTitle>
            <CardDescription>
              Example recordings from the BirdWeather community
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bwLoading && (
              <div className="text-center py-4 text-muted-foreground">
                Loading recordings...
              </div>
            )}
            {!bwLoading && bwRecordings?.recordings?.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {bwRecordings.recordings.map((rec, i) => (
                  rec.audio_url && (
                    <AudioSpectrumPlayer
                      key={rec.id || i}
                      audioUrl={rec.audio_url}
                      title={rec.species?.commonName || species?.com_name}
                      subtitle={rec.timestamp ? new Date(rec.timestamp).toLocaleDateString() : undefined}
                      compact
                    />
                  )
                ))}
              </div>
            ) : !bwLoading ? (
              <p className="text-muted-foreground text-center py-4">
                No BirdWeather recordings available for this species
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Recent detections with audio */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Detections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {detections?.length ? (
            detections.map((d: Detection, i: number) => (
              <div
                key={`${d.Date}-${d.Time}-${i}`}
                className="rounded-xl border border-border overflow-hidden"
              >
                <SpectrogramPlayer
                  audioUrl={getAudioUrl(d)}
                  spectrogramUrl={getSpectrogramUrl(d)}
                  size="sm"
                  className="rounded-b-none"
                />
                <div className="flex items-center justify-between p-3 bg-muted/30">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{d.Date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{d.Time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary">
                    <Percent className="h-3 w-3" />
                    {Math.round(d.Confidence * 100)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No detections found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
