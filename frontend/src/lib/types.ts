export interface Detection {
  Date: string
  Time: string
  Com_Name: string
  Sci_Name: string
  Confidence: number
  File_Name: string
}

export interface Summary {
  total_detections: number
  today_detections: number
  hour_detections: number
  today_species: number
  total_species: number
}

export interface Species {
  sci_name: string
  com_name: string
  count: number
  max_confidence: number
  last_date: string
  last_time: string
}

export interface SpeciesDetail extends Species {
  first_seen: string
  last_seen: string
  image: BirdImage | null
  description: string | null
  wikipedia_url: string | null
  info_url: string
  info_site: string
}

export interface BirdImage {
  sci_name: string
  com_en_name: string
  image_url: string
  title: string
  id: string
  author_url: string
  license_url: string
  photos_url?: string
}

export interface Config {
  site_name: string
  latitude: number
  longitude: number
  model: string
  database_lang: string
  color_scheme: 'light' | 'dark'
  info_site: string
  image_provider: string
  birdweather_token: string
  birdweather_enabled: boolean
  ebird_api_key: string
  ebird_enabled: boolean
  livestream_enabled: boolean
}

export interface BirdWeatherStats {
  connected: boolean
  stats: {
    detections?: number
    species?: number
    soundscapes?: number
  }
  top_species: Array<{
    id: number
    commonName: string
    scientificName: string
    detections: number
  }>
}

export interface BirdWeatherRecording {
  id: number | null
  timestamp: string | null
  confidence: number | null
  species: {
    commonName: string | null
    scientificName: string | null
  }
  audio_url: string | null
  spectrogram_url: string | null
  duration: number | null
  source: 'birdweather'
}

export interface BirdWeatherRecordingsResponse {
  recordings: BirdWeatherRecording[]
  species: string
  source: string
}

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
  meta?: {
    timestamp: string
    total?: number
    limit?: number
    offset?: number
  }
}

export interface ChartInfo {
  date: string
  url: string | null
  exists: boolean
}

// Analytics types
export interface TimelinePoint {
  date: string
  detections: number
  species: number
}

export interface HourlyPoint {
  hour: string
  detections: number
  species: number
}

export interface TopSpecies {
  sci_name: string
  com_name: string
  count: number
  avg_confidence: number
  days_seen: number
}

export interface SeasonalPoint {
  month: number
  detections: number
  species: number
}

export interface AnalyticsSummary {
  total_species: number
  total_detections: number
  new_this_week: number
  streak_days: number
  busiest_hour: string
  first_detection: string
}

// Ornithophile API types
export interface OrnithophileBird {
  id: string
  common_name: string
  scientific_name: string
  male_image: string | null
  female_image: string | null
  sound: string | null
  domain: string
  kingdom: string
  phylum: string
  class: string
  order: string
  family: string
  genus: string
  species: string
  conservation_status: string | null
  description: string | null
  sources: string | null
  other_images: Array<{ name: string; source: string }>
}

// eBird types
export interface EBirdObservation {
  speciesCode: string | null
  comName: string | null
  sciName: string | null
  locId: string | null
  locName: string | null
  lat: number
  lng: number
  obsDt: string | null
  howMany: number
  obsValid: boolean
  locationPrivate: boolean
}

export interface EBirdHotspot {
  locId: string | null
  locName: string | null
  lat: number
  lng: number
  countryCode: string | null
  subnational1Code: string | null
  numSpeciesAllTime: number
  latestObsDt: string | null
}

export interface EBirdNotableObservation extends EBirdObservation {
  obsReviewed: boolean
  userDisplayName: string | null
  subId: string | null
}

export interface EBirdSpeciesHotspot {
  locId: string | null
  locName: string | null
  lat: number | null
  lng: number | null
  lastSeen: string | null
  count: number | null
}

export interface EBirdFrequencyPoint {
  week: number
  month: string
  localFreq: number
  ebirdFreq: number
}

export interface EBirdConfig {
  configured: boolean
  api_key_masked: string
}

export interface EBirdRegion {
  region_code: string
  region_name: string
}

// Collection/Pokedex types
export type Rarity = 'common' | 'uncommon' | 'rare' | 'ultra_rare' | 'unknown'

export interface CollectionSpecies {
  sci_name: string
  com_name: string | null
  species_code: string
  discovered: boolean
  count: number
  max_confidence: number | null
  first_seen: string | null
  last_seen: string | null
  frequency: number
  rarity: Rarity
}
