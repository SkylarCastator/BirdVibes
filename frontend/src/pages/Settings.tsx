import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useConfig, useBirdWeatherStats } from '@/hooks/useApi'
import { api, type ConfigUpdate } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { Settings as SettingsIcon, MapPin, Palette, Image, ExternalLink, Save, Check, Cloud, AlertCircle, Binoculars, Database, CheckCircle2, XCircle } from 'lucide-react'

type ColorScheme = 'light' | 'dark'
type InfoSite = 'ALLABOUTBIRDS' | 'EBIRD'
type ImageProvider = 'WIKIPEDIA' | 'FLICKR'

export function Settings() {
  const { data: config, isLoading } = useConfig()
  const { data: birdweatherStats, isLoading: bwLoading, error: bwError } = useBirdWeatherStats()
  const queryClient = useQueryClient()

  const [siteName, setSiteName] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [colorScheme, setColorScheme] = useState<ColorScheme>('dark')
  const [infoSite, setInfoSite] = useState<InfoSite>('ALLABOUTBIRDS')
  const [imageProvider, setImageProvider] = useState<ImageProvider>('WIKIPEDIA')
  const [birdweatherToken, setBirdweatherToken] = useState('')
  const [ebirdApiKey, setEbirdApiKey] = useState('')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (config) {
      setSiteName(config.site_name || '')
      setLatitude(String(config.latitude || 0))
      setLongitude(String(config.longitude || 0))
      setColorScheme((config.color_scheme as ColorScheme) || 'dark')
      setInfoSite((config.info_site as InfoSite) || 'ALLABOUTBIRDS')
      setImageProvider((config.image_provider as ImageProvider) || 'WIKIPEDIA')
    }
  }, [config])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const update: ConfigUpdate = {
        SITE_NAME: siteName,
        LATITUDE: parseFloat(latitude) || 0,
        LONGITUDE: parseFloat(longitude) || 0,
        COLOR_SCHEME: colorScheme,
        INFO_SITE: infoSite,
        IMAGE_PROVIDER: imageProvider,
      }

      // Only update tokens if user entered new ones
      if (birdweatherToken) {
        update.BIRDWEATHER_TOKEN = birdweatherToken
      }
      if (ebirdApiKey) {
        update.EBIRD_API_KEY = ebirdApiKey
      }

      await api.saveConfig(update)
      await queryClient.invalidateQueries({ queryKey: ['config'] })
      await queryClient.invalidateQueries({ queryKey: ['birdweather'] })
      await queryClient.invalidateQueries({ queryKey: ['collection'] })
      setBirdweatherToken('') // Clear inputs after save
      setEbirdApiKey('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your BirdNET-Pi</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Site Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Site Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Site Name</label>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="BirdNET-Pi"
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
          <CardDescription>
            Used for species filtering and sunrise/sunset calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Latitude</label>
              <Input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="37.7749"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Longitude</label>
              <Input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-122.4194"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium mb-2 block">Color Scheme</label>
            <div className="flex gap-2">
              <Button
                variant={colorScheme === 'light' ? 'default' : 'outline'}
                onClick={() => setColorScheme('light')}
                className="flex-1"
              >
                Light
              </Button>
              <Button
                variant={colorScheme === 'dark' ? 'default' : 'outline'}
                onClick={() => setColorScheme('dark')}
                className="flex-1"
              >
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bird Info Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Bird Information
          </CardTitle>
          <CardDescription>
            Where to link for more information about species
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Info Site</label>
            <div className="flex gap-2">
              <Button
                variant={infoSite === 'ALLABOUTBIRDS' ? 'default' : 'outline'}
                onClick={() => setInfoSite('ALLABOUTBIRDS')}
                className="flex-1"
              >
                All About Birds
              </Button>
              <Button
                variant={infoSite === 'EBIRD' ? 'default' : 'outline'}
                onClick={() => setInfoSite('EBIRD')}
                className="flex-1"
              >
                eBird
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Image Provider
          </CardTitle>
          <CardDescription>
            Source for bird species images
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={imageProvider === 'WIKIPEDIA' ? 'default' : 'outline'}
              onClick={() => setImageProvider('WIKIPEDIA')}
              className="flex-1"
            >
              Wikipedia
            </Button>
            <Button
              variant={imageProvider === 'FLICKR' ? 'default' : 'outline'}
              onClick={() => setImageProvider('FLICKR')}
              className="flex-1"
            >
              Flickr
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* BirdWeather Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            BirdWeather
          </CardTitle>
          <CardDescription>
            Connect to BirdWeather to view your station stats (view-only, no data is sent)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Station Token</label>
            <Input
              type="password"
              value={birdweatherToken}
              onChange={(e) => setBirdweatherToken(e.target.value)}
              placeholder={config?.birdweather_enabled ? config.birdweather_token : 'Enter your BirdWeather token'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              <a
                href="https://app.birdweather.com/login"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Get your token at app.birdweather.com
              </a>
            </p>
          </div>

          {/* BirdWeather Status */}
          {config?.birdweather_enabled && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Station Stats</h4>
              {bwLoading && (
                <p className="text-sm text-muted-foreground">Loading BirdWeather data...</p>
              )}
              {bwError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Failed to connect to BirdWeather
                </div>
              )}
              {birdweatherStats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xl font-bold">{birdweatherStats.stats.detections?.toLocaleString() ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Detections</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xl font-bold">{birdweatherStats.stats.species ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Species</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xl font-bold">{birdweatherStats.stats.soundscapes ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Soundscapes</p>
                  </div>
                </div>
              )}
              {birdweatherStats?.top_species && birdweatherStats.top_species.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium mb-2">Top Species on BirdWeather</h5>
                  <div className="space-y-1">
                    {birdweatherStats.top_species.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex justify-between text-sm">
                        <span>{s.commonName}</span>
                        <span className="text-muted-foreground">{s.detections}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* eBird Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Binoculars className="h-5 w-5" />
            eBird
          </CardTitle>
          <CardDescription>
            Enable regional species data, observations, hotspots, and frequency analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">API Key</label>
            <Input
              type="password"
              value={ebirdApiKey}
              onChange={(e) => setEbirdApiKey(e.target.value)}
              placeholder={config?.ebird_enabled ? '••••••••' : 'Enter your eBird API key'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              <a
                href="https://ebird.org/api/keygen"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Get a free API key at ebird.org/api/keygen
              </a>
            </p>
          </div>

          {/* eBird Status */}
          <div className="flex items-center gap-2 text-sm">
            {config?.ebird_enabled ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Connected</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Not configured</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Sources
          </CardTitle>
          <CardDescription>
            Information and media sources integrated into BirdNET-Pi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">eBird</p>
                <p className="text-xs text-muted-foreground">Regional species, observations, hotspots, frequency data</p>
              </div>
              <a href="https://ebird.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                Visit
              </a>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">BirdWeather</p>
                <p className="text-xs text-muted-foreground">Station statistics, community detections, audio recordings</p>
              </div>
              <a href="https://app.birdweather.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                Visit
              </a>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">All About Birds</p>
                <p className="text-xs text-muted-foreground">Species information, identification tips, sounds</p>
              </div>
              <a href="https://allaboutbirds.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                Visit
              </a>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">Birds of the World</p>
                <p className="text-xs text-muted-foreground">Comprehensive species accounts (subscription)</p>
              </div>
              <a href="https://birdsoftheworld.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                Visit
              </a>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">Wikipedia / Wikimedia</p>
                <p className="text-xs text-muted-foreground">Bird images (free, no API key needed)</p>
              </div>
              <span className="text-xs text-muted-foreground">Free</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">Flickr</p>
                <p className="text-xs text-muted-foreground">Creative Commons bird photos</p>
              </div>
              <span className="text-xs text-muted-foreground">Free</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Model</span>
            <span className="font-medium">{config?.model || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Language</span>
            <span className="font-medium">{config?.database_lang?.toUpperCase() || 'EN'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
