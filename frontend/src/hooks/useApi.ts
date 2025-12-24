import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: api.getSummary,
    refetchInterval: 30000, // Refresh every 30s
  })
}

export function useTodayDetections(params?: { limit?: number; offset?: number; species?: string }) {
  return useQuery({
    queryKey: ['detections', 'today', params],
    queryFn: () => api.getTodayDetections(params),
    refetchInterval: 15000,
  })
}

export function useRecentDetections(limit = 10) {
  return useQuery({
    queryKey: ['detections', 'recent', limit],
    queryFn: () => api.getRecentDetections(limit),
    refetchInterval: 15000,
  })
}

export function useSpeciesList(params?: { sort?: string; date?: string }) {
  return useQuery({
    queryKey: ['species', 'list', params],
    queryFn: () => api.getSpeciesList(params),
  })
}

export function useSpeciesDetail(sciName: string) {
  return useQuery({
    queryKey: ['species', 'detail', sciName],
    queryFn: () => api.getSpeciesDetail(sciName),
    enabled: !!sciName,
  })
}

export function useSpeciesDetections(sciName: string, params?: { limit?: number; offset?: number; date?: string }) {
  return useQuery({
    queryKey: ['species', 'detections', sciName, params],
    queryFn: () => api.getSpeciesDetections(sciName, params),
    enabled: !!sciName,
  })
}

export function useRecordingDates() {
  return useQuery({
    queryKey: ['recordings', 'dates'],
    queryFn: api.getRecordingDates,
  })
}

export function useRecordingsByDate(date: string, params?: { limit?: number; species?: string }) {
  return useQuery({
    queryKey: ['recordings', date, params],
    queryFn: () => api.getRecordingsByDate(date, params),
    enabled: !!date,
  })
}

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: api.getConfig,
    staleTime: 60000,
  })
}

export function useDailyChart(date?: string) {
  return useQuery({
    queryKey: ['charts', 'daily', date],
    queryFn: () => api.getDailyChart(date),
  })
}

// Analytics hooks
export function useAnalyticsTimeline(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'timeline', days],
    queryFn: () => api.getAnalyticsTimeline(days),
  })
}

export function useAnalyticsHourly(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'hourly', days],
    queryFn: () => api.getAnalyticsHourly(days),
  })
}

export function useAnalyticsTopSpecies(days = 30, limit = 10) {
  return useQuery({
    queryKey: ['analytics', 'top-species', days, limit],
    queryFn: () => api.getAnalyticsTopSpecies(days, limit),
  })
}

export function useAnalyticsSeasonal() {
  return useQuery({
    queryKey: ['analytics', 'seasonal'],
    queryFn: api.getAnalyticsSeasonal,
  })
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: api.getAnalyticsSummary,
  })
}

// BirdWeather
export function useBirdWeatherStats() {
  return useQuery({
    queryKey: ['birdweather', 'stats'],
    queryFn: api.getBirdWeatherStats,
    retry: false,
    staleTime: 60000,
  })
}

export function useBirdWeatherRecordings(sciName: string, limit = 5) {
  return useQuery({
    queryKey: ['birdweather', 'recordings', sciName, limit],
    queryFn: () => api.getBirdWeatherRecordings(sciName, limit),
    enabled: !!sciName,
    retry: false,
    staleTime: 300000, // 5 min cache
  })
}

// Ornithophile - external bird data API
import type { OrnithophileBird } from '@/lib/types'

async function fetchOrnithophileBird(sciName: string): Promise<OrnithophileBird | null> {
  const res = await fetch(
    `https://ornithophile.vercel.app/api/birds?scientific_name=${encodeURIComponent(sciName)}`
  )
  if (!res.ok) return null
  const data = await res.json()
  return Array.isArray(data) && data.length > 0 ? data[0] : null
}

export function useOrnithophile(sciName: string) {
  return useQuery({
    queryKey: ['ornithophile', sciName],
    queryFn: () => fetchOrnithophileBird(sciName),
    enabled: !!sciName,
    retry: false,
    staleTime: 86400000, // 24h cache - data rarely changes
  })
}
