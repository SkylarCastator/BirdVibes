import type {
  ApiResponse,
  Summary,
  Detection,
  Species,
  SpeciesDetail,
  Config,
  ChartInfo,
  TimelinePoint,
  HourlyPoint,
  TopSpecies,
  SeasonalPoint,
  AnalyticsSummary,
  BirdWeatherStats,
  BirdWeatherRecordingsResponse,
} from './types'

const BASE_URL = '/api/v1'

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  const json: ApiResponse<T> = await response.json()
  if (json.status === 'error') {
    throw new Error('API returned error')
  }
  return json.data
}

export interface ConfigUpdate {
  SITE_NAME?: string
  LATITUDE?: number
  LONGITUDE?: number
  COLOR_SCHEME?: string
  INFO_SITE?: string
  IMAGE_PROVIDER?: string
  BIRDWEATHER_TOKEN?: string
}

export const api = {
  getSummary: () => fetchApi<Summary>('/summary'),

  getTodayDetections: (params?: { limit?: number; offset?: number; species?: string }) => {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    if (params?.species) query.set('species', params.species)
    const qs = query.toString()
    return fetchApi<Detection[]>(`/detections/today${qs ? `?${qs}` : ''}`)
  },

  getRecentDetections: (limit = 10) =>
    fetchApi<Detection[]>(`/detections/recent?limit=${limit}`),

  getSpeciesList: (params?: { sort?: string; date?: string }) => {
    const query = new URLSearchParams()
    if (params?.sort) query.set('sort', params.sort)
    if (params?.date) query.set('date', params.date)
    const qs = query.toString()
    return fetchApi<Species[]>(`/species${qs ? `?${qs}` : ''}`)
  },

  getSpeciesDetail: (sciName: string) =>
    fetchApi<SpeciesDetail>(`/species/${encodeURIComponent(sciName)}`),

  getSpeciesDetections: (sciName: string, params?: { limit?: number; offset?: number; date?: string }) => {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    if (params?.date) query.set('date', params.date)
    const qs = query.toString()
    return fetchApi<Detection[]>(`/species/${encodeURIComponent(sciName)}/detections${qs ? `?${qs}` : ''}`)
  },

  getRecordingDates: () => fetchApi<string[]>('/recordings/dates'),

  getRecordingsByDate: (date: string, params?: { limit?: number; offset?: number; species?: string }) => {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    if (params?.species) query.set('species', params.species)
    const qs = query.toString()
    return fetchApi<Detection[]>(`/recordings/${date}${qs ? `?${qs}` : ''}`)
  },

  getConfig: () => fetchApi<Config>('/config'),

  saveConfig: async (config: ConfigUpdate): Promise<Config> => {
    const response = await fetch(`${BASE_URL}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    const json = await response.json()
    if (json.status === 'error') {
      throw new Error(json.message || 'API returned error')
    }
    return json.data
  },

  getDailyChart: (date?: string) => {
    const query = date ? `?date=${date}` : ''
    return fetchApi<ChartInfo>(`/charts/daily${query}`)
  },

  // Analytics
  getAnalyticsTimeline: (days = 30) =>
    fetchApi<TimelinePoint[]>(`/analytics/timeline?days=${days}`),

  getAnalyticsHourly: (days = 30) =>
    fetchApi<HourlyPoint[]>(`/analytics/hourly?days=${days}`),

  getAnalyticsTopSpecies: (days = 30, limit = 10) =>
    fetchApi<TopSpecies[]>(`/analytics/top-species?days=${days}&limit=${limit}`),

  getAnalyticsSeasonal: () =>
    fetchApi<SeasonalPoint[]>('/analytics/seasonal'),

  getAnalyticsSummary: () =>
    fetchApi<AnalyticsSummary>('/analytics/summary'),

  // BirdWeather
  getBirdWeatherStats: () =>
    fetchApi<BirdWeatherStats>('/birdweather/stats'),

  getBirdWeatherRecordings: (sciName: string, limit = 5) =>
    fetchApi<BirdWeatherRecordingsResponse>(`/birdweather/recordings/${encodeURIComponent(sciName)}?limit=${limit}`),
}
