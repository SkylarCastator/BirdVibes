import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { Icon, DivIcon } from 'leaflet'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { EBirdObservation } from '@/lib/types'
import { MapPin, ExternalLink } from 'lucide-react'

interface ObservationMapProps {
  observations: EBirdObservation[]
  centerLat: number
  centerLng: number
  isLoading?: boolean
  error?: Error | null
  speciesName?: string
}

// Bird marker icon
const birdIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
})

// Station marker (different color)
const stationIcon = new DivIcon({
  html: `<div style="background-color: #22c55e; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: 'station-marker',
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date'
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ObservationMap({
  observations,
  centerLat,
  centerLng,
  isLoading,
  error,
  speciesName,
}: ObservationMapProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Recent Sightings
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <span className="text-muted-foreground">Loading observations...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Recent Sightings
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <span className="text-muted-foreground">Unable to load sightings</span>
        </CardContent>
      </Card>
    )
  }

  const validObs = observations.filter(o => o.lat && o.lng && !o.locationPrivate)
  const position: [number, number] = [centerLat, centerLng]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Recent Sightings
        </CardTitle>
        <CardDescription className="text-xs">
          {validObs.length > 0
            ? `${validObs.length} eBird observation${validObs.length !== 1 ? 's' : ''} nearby`
            : 'No recent sightings in your area'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] rounded-lg overflow-hidden">
          <MapContainer
            center={position}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Station location circle */}
            <Circle
              center={position}
              radius={50000}
              pathOptions={{
                color: '#22c55e',
                fillColor: '#22c55e',
                fillOpacity: 0.05,
                weight: 1,
              }}
            />

            {/* Station marker */}
            <Marker position={position} icon={stationIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Your Station</strong>
                </div>
              </Popup>
            </Marker>

            {/* Observation markers */}
            {validObs.map((obs, index) => (
              <Marker
                key={`${obs.locId}-${index}`}
                position={[obs.lat, obs.lng]}
                icon={birdIcon}
              >
                <Popup>
                  <div className="text-sm min-w-[150px]">
                    <strong>{obs.comName || speciesName}</strong>
                    <div className="text-muted-foreground mt-1">
                      {obs.locName}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(obs.obsDt)}
                      {obs.howMany > 1 && ` (${obs.howMany} birds)`}
                    </div>
                    {obs.locId && (
                      <a
                        href={`https://ebird.org/hotspot/${obs.locId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-2"
                      >
                        View on eBird
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  )
}
