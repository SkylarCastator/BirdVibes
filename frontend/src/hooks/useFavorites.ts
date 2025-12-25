import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'birdnet-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]))
    } catch {
      // localStorage unavailable
    }
  }, [favorites])

  const toggleFavorite = useCallback((sciName: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(sciName)) {
        next.delete(sciName)
      } else {
        next.add(sciName)
      }
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (sciName: string) => favorites.has(sciName),
    [favorites]
  )

  const favoritesCount = favorites.size

  return { favorites, toggleFavorite, isFavorite, favoritesCount }
}
