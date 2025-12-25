import { useMemo } from 'react'
import { useParams, Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSpeciesDetail, useSpeciesDetections, useBirdWeatherRecordings, useConfig, useOrnithophile, useEBirdFrequency, useEBirdObservations, useEBirdHotspotsForSpecies } from '@/hooks/useApi'
import { SpectrogramPlayer } from '@/components/audio/SpectrogramPlayer'
import { AudioSpectrumPlayer } from '@/components/audio/AudioSpectrumPlayer'
import { FrequencyHeatmap, ObservationMap, HotspotsList } from '@/components/ebird'
import { ImageGallery } from '@/components/species/ImageGallery'
import { ReferenceCalls } from '@/components/species/ReferenceCalls'
import { ArrowLeft, ExternalLink, Calendar, TrendingUp, Bird, Clock, Percent, Cloud, Shield, Feather, Map, BookOpen, GraduationCap } from 'lucide-react'
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

  // eBird data
  const { data: ebirdFrequency, isLoading: freqLoading, error: freqError } = useEBirdFrequency(sciName ?? '')
  const { data: ebirdObservations, isLoading: obsLoading, error: obsError } = useEBirdObservations(sciName ?? '')
  const { data: ebirdHotspots, isLoading: hotspotsLoading, error: hotspotsError } = useEBirdHotspotsForSpecies(sciName ?? '')

  // Prepare gallery images from all sources
  const galleryImages = useMemo(() => {
    const images: Array<{ url: string; title?: string; source?: string; sourceUrl?: string }> = []

    // Add main species image
    if (species?.image?.image_url) {
      images.push({
        url: species.image.image_url,
        title: species.image.title,
        source: 'Primary',
        sourceUrl: species.image.photos_url ?? species.image.author_url
      })
    }

    // Add ornithophile images
    if (ornithophile) {
      if (ornithophile.male_image) {
        images.push({ url: ornithophile.male_image, title: 'Male', source: 'Ornithophile' })
      }
      if (ornithophile.female_image) {
        images.push({ url: ornithophile.female_image, title: 'Female', source: 'Ornithophile' })
      }
      ornithophile.other_images?.forEach((img) => {
        if (img.source) {
          images.push({ url: img.source, title: img.name, source: 'Gallery' })
        }
      })
    }

    return images
  }, [species, ornithophile])

  // Prepare audio sources
  const audioSources = useMemo(() => {
    const sources: Array<{
      url: string
      title?: string
      recordist?: string
      source: 'xeno-canto' | 'macaulay' | 'other'
      sourceUrl?: string
      quality?: string
    }> = []

    if (ornithophile?.sound) {
      // Parse Xeno-Canto URL to get recording ID
      const xcMatch = ornithophile.sound.match(/xeno-canto\.org\/(\d+)/)
      sources.push({
        url: ornithophile.sound,
        title: species?.com_name ?? 'Recording',
        source: 'xeno-canto',
        sourceUrl: xcMatch ? `https://xeno-canto.org/${xcMatch[1]}` : ornithophile.sound,
        quality: 'A'
      })
    }

    return sources
  }, [ornithophile, species])

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

          {/* External Links */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Learn More</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href={species.info_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="flex-1 text-sm">{species.info_site}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
              <a
                href={`https://www.allaboutbirds.org/guide/${encodeURIComponent(species.com_name.replace(/ /g, '_'))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Bird className="h-4 w-4 text-orange-500" />
                <span className="flex-1 text-sm">All About Birds Guide</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
              {ebirdObservations?.[0]?.speciesCode && (
                <>
                  <a
                    href={`https://ebird.org/species/${ebirdObservations[0].speciesCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Map className="h-4 w-4 text-green-500" />
                    <span className="flex-1 text-sm">eBird Species Page</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                  <a
                    href={`https://birdsoftheworld.org/bow/species/${ebirdObservations[0].speciesCode}/cur/introduction`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    <span className="flex-1 text-sm">Birds of the World</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Subscription</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                </>
              )}
              {species.wikipedia_url && (
                <a
                  href={species.wikipedia_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="flex-1 text-sm">Wikipedia</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Photo Gallery - shows all available images */}
      {galleryImages.length > 0 && (
        <ImageGallery images={galleryImages} />
      )}

      {/* Reference Calls */}
      {audioSources.length > 0 && (
        <ReferenceCalls sources={audioSources} />
      )}

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

      {/* eBird Data Section */}
      {config?.ebird_enabled && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <img
              src="https://cdn.iconscout.com/icon/free/png-256/ebird-282445.png"
              alt="eBird"
              className="w-5 h-5"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            eBird Data
          </h2>

          {/* Frequency Heatmap */}
          <FrequencyHeatmap
            data={ebirdFrequency ?? []}
            isLoading={freqLoading}
            error={freqError}
          />

          {/* Observations Map & Hotspots in a grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <ObservationMap
              observations={ebirdObservations ?? []}
              centerLat={config.latitude}
              centerLng={config.longitude}
              isLoading={obsLoading}
              error={obsError}
              speciesName={species.com_name}
            />
            <HotspotsList
              hotspots={ebirdHotspots ?? []}
              isLoading={hotspotsLoading}
              error={hotspotsError}
              forSpecies={true}
              speciesName={species.com_name}
            />
          </div>
        </div>
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
